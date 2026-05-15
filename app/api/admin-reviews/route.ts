import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { jsonNoStore, requireAdmin } from "@/lib/api/policy";

export async function GET(request: NextRequest) {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    try {
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get("status"); // "pending" | "approved" | "all"
        const countOnly = searchParams.get("countOnly") === "true";

        const whereClause: any = {};
        if (status === "pending") {
            whereClause.isApproved = false;
        } else if (status === "approved") {
            whereClause.isApproved = true;
        }

        if (countOnly) {
            const count = await prisma.productReview.count({
                where: whereClause,
            });
            return jsonNoStore({ count });
        }

        const reviews = await prisma.productReview.findMany({
            where: whereClause,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        slug: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const pendingCount = await prisma.productReview.count({
            where: { isApproved: false },
        });

        return jsonNoStore({ reviews, pendingCount });
    } catch (error: any) {
        console.error("Admin reviews fetch error:", error);
        return jsonNoStore(
            { error: "ADMIN_REVIEWS_FETCH_EXCEPTION" },
            { status: 500 }
        );
    }
}
