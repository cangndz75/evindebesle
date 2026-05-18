import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { iyzico, iyzicoCall, extractIyzicoItemTransactions } from "@/lib/iyzico";
import { resend, resendFromAddress } from "@/lib/resend";
import { createAdminNotification } from "@/lib/admin-notification";

const RETURN_CARGO_CODE = process.env.RETURN_CARGO_CODE || "DV-IADE-2026";
const RETURN_CARGO_COMPANY = process.env.RETURN_CARGO_COMPANY || "Yurtiçi Kargo";

/** Iyzico yanıtından banka / mutabakat için görünen referansları topla (hostReference, authCode, referenceCode). */
function extractBankReferenceFromIyzicoPayload(payload: any): string | null {
    if (!payload || typeof payload !== "object") return null;
    const host =
        payload.hostReference ??
        payload.host_reference ??
        payload.HostReference;
    const auth =
        payload.authCode ??
        payload.auth_code ??
        payload.AuthCode;
    const ref =
        payload.referenceCode ??
        payload.reference_code ??
        payload.ReferenceCode;
    const parts = [host, auth, ref].filter((x) => typeof x === "string" && x.trim().length > 0);
    return parts.length ? parts.join(" · ") : null;
}

function mergeBankReferenceCodes(existing: string | null | undefined, next: string | null): string | null {
    if (!next) return existing ?? null;
    if (!existing) return next;
    const set = new Set(
        existing
            .split(" | ")
            .map((s) => s.trim())
            .filter(Boolean)
    );
    set.add(next.trim());
    return Array.from(set).join(" | ");
}

function buildIyzicoConversationId(returnRequestId: string, suffix: string): string {
    const raw = `rt-${returnRequestId}-${suffix}`;
    return raw.length <= 64 ? raw : raw.slice(0, 64);
}

type IyzicoRefundOutcome = {
    success: boolean;
    message?: string;
    method?: "cancel" | "refund";
    raw?: any;
    bankReferenceCode?: string | null;
};

async function performIyzicoRefund(
    returnRequestId: string,
    order: {
        id: string;
        total: number;
        paymentId: string | null;
        paidAt: Date | null;
        payment?: { paymentId: string | null; rawResult: any } | null;
    },
    /** Checkout'ta basket id = productId olduğu için productId ile eşleştirme gerekir */
    returnItems: Array<{ orderItemId: string; productId: string; quantity: number }>
): Promise<IyzicoRefundOutcome> {
    const ip = "127.0.0.1";
    const paymentId = order.payment?.paymentId || order.paymentId;

    if (!paymentId) {
        return { success: false, message: "Iyzico ödeme ID bulunamadı." };
    }

    const isToday = order.paidAt
        ? new Date(order.paidAt).toDateString() === new Date().toDateString()
        : false;

    if (isToday) {
        try {
            const cancelConv = buildIyzicoConversationId(returnRequestId, "cnl");
            const cancelRes: any = await iyzicoCall<any>(
                (req, cb) => (iyzico as any).cancel.create(req, cb),
                { locale: "tr", conversationId: cancelConv, paymentId, ip }
            );

            if (cancelRes?.status === "success") {
                return {
                    success: true,
                    method: "cancel",
                    raw: cancelRes,
                    bankReferenceCode: extractBankReferenceFromIyzicoPayload(cancelRes),
                };
            }
        } catch (error) {
            console.error("[RETURN_REFUND] Cancel error, falling back to refund:", error);
        }
    }

    const itemTransactions = extractIyzicoItemTransactions(order.payment?.rawResult);

    if (itemTransactions.length === 0) {
        return { success: false, message: "İade işlemi için transaction bilgisi bulunamadı." };
    }

    const allItems = returnItems.length === 0;
    const refundResponses: any[] = [];
    let combinedBankRef: string | null = null;
    let refundIndex = 0;

    for (const tx of itemTransactions) {
        const paymentTransactionId = tx?.paymentTransactionId;
        if (!paymentTransactionId) continue;

        if (!allItems) {
            const txItemId = tx?.itemId as string | undefined;
            const isTargeted = returnItems.some(
                (ri) =>
                    ri.orderItemId === txItemId ||
                    ri.productId === txItemId
            );
            if (txItemId && !isTargeted) continue;
        }

        const txPrice = Number(tx?.paidPrice ?? tx?.price ?? 0);
        if (txPrice <= 0) continue;

        const refundConv = buildIyzicoConversationId(
            returnRequestId,
            `r${refundIndex}-${String(paymentTransactionId).slice(-12)}`
        );
        refundIndex += 1;

        const refundRes: any = await iyzicoCall<any>(
            (req, cb) => (iyzico as any).refund.create(req, cb),
            {
                locale: "tr",
                conversationId: refundConv,
                paymentTransactionId,
                price: txPrice.toFixed(2),
                ip,
                currency: "TRY",
            }
        );

        refundResponses.push(refundRes);
        if (refundRes?.status !== "success") {
            return {
                success: false,
                message: refundRes?.errorMessage || "İade işlemi başlatılamadı.",
                raw: refundResponses,
                bankReferenceCode: combinedBankRef,
            };
        }
        combinedBankRef = mergeBankReferenceCodes(
            combinedBankRef,
            extractBankReferenceFromIyzicoPayload(refundRes)
        );
    }

    if (refundResponses.length === 0) {
        return {
            success: false,
            message:
                "İade başlatmak için uygun transaction bulunamadı. Ödeme kaydındaki kalem id'leri ile iade satırları eşleşmiyor olabilir; destek ile iletişime geçin.",
        };
    }

    return {
        success: true,
        method: "refund",
        raw: refundResponses,
        bankReferenceCode: combinedBankRef,
    };
}

