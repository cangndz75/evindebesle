import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

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
                { error: "ÃœrÃ¼n ve puan zorunludur" },
                { status: 400 }
            );
        }


        const review = await prisma.productReview.create({
            data: {
                productId,
                userId: session.user.id,
                userName: session.user.name || "KullanÄ±cÄ±",
                rating: Number(rating),
                comment: comment || "",
                isApproved: true, // GeliÅŸtirme aÅŸamasÄ±nda otomatik onay
            },
        });

        return NextResponse.json({ success: true, review });
    } catch (error: any) {
        console.error("Review creation error:", error);
        return NextResponse.json(
            { error: error.message || "Yorum gÃ¶nderilirken bir hata oluÅŸtu" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");
        const checkUser = searchParams.get("checkUser"); // "true" ise kullanÄ±cÄ±nÄ±n yorumunu kontrol et

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
            { error: error.message || "Yorumlar yÃ¼klenirken bir hata oluÅŸtu" },
            { status: 500 }
        );
    }
}
