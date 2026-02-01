import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeIdempotencyKey } from "@/lib/idempotency";
import { reserveStockTx } from "@/lib/stock";
import { iyzico, iyzicoCall } from "@/lib/iyzico";

export async function POST(req: Request) {
    try {
        const idem = normalizeIdempotencyKey(req.headers.get("Idempotency-Key"));
        const body = await req.json();

        // 1) Idempotent check
        const existing = await prisma.order.findUnique({
            where: { idempotencyKey: idem },
            include: { payment: true, items: true },
        });

        if (existing?.payment?.token) {
            return NextResponse.json({
                orderId: existing.id,
                token: existing.payment.token,
                status: existing.status,
                checkoutFormContent: existing.payment.rawResult ? (existing.payment.rawResult as any).checkoutFormContent : undefined,
                paymentPageUrl: existing.payment.rawResult ? (existing.payment.rawResult as any).paymentPageUrl : undefined,
            });
        }

        // 2) Verify products and prices
        const orderItemsData = [];
        let subtotal = 0;

        for (const item of body.items) {
            const variant = await prisma.productVariant.findFirst({
                where: {
                    productId: item.productId,
                    colorId: item.colorId || null,
                    sizeId: item.sizeId || null,
                },
                include: {
                    product: {
                        include: { category: true }
                    }
                }
            });

            if (!variant) {
                return NextResponse.json({ error: `Ürün varyantı bulunamadı: ${item.productId}` }, { status: 400 });
            }

            const price = variant.price || variant.product.price;
            const lineTotal = Number(price) * item.quantity;
            subtotal += lineTotal;

            orderItemsData.push({
                productId: item.productId,
                colorId: item.colorId || null,
                sizeId: item.sizeId || null,
                productName: variant.product.name,
                colorName: item.colorName || null,
                sizeName: item.sizeName || null,
                unitPrice: Number(price),
                quantity: item.quantity,
                totalPrice: lineTotal,
                // variantId is internal, we don't save it to OrderItem directly but we use it for stock reservation
                _variantId: variant.id,
                productCategory: variant.product.category?.name || "General"
            });
        }

        const shipping = Number(body.shippingPrice || 0);

        // Coupon logic
        let discount = 0;
        let couponId: string | null = null;

        if (body.couponCode) {
            const coupon = await prisma.coupon.findUnique({
                where: { code: body.couponCode }
            });

            if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
                couponId = coupon.id;
                if (coupon.discountType === "PERCENT") {
                    discount = (subtotal * coupon.value) / 100;
                } else {
                    discount = coupon.value;
                }
                if (discount > subtotal) discount = subtotal;
            }
        }

        const total = subtotal + shipping - discount;
        const currency = "TRY";

        // 3) Create Order
        const order = await prisma.order.create({
            data: {
                orderNumber: `DV-${Date.now()}`,
                userId: body.userId ?? null,
                email: body.email,
                currency,
                subtotal,
                shippingCost: shipping,
                discount,
                total,
                couponId: couponId,
                status: "PENDING_PAYMENT",
                idempotencyKey: idem,
                items: {
                    create: orderItemsData.map(({ _variantId, ...rest }: any) => rest)
                },
                payment: { create: { provider: "IYZICO", status: "INITIATED" } },
            },
            include: { items: true, payment: true },
        });

        // 3.5) Attribution: Check if user has clicked an email recently
        if (body.email) {
            try {
                // Find last clicked email within 24 hours
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const lastClick = await prisma.emailSend.findFirst({
                    where: {
                        email: body.email,
                        clickedAt: { gte: yesterday }
                    },
                    orderBy: { clickedAt: 'desc' }
                });

                if (lastClick) {
                    await prisma.emailSend.update({
                        where: { id: lastClick.id },
                        data: {
                            convertedAt: new Date(),
                            revenue: total // Track potential revenue
                        }
                    });
                }
            } catch (e) {
                console.error("Attribution Error:", e);
                // Don't block checkout
            }
        }

        // 4) Reserve Stock (15 mins)
        await reserveStockTx(
            order.id,
            orderItemsData.map((i: any) => ({ variantId: i._variantId, qty: i.quantity })),
            15
        );

        // 5) Iyzico Request
        const conversationId = order.id;
        const buyerIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

        const iyzicoReq = {
            locale: "tr",
            conversationId,
            price: subtotal.toFixed(2),
            paidPrice: total.toFixed(2),
            currency: "TRY",
            basketId: order.orderNumber,
            paymentGroup: "PRODUCT",
            callbackUrl: `${process.env.APP_URL}/api/iyzico/callback?orderId=${order.id}`,
            enabledInstallments: [2, 3, 6, 9, 12],
            buyer: {
                id: order.userId ?? order.email,
                name: body.billingAddress?.firstName || "Misafir",
                surname: body.billingAddress?.lastName || "Kullanıcı",
                gsmNumber: body.billingAddress?.phone || "+905555555555",
                email: body.email,
                identityNumber: "11111111111", // Required by Iyzico
                lastLoginDate: "2015-10-05 12:43:35",
                registrationDate: "2013-04-21 15:12:09",
                registrationAddress: body.billingAddress?.addressLine1 || "N/A",
                ip: buyerIp,
                city: body.billingAddress?.city || "Istanbul",
                country: body.billingAddress?.country || "Turkey",
                zipCode: body.billingAddress?.zipCode || "34732",
            },
            shippingAddress: {
                contactName: `${body.shippingAddress?.firstName} ${body.shippingAddress?.lastName}`,
                city: body.shippingAddress?.city || "Istanbul",
                country: body.shippingAddress?.country || "Turkey",
                address: body.shippingAddress?.addressLine1 || "N/A",
                zipCode: body.shippingAddress?.zipCode || "34732",
            },
            billingAddress: {
                contactName: `${body.billingAddress?.firstName} ${body.billingAddress?.lastName}`,
                city: body.billingAddress?.city || "Istanbul",
                country: body.billingAddress?.country || "Turkey",
                address: body.billingAddress?.addressLine1 || "N/A",
                zipCode: body.billingAddress?.zipCode || "34732",
            },
            basketItems: orderItemsData.map((it: any) => ({
                id: it.productId,
                name: it.productName,
                category1: it.productCategory || "General",
                itemType: "PHYSICAL",
                price: it.totalPrice.toFixed(2),
            })),
        };

        const initRes: any = await iyzicoCall<any>((iyzico as any).checkoutFormInitialize.bind(iyzico), iyzicoReq);

        if (initRes.status !== "success") {
            // payment failed, unreserve stock? Or just wait for expiry? 
            // Better to fail fast.
            await prisma.paymentAttempt.update({
                where: { orderId: order.id },
                data: { status: "FAILED", rawResult: initRes },
            });
            await prisma.order.update({
                where: { id: order.id },
                data: { status: "PAYMENT_FAILED" },
            });

            return NextResponse.json({ error: initRes.errorMessage || "Iyzico init failed" }, { status: 400 });
        }

        // Success - save token
        await prisma.paymentAttempt.update({
            where: { orderId: order.id },
            data: {
                conversationId,
                token: initRes.token,
                rawResult: initRes,
                status: "INITIATED",
            },
        });

        return NextResponse.json({
            orderId: order.id,
            token: initRes.token,
            checkoutFormContent: initRes.checkoutFormContent,
            paymentPageUrl: initRes.paymentPageUrl,
        });

    } catch (error: any) {
        console.error("Checkout Init Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
