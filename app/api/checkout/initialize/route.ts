import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeIdempotencyKey } from "@/lib/idempotency";
import { releaseExpiredReservations, releaseReservationTx, reserveStockTx } from "@/lib/stock";
import { iyzico, iyzicoCall } from "@/lib/iyzico";
import { clearRedisCart, persistRedisCartToDatabase } from "@/lib/cart-redis";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { finalizePayment } from "@/lib/services/payment";
import { calculateShippingCost } from "@/lib/shipping";
import crypto from "crypto";
import { detectCardDataInPayload } from "@/lib/security/pci";
import { CheckoutSchema } from "@/lib/validation/checkout";
import { deactivateExpiredCoupons } from "@/lib/coupons/deactivateExpiredCoupons";
import {
    computeCampaignDiscount,
    getActiveCampaignBanner,
} from "@/lib/campaign-banner";
import { resolveOrderLineImageAbsoluteUrl } from "@/lib/resolve-order-line-image";

export async function POST(req: Request) {
    const idemScope = "checkout.initialize";
    let idem: string | null = null;
    let idempotencyLocked = false;

    try {
        const reqUrl = new URL(req.url);
        const appBaseUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_BASE_URL || reqUrl.origin).replace(/\/$/, "");

        await releaseExpiredReservations();

        const rawIdempotencyKey = req.headers.get("x-idempotency-key") || req.headers.get("Idempotency-Key");
        idem = normalizeIdempotencyKey(rawIdempotencyKey);
        if (!idem) {
            return NextResponse.json(
                { error: "x-idempotency-key zorunludur ve en az 10 karakter olmal\u0131d\u0131r." },
                { status: 400 }
            );
        }

        const rawBody = await req.json();

        const parsed = CheckoutSchema.safeParse(rawBody);
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message || "Geçersiz istek verisi.";
            return NextResponse.json({ error: firstError }, { status: 400 });
        }
        const body = parsed.data;

        if (body.paymentMethod === "TEST" && process.env.NODE_ENV === "production") {
            return NextResponse.json(
                { error: "TEST ödeme yöntemi üretim ortamında kullanılamaz." },
                { status: 403 }
            );
        }

        const cardDataFindings = detectCardDataInPayload(body);
        if (cardDataFindings.length > 0) {
            return NextResponse.json(
                {
                    error: "PCI_DSS_VIOLATION",
                    message: "Doğrudan kart verisi gönderimi yasaktır. Hosted checkout akışını kullanın.",
                    rejectedFields: cardDataFindings.slice(0, 5),
                },
                { status: 400 }
            );
        }

        const now = new Date();
        const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const existingIdempotency = await prisma.idempotencyRequest.findUnique({
            where: {
                scope_key: {
                    scope: idemScope,
                    key: idem,
                },
            },
        });

        if (existingIdempotency && existingIdempotency.expiresAt > now) {
            if (existingIdempotency.status === "SUCCESS" && existingIdempotency.response) {
                return NextResponse.json(existingIdempotency.response as any);
            }

            if (existingIdempotency.status === "PROCESSING") {
                return NextResponse.json(
                    { error: "Bu \u00f6deme iste\u011fi halen i\u015fleniyor. L\u00fctfen birka\u00e7 saniye sonra tekrar deneyin." },
                    { status: 409 }
                );
            }
        }

        const session = await getServerSession(authConfig);

        // P0: İstemciden gelen body.userId yok sayılır; oturum varsa yalnızca session.user.id kullanılır.
        let resolvedUserId: string | null = session?.user?.id ?? null;
        if (!resolvedUserId && body?.email) {
            const matchedUser = await prisma.user.findUnique({
                where: { email: body.email },
                select: { id: true },
            });
            resolvedUserId = matchedUser?.id || null;
        }

        if (!resolvedUserId) {
            const guestName = (body?.billingAddress?.firstName || "Misafir") + " " + (body?.billingAddress?.lastName || "Kullan\u0131c\u0131");
            const guestEmail = body?.email || body?.billingAddress?.email || body?.shippingAddress?.email || null;
            const guestPhone = body?.billingAddress?.phone || body?.shippingAddress?.phone || null;
            if (!guestEmail) {
                return NextResponse.json(
                    { error: "E-posta zorunludur." },
                    { status: 400 }
                );
            }
            try {
                const guestUser = await prisma.user.create({
                    data: {
                        name: guestName,
                        email: guestEmail,
                        phone: guestPhone,
                        isGuest: true,
                        password: null,
                        marketingEmailConsent: Boolean(body?.newsletterConsent),
                    },
                    select: { id: true },
                });
                resolvedUserId = guestUser.id;
            } catch (createErr: any) {
                if (createErr?.code === "P2002") {
                    const existing = await prisma.user.findUnique({
                        where: { email: guestEmail },
                        select: { id: true },
                    });
                    if (existing) {
                        resolvedUserId = existing.id;
                    } else {
                        throw createErr;
                    }
                } else {
                    throw createErr;
                }
            }
        }

        let selectedAddressId: string | null = body?.selectedUserAddressId || null;
        let selectedAddressRecord: any = null;

        if (selectedAddressId) {
            selectedAddressRecord = await prisma.userAddress.findFirst({
                where: {
                    id: selectedAddressId,
                    userId: resolvedUserId,
                },
                include: {
                    district: true,
                },
            });

            if (!selectedAddressRecord) {
                return NextResponse.json(
                    { error: "Se\u00e7ilen kay\u0131tl\u0131 adres bulunamad\u0131." },
                    { status: 400 }
                );
            }
        }

        const normalizedPhone = String(body?.billingAddress?.phone || "").replace(/\D/g, "");
        let localPhone = "";
        if (normalizedPhone.startsWith("0090") && normalizedPhone.length === 14) {
            localPhone = normalizedPhone.slice(4);
        } else if (normalizedPhone.startsWith("90") && normalizedPhone.length === 12) {
            localPhone = normalizedPhone.slice(2);
        } else if (normalizedPhone.startsWith("0") && normalizedPhone.length === 11) {
            localPhone = normalizedPhone.slice(1);
        } else if (normalizedPhone.length === 10) {
            localPhone = normalizedPhone;
        }
        const phoneIsValid = /^5\d{9}$/.test(localPhone);
        const iyzicoGsmNumber = `+90${localPhone}`;
        const normalizedZipCode = String(body?.billingAddress?.zipCode || "").replace(/\D/g, "");

        if (!phoneIsValid) {
            return NextResponse.json(
                { error: "Telefon numarası geçersiz. 10 haneli GSM numarası girin (5 ile başlamalı)." },
                { status: 400 }
            );
        }

        if (normalizedZipCode.length > 0 && normalizedZipCode.length !== 5) {
            return NextResponse.json(
                { error: "Posta kodu girildiyse 5 hane olmal\u0131d\u0131r." },
                { status: 400 }
            );
        }

        if (body?.newsletterConsent && typeof body?.email === "string") {
            const em = body.email.trim().toLowerCase();
            if (em.includes("@")) {
                try {
                    await prisma.subscriber.upsert({
                        where: { email: em },
                        update: { isActive: true },
                        create: { email: em, isActive: true },
                    });
                } catch (e) {
                    console.warn("Newsletter subscriber upsert skipped:", e);
                }
            }
        }

        if (resolvedUserId) {
            try {
                await persistRedisCartToDatabase(resolvedUserId);
            } catch (persistErr) {
                console.warn("Checkout cart persist warning:", persistErr);
            }
        }

        const existing = await prisma.order.findFirst({
            where: {
                idempotencyKey: idem,
                deletedAt: null,
                createdAt: { gte: twentyFourHoursAgo },
            },
            include: { payment: true, items: true },
            orderBy: { createdAt: "desc" },
        });

        if (existing?.payment?.token) {
            const existingPayload = {
                orderId: existing.id,
                status: existing.status,
                checkoutFormContent: existing.payment.rawResult ? (existing.payment.rawResult as any).checkoutFormContent : undefined,
                paymentPageUrl: existing.payment.rawResult ? (existing.payment.rawResult as any).paymentPageUrl : undefined,
            };

            await prisma.idempotencyRequest.upsert({
                where: {
                    scope_key: {
                        scope: idemScope,
                        key: idem,
                    },
                },
                create: {
                    scope: idemScope,
                    key: idem,
                    status: "SUCCESS",
                    requestHash: crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex"),
                    response: existingPayload,
                    orderId: existing.id,
                    expiresAt: twentyFourHoursLater,
                },
                update: {
                    status: "SUCCESS",
                    response: existingPayload,
                    orderId: existing.id,
                    errorCode: null,
                    expiresAt: twentyFourHoursLater,
                },
            });

            return NextResponse.json(existingPayload);
        }

        const orderItemsData = [];
        let subtotal = 0;

        const normalizeText = (value: unknown) =>
            String(value || "")
                .trim()
                .toLocaleLowerCase("tr-TR")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

        for (const item of body.items) {
            const product = await prisma.product.findFirst({
                where: {
                    id: item.productId,
                    deletedAt: null,
                },
                select: {
                    id: true,
                    name: true,
                    isTrackInventory: true,
                    allowBackorders: true,
                    price: true,
                    primaryImage: true,
                    image: true,
                    categoryId: true,
                    category: { select: { name: true } },
                    gender: true,
                    colors: {
                        select: {
                            id: true,
                            name: true,
                            images: true,
                            productImages: {
                                select: { url: true },
                                orderBy: { order: "asc" as const },
                                take: 1,
                            },
                        },
                    },
                    sizes: { select: { id: true, name: true } },
                },
            });

            if (!product) {
                return NextResponse.json({
                    error: `\u00dcr\u00fcn bulunamad\u0131: ${item.productId}. Sepetinizi g\u00fcncelleyip tekrar deneyin.`
                }, { status: 400 });
            }

            let resolvedColorId: string | null = item.colorId || null;
            let resolvedSizeId: string | null = item.sizeId || null;

            if (resolvedColorId) {
                const hasColor = product.colors.some((c: any) => c.id === resolvedColorId);
                if (!hasColor) {
                    return NextResponse.json({
                        error: `"${product.name}" i\u00e7in se\u00e7ili renk ge\u00e7ersiz. Sepetinizi g\u00fcncelleyip tekrar deneyin.`
                    }, { status: 400 });
                }
            }

            if (resolvedSizeId) {
                const hasSize = product.sizes.some((s: any) => s.id === resolvedSizeId);
                if (!hasSize) {
                    return NextResponse.json({
                        error: `"${product.name}" i\u00e7in se\u00e7ili beden ge\u00e7ersiz. Sepetinizi g\u00fcncelleyip tekrar deneyin.`
                    }, { status: 400 });
                }
            }

            if (!resolvedColorId && item.colorName) {
                const wantedColor = normalizeText(item.colorName);
                const matchedColor = product.colors.find((c: any) => normalizeText(c.name) === wantedColor);
                resolvedColorId = matchedColor?.id || null;
            }

            if (!resolvedSizeId && item.sizeName) {
                const wantedSize = normalizeText(item.sizeName);
                const matchedSize = product.sizes.find((s: any) => normalizeText(s.name) === wantedSize);
                resolvedSizeId = matchedSize?.id || null;
            }

            if (product.colors.length > 0 && !resolvedColorId) {
                return NextResponse.json({
                    error: `"${product.name}" i\u00e7in renk bilgisi eksik. Sepetinizi g\u00fcncelleyip tekrar deneyin.`
                }, { status: 400 });
            }

            if (product.sizes.length > 0 && !resolvedSizeId) {
                return NextResponse.json({
                    error: `"${product.name}" i\u00e7in beden bilgisi eksik. Sepetinizi g\u00fcncelleyip tekrar deneyin.`
                }, { status: 400 });
            }

            const variant = await prisma.productVariant.findFirst({
                where: {
                    productId: item.productId,
                    colorId: resolvedColorId,
                    sizeId: resolvedSizeId,
                },
                select: {
                    id: true,
                    productId: true,
                    price: true,
                    stock: true,
                    stockReserved: true,
                },
            });

            if (!variant) {
                return NextResponse.json({
                    error: `\u00dcr\u00fcn varyant\u0131 bulunamad\u0131: ${item.productId}. Sepetinizi g\u00fcncelleyip tekrar deneyin.`
                }, { status: 400 });
            }

            if (product.isTrackInventory && !product.allowBackorders) {
                const availableStock = Math.max(0, variant.stock - (variant.stockReserved || 0));
                if (availableStock < item.quantity) {
                    return NextResponse.json({
                        error: `"${product.name}" i\u00e7in yeterli stok yok. Mevcut: ${availableStock}`
                    }, { status: 400 });
                }
            }

            const price = variant.price || product.price;
            const lineTotal = Number(price) * item.quantity;
            subtotal += lineTotal;

            const lineImage = resolveOrderLineImageAbsoluteUrl(appBaseUrl, {
                product,
                colorId: resolvedColorId,
            });

            orderItemsData.push({
                productId: variant.productId,
                colorId: resolvedColorId,
                sizeId: resolvedSizeId,
                productName: product.name,
                colorName: item.colorName || null,
                sizeName: item.sizeName || null,
                image: lineImage,
                unitPrice: Number(price),
                quantity: item.quantity,
                totalPrice: lineTotal,
                categoryName: product.category?.name || null,
                gender: product.gender,
                _variantId: variant.id
            });
        }

        const shipping = await calculateShippingCost(subtotal);

        let shippingAddressId: string | null = selectedAddressRecord?.id || null;
        let billingAddressId: string | null = selectedAddressRecord?.id || null;

        if (!selectedAddressRecord) {
            const cityRaw = String(body?.shippingAddress?.city || body?.billingAddress?.city || "").trim();
            const city = cityRaw || "\u0130stanbul";
            const districtName = `${city} Merkez`;

            let district = await prisma.district.findFirst({
                where: {
                    city: { equals: city, mode: "insensitive" },
                    name: { equals: districtName, mode: "insensitive" },
                },
                select: { id: true },
            });

            if (!district) {
                district = await prisma.district.create({
                    data: {
                        name: districtName,
                        city,
                    },
                    select: { id: true },
                });
            }

            const fullAddressParts = [
                String(body?.shippingAddress?.addressLine1 || body?.billingAddress?.addressLine1 || "").trim(),
                String(body?.shippingAddress?.apartment || body?.billingAddress?.apartment || "").trim(),
                city,
                String(body?.shippingAddress?.zipCode || body?.billingAddress?.zipCode || "").trim(),
                String(body?.shippingAddress?.country || body?.billingAddress?.country || "Turkey").trim(),
                String(body?.shippingAddress?.phone || body?.billingAddress?.phone || "").trim(),
            ].filter(Boolean);

            const fullAddress = fullAddressParts.join(" | ");

            const existingAddress = await prisma.userAddress.findFirst({
                where: {
                    userId: resolvedUserId,
                    districtId: district.id,
                    fullAddress,
                },
                select: { id: true },
            });

            if (existingAddress) {
                shippingAddressId = existingAddress.id;
                billingAddressId = existingAddress.id;
            } else {
                const existingCount = await prisma.userAddress.count({
                    where: { userId: resolvedUserId },
                });

                const createdAddress = await prisma.userAddress.create({
                    data: {
                        userId: resolvedUserId,
                        districtId: district.id,
                        fullAddress,
                        isPrimary: existingCount === 0,
                        email: body?.email || body?.billingAddress?.email || body?.shippingAddress?.email || null,
                        phone: body?.billingAddress?.phone || body?.shippingAddress?.phone || null,
                        fullName: (body?.billingAddress?.firstName || "Misafir") + " " + (body?.billingAddress?.lastName || "Kullan\u0131c\u0131"),
                    },
                    select: { id: true, districtId: true, fullAddress: true, isPrimary: true },
                });

                shippingAddressId = createdAddress.id;
                billingAddressId = createdAddress.id;

                if (createdAddress.isPrimary) {
                    await prisma.user.update({
                        where: { id: resolvedUserId },
                        data: {
                            districtId: createdAddress.districtId,
                            fullAddress: createdAddress.fullAddress,
                        },
                    });
                }
            }
        }

        let discount = 0;
        let couponId: string | null = null;
        let campaignDiscount = 0;

        const activeCampaign = await getActiveCampaignBanner();
        if (activeCampaign) {
            campaignDiscount = computeCampaignDiscount(
                subtotal,
                activeCampaign.discountTiers
            );
        }

        if (body.couponCode) {
            await deactivateExpiredCoupons();

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
                return NextResponse.json({ error: "B\u00f6yle bir kupon yoktur" }, { status: 400 });
            }
        }

        // Kampanya kademesi ve kupon birlikte kullanılmaz; müşteriye en yüksek indirim uygulanır
        discount = Math.max(discount, campaignDiscount);

        const total = subtotal + shipping - discount;
        const currency = "TRY";

        const requestHash = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
        const lockState = await prisma.idempotencyRequest.findUnique({
            where: {
                scope_key: {
                    scope: idemScope,
                    key: idem,
                },
            },
        });

        if (lockState && lockState.expiresAt > now) {
            if (lockState.status === "SUCCESS" && lockState.response) {
                return NextResponse.json(lockState.response as any);
            }
            if (lockState.status === "PROCESSING") {
                return NextResponse.json(
                    { error: "Bu \u00f6deme iste\u011fi halen i\u015fleniyor. L\u00fctfen birka\u00e7 saniye sonra tekrar deneyin." },
                    { status: 409 }
                );
            }
        }

        await prisma.idempotencyRequest.upsert({
            where: {
                scope_key: {
                    scope: idemScope,
                    key: idem,
                },
            },
            create: {
                scope: idemScope,
                key: idem,
                status: "PROCESSING",
                requestHash,
                expiresAt: twentyFourHoursLater,
            },
            update: {
                status: "PROCESSING",
                requestHash,
                response: null,
                orderId: null,
                errorCode: null,
                expiresAt: twentyFourHoursLater,
            },
        });
        idempotencyLocked = true;

        if (body.paymentMethod === "TEST") {
            const order = await prisma.order.create({
                data: {
                    orderNumber: `DV-${Date.now()}`,
                    userId: resolvedUserId,
                    email: body.email,
                    paymentMethod: "TEST",
                    distanceSalesContractAcceptedAt: new Date(),
                    currency,
                    subtotal,
                    shippingCost: shipping,
                    discount,
                    total,
                    couponId: couponId,
                    status: "PENDING_PAYMENT",
                    paymentStatus: "PAID",
                    shippingAddressId,
                    billingAddressId,
                    idempotencyKey: idem,
                    items: {
                        create: orderItemsData.map(({ _variantId, categoryName, gender, ...rest }: any) => rest)
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

            await finalizePayment({
                orderId: order.id,
                paymentId: order.payment?.paymentId || `TEST-${Date.now()}`,
                conversationId: order.payment?.conversationId || `TEST-CONV-${Date.now()}`,
                rawResult: { provider: "TEST", status: "PAID" },
            });

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

            const payload = {
                orderId: order.id,
                paymentPageUrl: `/success?orderId=${order.id}`,
                status: "success"
            };

            await prisma.idempotencyRequest.update({
                where: {
                    scope_key: {
                        scope: idemScope,
                        key: idem,
                    },
                },
                data: {
                    status: "SUCCESS",
                    response: payload,
                    orderId: order.id,
                    errorCode: null,
                    expiresAt: twentyFourHoursLater,
                },
            });

            return NextResponse.json(payload);
        }

        const order = await prisma.order.create({
            data: {
                orderNumber: `DV-${Date.now()}`,
                userId: resolvedUserId,
                email: body.email,
                paymentMethod: "CREDIT_CARD",
                distanceSalesContractAcceptedAt: new Date(),
                currency,
                subtotal,
                shippingCost: shipping,
                discount,
                total,
                couponId: couponId,
                status: "PENDING_PAYMENT",
                shippingAddressId,
                billingAddressId,
                idempotencyKey: idem,
                items: {
                    create: orderItemsData.map(({ _variantId, categoryName, gender, ...rest }: any) => rest)
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
                            revenue: total
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

        const billingFirstName = String(body?.billingAddress?.firstName || "").trim() || "Misafir";
        const billingLastName = String(body?.billingAddress?.lastName || "").trim() || "Kullan\u0131c\u0131";
        const shippingFirstName = String(body?.shippingAddress?.firstName || billingFirstName).trim() || billingFirstName;
        const shippingLastName = String(body?.shippingAddress?.lastName || billingLastName).trim() || billingLastName;
        const normalizeCountry = (value: unknown) => {
            const raw = String(value || "").trim().toLocaleLowerCase("tr-TR");
            if (!raw) return "Turkey";
            if (raw === "turkiye" || raw === "t\u00fcrkiye" || raw === "turkey") return "Turkey";
            return String(value).trim();
        };
        const billingCountry = normalizeCountry(body?.billingAddress?.country);
        const shippingCountry = normalizeCountry(body?.shippingAddress?.country);
        const selectedAddressCity = selectedAddressRecord?.district?.city || "Istanbul";
        const selectedAddressStreet = selectedAddressRecord?.fullAddress || "N/A";
        const effectiveBillingAddress = selectedAddressRecord ? selectedAddressStreet : (body.billingAddress?.addressLine1 || "N/A");
        const effectiveShippingAddress = selectedAddressRecord ? selectedAddressStreet : (body.shippingAddress?.addressLine1 || "N/A");
        const effectiveBillingCity = selectedAddressRecord ? selectedAddressCity : (body.billingAddress?.city || "Istanbul");
        const effectiveShippingCity = selectedAddressRecord ? selectedAddressCity : (body.shippingAddress?.city || "Istanbul");

        const iyzicoReq = {
            locale: "tr",
            conversationId,
            price: subtotal.toFixed(2),
            paidPrice: total.toFixed(2),
            currency: "TRY",
            basketId: order.orderNumber,
            paymentGroup: "PRODUCT",
            callbackUrl: `${appBaseUrl}/api/iyzico/callback?orderId=${order.id}`,
            enabledInstallments: [2, 3, 6, 9, 12],
            buyer: {
                id: order.userId ?? order.email,
                name: billingFirstName,
                surname: billingLastName,
                gsmNumber: iyzicoGsmNumber,
                email: body.email,
                identityNumber: "11111111111",
                lastLoginDate: "2015-10-05 12:43:35",
                registrationDate: "2013-04-21 15:12:09",
                registrationAddress: effectiveBillingAddress,
                ip: buyerIp,
                city: effectiveBillingCity,
                country: billingCountry,
                zipCode: normalizedZipCode || "34732",
            },
            shippingAddress: {
                contactName: `${shippingFirstName} ${shippingLastName}`,
                city: effectiveShippingCity,
                country: shippingCountry,
                address: effectiveShippingAddress,
                zipCode: String(body?.shippingAddress?.zipCode || "").replace(/\D/g, "") || normalizedZipCode || "34732",
            },
            billingAddress: {
                contactName: `${billingFirstName} ${billingLastName}`,
                city: effectiveBillingCity,
                country: billingCountry,
                address: effectiveBillingAddress,
                zipCode: normalizedZipCode || "34732",
            },
            basketItems: orderItemsData.map((it: any) => ({
                id: it.productId,
                name: it.productName,
                category1: it.categoryName || "General",
                itemType: "PHYSICAL",
                price: it.totalPrice.toFixed(2),
            })),
        };

        let initRes: any;
        try {
            initRes = await iyzicoCall<any>(
                (request, cb) => (iyzico as any).checkoutFormInitialize.create(request, cb),
                iyzicoReq
            );
        } catch (initError: any) {
            await Promise.allSettled([
                releaseReservationTx(order.id),
                prisma.paymentAttempt.update({
                    where: { orderId: order.id },
                    data: {
                        status: "FAILED",
                        rawResult: {
                            status: "failure",
                            errorMessage: initError?.message || "Iyzico init exception",
                        },
                    },
                }),
                prisma.order.update({
                    where: { id: order.id },
                    data: { status: "PAYMENT_FAILED" },
                }),
            ]);
            throw initError;
        }

        if (initRes.status !== "success") {
            await Promise.allSettled([
                releaseReservationTx(order.id),
                prisma.paymentAttempt.update({
                    where: { orderId: order.id },
                    data: { status: "FAILED", rawResult: initRes },
                }),
                prisma.order.update({
                    where: { id: order.id },
                    data: { status: "PAYMENT_FAILED" },
                }),
            ]);

            await prisma.idempotencyRequest.update({
                where: {
                    scope_key: {
                        scope: idemScope,
                        key: idem,
                    },
                },
                data: {
                    status: "FAILED",
                    orderId: order.id,
                    errorCode: initRes.errorMessage || "IYZICO_INIT_FAILED",
                    response: {
                        error: initRes.errorMessage || "Iyzico init failed",
                    },
                    expiresAt: twentyFourHoursLater,
                },
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

        const payload = {
            orderId: order.id,
            checkoutFormContent: initRes.checkoutFormContent,
            paymentPageUrl: initRes.paymentPageUrl,
        };

        await prisma.idempotencyRequest.update({
            where: {
                scope_key: {
                    scope: idemScope,
                    key: idem,
                },
            },
            data: {
                status: "SUCCESS",
                response: payload,
                orderId: order.id,
                errorCode: null,
                expiresAt: twentyFourHoursLater,
            },
        });

        return NextResponse.json(payload);

    } catch (error: any) {
        console.error("Checkout Init Error:", error);

        if (idempotencyLocked && idem) {
            try {
                await prisma.idempotencyRequest.update({
                    where: {
                        scope_key: {
                            scope: idemScope,
                            key: idem,
                        },
                    },
                    data: {
                        status: "FAILED",
                        errorCode: error?.message || "CHECKOUT_INIT_EXCEPTION",
                        response: { error: "CHECKOUT_INIT_EXCEPTION" },
                    },
                });
            } catch (idemUpdateError) {
                console.error("Idempotency update error:", idemUpdateError);
            }
        }

        const msg = String(error?.message || "");
        const likelyMissingMigration =
            /does not exist|Unknown column|Unknown argument|column/i.test(msg) &&
            /isGuest|password|null|distanceSales|fullName|email|UserAddress|Order/i.test(msg);

        return NextResponse.json(
            {
                error: likelyMissingMigration
                    ? "Veritaban\u0131 \u015femas\u0131 eksik. Sunucuda prisma migration uygulanmal\u0131 (\u00f6r. prisma migrate deploy)."
                    : "\u00d6deme ba\u015flat\u0131lamad\u0131. L\u00fctfen bir s\u00fcre sonra tekrar deneyin.",
                ...(process.env.NODE_ENV !== "production" ? { debugMessage: msg.slice(0, 600) } : {}),
            },
            { status: 500 }
        );
    }
}
