import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeIdempotencyKey } from "@/lib/idempotency";
import { reserveStockTx } from "@/lib/stock";
import { iyzico, iyzicoCall } from "@/lib/iyzico";
import { checkRateLimit, getClientIdentifier, RateLimits } from "@/lib/rateLimit";
import { clearRedisCart, persistRedisCartToDatabase } from "@/lib/cart-redis";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function POST(req: Request) {
    try {
        const ip = getClientIdentifier(req);
        const rateKey = `checkout:${ip}`;
        const paymentRate = await checkRateLimit(rateKey, RateLimits.payment);
        if (!paymentRate.success) {
            return NextResponse.json(
                { error: "Çok fazla ödeme denemesi. Lütfen bir dakika sonra tekrar deneyin." },
                { status: 429 }
            );
        }

        const idem = normalizeIdempotencyKey(req.headers.get("Idempotency-Key"));
        const body = await req.json();
        const session = await getServerSession(authConfig);

        let resolvedUserId = body.userId || session?.user?.id || null;
        if (!resolvedUserId && body?.email) {
            const matchedUser = await prisma.user.findUnique({
                where: { email: body.email },
                select: { id: true },
            });
            resolvedUserId = matchedUser?.id || null;
        }

        if (!resolvedUserId) {
            return NextResponse.json(
                { error: "Kullanıcı doğrulanamadı. Lütfen tekrar giriş yapın." },
                { status: 401 }
            );
        }

        const normalizedPhone = String(body?.billingAddress?.phone || "").replace(/\D/g, "");
        const phoneIsValid = normalizedPhone.startsWith("0")
            ? normalizedPhone.length === 11
            : normalizedPhone.length === 10;
        const normalizedZipCode = String(body?.billingAddress?.zipCode || "").replace(/\D/g, "");

        if (!phoneIsValid) {
            return NextResponse.json(
                { error: "Telefon numarası geçersiz. 0 ile başlıyorsa 11, başlamıyorsa 10 hane olmalıdır." },
                { status: 400 }
            );
        }

        if (normalizedZipCode.length > 0 && normalizedZipCode.length !== 5) {
            return NextResponse.json(
                { error: "Posta kodu girildiyse 5 hane olmalıdır." },
                { status: 400 }
            );
        }

        if (resolvedUserId) {
            try {
                await persistRedisCartToDatabase(resolvedUserId);
            } catch (persistErr) {
                console.warn("Checkout cart persist warning:", persistErr);
            }
        }

        const existing = await prisma.order.findUnique({
            where: { idempotencyKey: idem },
            include: { payment: true, items: true },
        });

        if (existing?.payment?.token) {
            return NextResponse.json({
                orderId: existing.id,
                status: existing.status,
                checkoutFormContent: existing.payment.rawResult ? (existing.payment.rawResult as any).checkoutFormContent : undefined,
                paymentPageUrl: existing.payment.rawResult ? (existing.payment.rawResult as any).paymentPageUrl : undefined,
            });
        }

        const orderItemsData = [];
        let subtotal = 0;

        for (const item of body.items) {
            let variant = await prisma.productVariant.findFirst({
                where: {
                    productId: item.productId,
                    colorId: item.colorId || null,
                    sizeId: item.sizeId || null,
                },
                include: {
                    product: true,
                }
            });

            if (!variant) {
                variant = await prisma.productVariant.findUnique({
                    where: { id: item.productId },
                    include: {
                        product: true,
                    }
                });
            }

            if (!variant && (item.colorId || item.sizeId)) {
                variant = await prisma.productVariant.findFirst({
                    where: {
                        productId: item.productId,
                        ...(item.colorId ? { colorId: item.colorId } : {}),
                        ...(item.sizeId ? { sizeId: item.sizeId } : {}),
                    },
                    include: {
                        product: true,
                    }
                });
            }

            if (!variant) {
                return NextResponse.json({
                    error: `Ürün varyantı bulunamadı: ${item.productId}. Sepetinizi güncelleyip tekrar deneyin.`
                }, { status: 400 });
            }

            if (variant.product.isTrackInventory && !variant.product.allowBackorders) {
                const availableStock = variant.stock - (variant.stockReserved || 0);
                if (availableStock < item.quantity) {
                    return NextResponse.json({
                        error: `"${variant.product.name}" için yeterli stok yok. Mevcut: ${availableStock}`
                    }, { status: 400 });
                }
            }

            const price = variant.price || variant.product.price;
            const lineTotal = Number(price) * item.quantity;
            subtotal += lineTotal;

            orderItemsData.push({
                productId: variant.productId,
                colorId: item.colorId || null,
                sizeId: item.sizeId || null,
                productName: variant.product.name,
                colorName: item.colorName || null,
                sizeName: item.sizeName || null,
                unitPrice: Number(price),
                quantity: item.quantity,
                totalPrice: lineTotal,
                categoryId: variant.product.categoryId,
                gender: variant.product.gender,
                _variantId: variant.id
            });
        }

        const shipping = Number(body.shippingPrice || 0);

        let discount = 0;
        let couponId: string | null = null;

        if (body.couponCode) {
            const coupon = await prisma.coupon.findUnique({
                where: { code: body.couponCode }
            });

            const isExpired = coupon?.expiresAt && coupon.expiresAt < new Date();
            const isMaxed = coupon?.maxUsage && coupon.usageCount >= coupon.maxUsage;

            if (coupon && coupon.isActive && !isExpired && !isMaxed) {
                couponId = coupon.id;

                const eligibleItems = orderItemsData.filter((item: any) => {
                    const catMatch = coupon.categoryId ? item.categoryId === coupon.categoryId : true;
                    const genderMatch = coupon.gender ? item.gender === coupon.gender : true;
                    return catMatch && genderMatch;
                });

                const eligibleSubtotal = eligibleItems.reduce((acc: number, item: any) => acc + item.totalPrice, 0);

                if (eligibleItems.length > 0) {
                    if (coupon.discountType === "PERCENT") {
                        discount = (eligibleSubtotal * coupon.value) / 100;
                    } else {
                        discount = coupon.value;
                    }
                }

                if (discount > eligibleSubtotal) discount = eligibleSubtotal;
            } else if (body.couponCode) {
                return NextResponse.json({ error: "Böyle bir kupon yoktur" }, { status: 400 });
            }
        }

        const total = subtotal + shipping - discount;
        const currency = "TRY";

        if (body.paymentMethod === "TEST") {
            const order = await prisma.order.create({
                data: {
                    orderNumber: `DV-${Date.now()}`,
                    userId: resolvedUserId,
                    email: body.email,
                    currency,
                    subtotal,
                    shippingCost: shipping,
                    discount,
                    total,
                    couponId: couponId,
                    status: "PENDING_PAYMENT", // Will be updated to PAID if successful, or we can set PAID immediately for test
                    paymentStatus: "PAID", // Lowercase enum match if needed, checks schema
                    idempotencyKey: idem,
                    items: {
                        create: orderItemsData.map(({ _variantId, categoryId, gender, ...rest }: any) => rest)
                    },
                    payment: {
                        create: {
                            provider: "TEST",
                            status: "PAID",
                            paymentId: `TEST-${Date.now()}`,
                            conversationId: `TEST-CONV-${Date.now()}`
                        }
                    },
                },
                include: { items: true, payment: true },
            });

            await reserveStockTx(
                order.id,
                orderItemsData.map((i: any) => ({ variantId: i._variantId, qty: i.quantity })),
                15
            );

            if (body.email) {
                try {
                    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    const lastClick = await prisma.emailSend.findFirst({
                        where: { email: body.email, clickedAt: { gte: yesterday } },
                        orderBy: { clickedAt: 'desc' }
                    });
                    if (lastClick) {
                        await prisma.emailSend.update({
                            where: { id: lastClick.id },
                            data: { convertedAt: new Date(), revenue: total }
                        });
                    }
                } catch (e) {
                    console.error("Attribution Error:", e);
                }
            }

            if (resolvedUserId) {
                await prisma.cartItem.deleteMany({
                    where: { userId: resolvedUserId }
                });
                await clearRedisCart(resolvedUserId);
            }

            return NextResponse.json({
                orderId: order.id,
                paymentPageUrl: `/success?orderId=${order.id}`, // Direct redirect
                status: "success"
            });
        }

        const order = await prisma.order.create({
            data: {
                orderNumber: `DV-${Date.now()}`,
                userId: resolvedUserId,
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
                    create: orderItemsData.map(({ _variantId, categoryId, gender, ...rest }: any) => rest)
                },
                payment: { create: { provider: "IYZICO", status: "INITIATED" } },
            },
            include: { items: true, payment: true },
        });

        if (body.email) {
            try {
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
            }
        }

        await reserveStockTx(
            order.id,
            orderItemsData.map((i: any) => ({ variantId: i._variantId, qty: i.quantity })),
            15
        );

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

        const initRes: any = await iyzicoCall<any>(
            (request, cb) => (iyzico as any).checkoutFormInitialize.create(request, cb),
            iyzicoReq
        );

        if (initRes.status !== "success") {
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
            checkoutFormContent: initRes.checkoutFormContent,
            paymentPageUrl: initRes.paymentPageUrl,
        });

    } catch (error: any) {
        console.error("Checkout Init Error:", error);
        return NextResponse.json({ error: "CHECKOUT_INIT_EXCEPTION" }, { status: 500 });
    }
}