function getCustomerEmail(order: any): string | null {
    return (
        order.email ||
        order.user?.email ||
        order.shippingAddress?.email ||
        order.billingAddress?.email ||
        null
    );
}

async function sendReturnEmail(to: string, subject: string, html: string) {
    try {
        await resend.emails.send({
            from: resendFromAddress(),
            to,
            subject,
            html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:600px;margin:0 auto">${html}</div>`,
        });
    } catch (error) {
        console.error("[RETURN_EMAIL]", error);
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true },
        });

        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;

        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id },
            include: {
                user: { select: { name: true, email: true, phone: true } },
                order: {
                    include: {
                        payment: { select: { paymentId: true, rawResult: true } },
                        shippingAddress: { include: { district: true } },
                        billingAddress: { select: { email: true } },
                        items: {
                            include: {
                                product: { select: { id: true, name: true, image: true, primaryImage: true } },
                                color: { select: { name: true } },
                                size: { select: { name: true } },
                            },
                        },
                    },
                },
                items: {
                    include: {
                        orderItem: {
                            include: {
                                product: { select: { id: true, name: true, image: true, primaryImage: true } },
                                color: { select: { name: true } },
                                size: { select: { name: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!returnRequest) {
            return NextResponse.json({ error: "İade bulunamadı" }, { status: 404 });
        }

        return NextResponse.json(returnRequest);
    } catch (error: any) {
        console.error("[ADMIN_RETURN_GET]", error);
        return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true },
        });

        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { action, adminNote } = body;

        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id },
            include: {
                user: { select: { name: true, email: true } },
                order: {
                    include: {
                        user: { select: { email: true } },
                        payment: { select: { paymentId: true, rawResult: true } },
                        shippingAddress: { select: { email: true } },
                        billingAddress: { select: { email: true } },
                    },
                },
                items: {
                    include: {
                        orderItem: {
                            select: {
                                id: true,
                                productId: true,
                                productName: true,
                                colorId: true,
                                sizeId: true,
                                quantity: true,
                                unitPrice: true,
                                totalPrice: true,
                            },
                        },
                    },
                },
            },
        });

        if (!returnRequest) {
            return NextResponse.json({ error: "İade bulunamadı" }, { status: 404 });
        }

        const customerEmail = getCustomerEmail(returnRequest.order);
        const orderNumber = returnRequest.order.orderNumber;

        // STATE MACHINE: RECEIVED
        if (action === "receive") {
            if (returnRequest.status !== "PENDING") {
                return NextResponse.json(
                    { error: "Sadece bekleyen iadeler teslim alınabilir." },
                    { status: 400 }
                );
            }

            await prisma.$transaction([
                prisma.returnRequest.update({
                    where: { id },
                    data: {
                        status: "RECEIVED",
                        receivedAt: new Date(),
                        adminNote: adminNote || returnRequest.adminNote,
                    },
                }),
                prisma.order.update({
                    where: { id: returnRequest.orderId },
                    data: { status: "RETURN_REQUESTED" },
                }),
                prisma.auditLog.create({
                    data: {
                        entityId: id,
                        entityType: "RETURN",
                        action: "RETURN_RECEIVED",
                        details: { returnId: id, orderId: returnRequest.orderId },
                        performedById: session.user.id,
                    },
                }),
            ]);

            if (customerEmail) {
                await sendReturnEmail(
                    customerEmail,
                    `İade ürününüz teslim alındı - ${orderNumber}`,
                    `<h2>İade Ürününüz Depoya Ulaştı</h2>
                     <p>Sipariş No: <strong>${orderNumber}</strong></p>
                     <p>İade ettiğiniz ürün(ler) depomuzda teslim alındı ve inceleme sürecine başlanmıştır.</p>
                     <p>İnceleme tamamlandığında size bilgi verilecektir.</p>
                     <p style="color:#666;font-size:13px;margin-top:24px">Dark Velvet</p>`
                );
            }

            return NextResponse.json({ success: true, status: "RECEIVED" });
        }

        // STATE MACHINE: REJECT
        if (action === "reject") {
            if (returnRequest.status !== "PENDING" && returnRequest.status !== "RECEIVED") {
                return NextResponse.json(
                    { error: "Bu iade reddedilemez." },
                    { status: 400 }
                );
            }

            const rejectReason = adminNote || "Ürün iade şartlarını karşılamamaktadır.";

            await prisma.$transaction([
                prisma.returnRequest.update({
                    where: { id },
                    data: {
                        status: "REJECTED",
                        adminNote: rejectReason,
                    },
                }),
                prisma.order.update({
                    where: { id: returnRequest.orderId },
                    data: { status: "DELIVERED" },
                }),
                prisma.auditLog.create({
                    data: {
                        entityId: id,
                        entityType: "RETURN",
                        action: "RETURN_REJECTED",
                        details: { returnId: id, reason: rejectReason },
                        performedById: session.user.id,
                    },
                }),
            ]);

            if (customerEmail) {
                await sendReturnEmail(
                    customerEmail,
                    `İade talebiniz reddedildi - ${orderNumber}`,
                    `<h2>İade Talebiniz Reddedildi</h2>
                     <p>Sipariş No: <strong>${orderNumber}</strong></p>
                     <p><strong>Ret Nedeni:</strong> ${rejectReason}</p>
                     <p>Ürün size geri gönderilecektir. Sorularınız için destek ekibimizle iletişime geçebilirsiniz.</p>
                     <p style="color:#666;font-size:13px;margin-top:24px">Dark Velvet</p>`
                );
            }

            return NextResponse.json({ success: true, status: "REJECTED" });
        }

        // STATE MACHINE: REFUND (Approve + Iyzico Refund)
        if (action === "refund") {
            if (returnRequest.status === "REFUNDED") {
                return NextResponse.json({
                    success: true,
                    status: "REFUNDED",
                    idempotent: true,
                    refundAmount: returnRequest.refundAmount,
                    bankReferenceCode: returnRequest.bankReferenceCode,
                    iyzicoMethod: "already_completed",
                });
            }

            if (returnRequest.status !== "RECEIVED" && returnRequest.status !== "APPROVED") {
                return NextResponse.json(
                    { error: "İade onayı için önce ürün teslim alınmalıdır." },
                    { status: 400 }
                );
            }

            type RefundLine = {
                quantity: number;
                orderItem: {
                    id: string;
                    productId: string;
                    colorId: string | null;
                    sizeId: string | null;
                    unitPrice: number;
                    totalPrice: number;
                };
            };
            const refundLines = returnRequest.items as RefundLine[];

            const refundResult = await performIyzicoRefund(
                returnRequest.id,
                {
                    id: returnRequest.order.id,
                    total: returnRequest.order.total,
                    paymentId: returnRequest.order.paymentId,
                    paidAt: returnRequest.order.paidAt,
                    payment: returnRequest.order.payment,
                },
                refundLines.map((item) => ({
                    orderItemId: item.orderItem.id,
                    productId: item.orderItem.productId,
                    quantity: item.quantity,
                }))
            );

            if (!refundResult.success) {
                return NextResponse.json(
                    { error: refundResult.message || "Iyzico iade işlemi başarısız oldu." },
                    { status: 400 }
                );
            }

            const refundAmount = refundLines.reduce(
                (sum, item) => sum + item.orderItem.unitPrice * item.quantity,
                0
            );

            let dbIdempotent = false;
            try {
                await prisma.$transaction(async (tx: any) => {
                    const claimed = await tx.returnRequest.updateMany({
                        where: {
                            id,
                            status: { in: ["RECEIVED", "APPROVED"] },
                        },
                        data: {
                            status: "REFUNDED",
                            refundedAt: new Date(),
                            refundAmount,
                            bankReferenceCode: refundResult.bankReferenceCode ?? null,
                            adminNote: adminNote || returnRequest.adminNote,
                        },
                    });

                    if (claimed.count === 0) {
                        const current = await tx.returnRequest.findUnique({
                            where: { id },
                            select: { status: true },
                        });
                        if (current?.status === "REFUNDED") {
                            dbIdempotent = true;
                            return;
                        }
                        throw new Error("INVALID_REFUND_STATE");
                    }

                    await tx.order.update({
                        where: { id: returnRequest.orderId },
                        data: {
                            status: "REFUNDED",
                            paymentStatus: "REFUNDED",
                        },
                    });

                    for (const item of refundLines) {
                        const { productId, sizeId, colorId } = item.orderItem;

                        let variantId = null;
                        if (sizeId || colorId) {
                            const variant = await tx.productVariant.findFirst({
                                where: {
                                    productId,
                                    sizeId: sizeId || undefined,
                                    colorId: colorId || undefined,
                                },
                            });
                            variantId = variant?.id;
                        }

                        await tx.stockMovement.create({
                            data: {
                                productId,
                                variantId,
                                quantity: item.quantity,
                                type: "RETURN",
                                reason: `İade Onayı #${id}`,
                                userId: session.user.id,
                            },
                        });
                    }

                    await tx.auditLog.create({
                        data: {
                            entityId: id,
                            entityType: "RETURN",
                            action: "RETURN_REFUNDED",
                            details: {
                                returnId: id,
                                refundAmount,
                                iyzicoMethod: refundResult.method,
                                bankReferenceCode: refundResult.bankReferenceCode ?? null,
                            },
                            performedById: session.user.id,
                        },
                    });
                });
            } catch (dbErr: any) {
                console.error("[RETURN_REFUND] DB transaction failed after Iyzico success", {
                    returnId: id,
                    orderId: returnRequest.orderId,
                    bankReferenceCode: refundResult.bankReferenceCode,
                    error: dbErr?.message,
                });
                return NextResponse.json(
                    {
                        error:
                            "İade ödeme kuruluşunda tamamlandı ancak sipariş kayıtları güncellenemedi. Lütfen destek ekibiyle iletişime geçin.",
                        bankReferenceCode: refundResult.bankReferenceCode,
                        partial: true,
                    },
                    { status: 500 }
                );
            }

            if (dbIdempotent) {
                return NextResponse.json({
                    success: true,
                    status: "REFUNDED",
                    idempotent: true,
                    refundAmount: returnRequest.refundAmount ?? refundAmount,
                    bankReferenceCode: returnRequest.bankReferenceCode ?? refundResult.bankReferenceCode,
                    iyzicoMethod: refundResult.method,
                });
            }

            await createAdminNotification({
                type: "RETURN",
                title: "İade Onaylandı & Ücret İade Edildi",
                message: `#${orderNumber} siparişi için ${refundAmount.toFixed(2)} TL iade edildi.${
                    refundResult.bankReferenceCode
                        ? ` Banka referansı: ${refundResult.bankReferenceCode}`
                        : ""
                }`,
                link: `/admin-returns?returnId=${id}`,
            });

            const bankRefHtml = refundResult.bankReferenceCode
                ? `<p>Banka / mutabakat referansı: <strong style="font-family:monospace">${refundResult.bankReferenceCode}</strong></p>
                   <p style="font-size:13px;color:#666">Paranız hesabınıza yansımazsa bankanıza bu referans ile sorabilirsiniz.</p>`
                : "";

            if (customerEmail) {
                await sendReturnEmail(
                    customerEmail,
                    `İade ücretiniz yatırıldı - ${orderNumber}`,
                    `<h2>İade İşleminiz Tamamlandı</h2>
                     <p>Sipariş No: <strong>${orderNumber}</strong></p>
                     <p>İade talebiniz onaylanmış ve <strong>${refundAmount.toFixed(2)} TL</strong> tutarındaki ücret kartınıza iade edilmiştir.</p>
                     ${bankRefHtml}
                     <p>İade tutarının kartınıza yansıması bankanıza bağlı olarak 1-10 iş günü sürebilir.</p>
                     <p style="color:#666;font-size:13px;margin-top:24px">Dark Velvet</p>`
                );
            }

            return NextResponse.json({
                success: true,
                status: "REFUNDED",
                refundAmount,
                bankReferenceCode: refundResult.bankReferenceCode,
                iyzicoMethod: refundResult.method,
            });
        }

        return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
    } catch (error: any) {
        console.error("[ADMIN_RETURN_PATCH]", error);
        return NextResponse.json(
            { error: "İade işlemi sırasında hata oluştu." },
            { status: 500 }
        );
    }
}
