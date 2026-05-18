import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { createAdminNotification } from "@/lib/admin-notification";
import { sendTelegramMessage, TelegramTemplates } from "@/lib/telegramService";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { productId, rating, comment, images } = body;

        if (!productId || !rating) {
            return NextResponse.json(
                { error: "Ürün ve puan zorunludur" },
                { status: 400 }
            );
        }

        const existingReview = await prisma.productReview.findFirst({
            where: {
                productId,
                userId: session.user.id,
            },
            select: {
                id: true,
            },
        });

        if (existingReview) {
            return NextResponse.json(
                { error: "Bu ürün için zaten yorum yaptınız" },
                { status: 409 }
            );
        }

        const reviewImages = Array.isArray(images) ? images.filter((url: string) => typeof url === "string" && url.length > 0) : [];
        const hasImages = reviewImages.length > 0;
        const shouldAutoApprove = !hasImages;

        const review = await prisma.productReview.create({
            data: {
                productId,
                userId: session.user.id,
                userName: session.user.name || "Kullanıcı",
                rating: Number(rating),
                comment: comment || "",
                images: reviewImages,
                hasImages,
                isApproved: shouldAutoApprove,
            },
            include: {
                product: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        const notifMessage = hasImages
            ? `${session.user.name || session.user.email} "${review.product.name}" ürününe fotoğraflı yorum yaptı. Onay bekliyor.`
            : `${session.user.name || session.user.email} "${review.product.name}" ürününe ${rating}/5 puan verdi.`;

        await createAdminNotification({
            type: "REVIEW",
            title: hasImages ? "Fotoğraflı Yorum - Onay Bekliyor" : "Yeni Yorum",
            message: notifMessage,
            link: hasImages ? "/admin-reviews" : "/admin-products",
        });

        sendTelegramMessage(TelegramTemplates.newReview({
            productName: review.product.name,
            customerName: session.user.name || "Müşteri",
            rating: review.rating,
            comment: review.comment || "Yorum metni yok.",
        })).catch((err) => console.error("[REVIEW_TELEGRAM]", err));

        return NextResponse.json({
            success: true,
            review,
            pendingApproval: hasImages,
        });
    } catch (error: any) {
        console.error("Review creation error:", error);
        return NextResponse.json(
            { error: error.message || "Yorum gönderilirken bir hata oluştu" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const reviewId = typeof body?.reviewId === "string" ? body.reviewId : undefined;
        const productId = typeof body?.productId === "string" ? body.productId : undefined;

        let targetReview = null;

        if (reviewId) {
            targetReview = await prisma.productReview.findFirst({
                where: {
                    id: reviewId,
                    userId: session.user.id,
                },
                select: { id: true },
            });
        } else if (productId) {
            targetReview = await prisma.productReview.findFirst({
                where: {
                    productId,
                    userId: session.user.id,
                },
                orderBy: { createdAt: "desc" },
                select: { id: true },
            });
        }

        if (!targetReview) {
            return NextResponse.json({ error: "Yorum bulunamadı" }, { status: 404 });
        }

        await prisma.productReview.delete({
            where: { id: targetReview.id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Review delete error:", error);
        return NextResponse.json(
            { error: error.message || "Yorum silinirken bir hata oluştu" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");
        const checkUser = searchParams.get("checkUser"); // "true" ise kullanıcının yorumunu kontrol et

        if (!productId) {
            return NextResponse.json({ error: "Product ID required" }, { status: 400 });
        }

        if (checkUser === "true") {
            const session = await getServerSession(authConfig);
            if (!session?.user?.id) {
                return NextResponse.json({ hasReviewed: false });
            }

            const review = await prisma.productReview.findFirst({
                where: {
                    productId,
                    userId: session.user.id,
                },
            });

            return NextResponse.json({ hasReviewed: !!review, review });
        }

        const reviews = await prisma.productReview.findMany({
            where: {
                productId,
                isApproved: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(reviews);
    } catch (error: any) {
        console.error("Review fetch error:", error);
        return NextResponse.json(
            { error: error.message || "Yorumlar yüklenirken bir hata oluştu" },
            { status: 500 }
        );
    }
}
