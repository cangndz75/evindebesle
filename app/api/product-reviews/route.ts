import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

// POST: Yorum yap
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { productId, rating, comment } = body;

        if (!productId || !rating) {
            return NextResponse.json(
                { error: "Ürün ve puan zorunludur" },
                { status: 400 }
            );
        }

        // Kullanıcının daha önce bu ürüne yorum yapıp yapmadığını kontrol et
        // İsteğe bağlı: Bir kullanıcı bir ürüne birden fazla yorum yapabilir mi?
        // Genellikle bir sipariş için bir yorum istenir veya bir ürün için bir yorum.
        // Şimdilik kısıtlama koymuyoruz, proje gereksiniminde belirtilmedi.

        const review = await prisma.productReview.create({
            data: {
                productId,
                userId: session.user.id,
                userName: session.user.name || "Kullanıcı",
                rating: Number(rating),
                comment: comment || "",
                isApproved: true, // Geliştirme aşamasında otomatik onay
            },
        });

        return NextResponse.json({ success: true, review });
    } catch (error: any) {
        console.error("Review creation error:", error);
        return NextResponse.json(
            { error: error.message || "Yorum gönderilirken bir hata oluştu" },
            { status: 500 }
        );
    }
}

// GET: Yorumları getir veya kullanıcının yorumunu kontrol et
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");
        const checkUser = searchParams.get("checkUser"); // "true" ise kullanıcının yorumunu kontrol et

        if (!productId) {
            return NextResponse.json({ error: "Product ID required" }, { status: 400 });
        }

        // Kullanıcının bu ürün için yorum yapıp yapmadığını kontrol et
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

        // Ürünün onaylanmış yorumlarını getir
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
