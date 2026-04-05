import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { checkLowStockProducts, getStockSummary, setStockAlert, disableStockAlert } from "@/lib/stockAlert";

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const type = url.searchParams.get("type") || "summary";

        if (type === "summary") {
            const summary = await getStockSummary();
            return NextResponse.json(summary);
        }

        if (type === "low-stock") {
            const lowStockProducts = await checkLowStockProducts();
            return NextResponse.json({ products: lowStockProducts });
        }

        const alerts = await prisma.stockAlert.findMany({
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ alerts });
    } catch (error) {
        console.error("Error fetching stock alerts:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productId, variantId, threshold } = await req.json();

        if (!productId || typeof threshold !== "number" || threshold < 0) {
            return NextResponse.json(
                { error: "Geçersiz parametreler" },
                { status: 400 }
            );
        }

        await setStockAlert(productId, threshold, variantId);

        return NextResponse.json({
            success: true,
            message: "Stok uyarısı ayarlandı",
        });
    } catch (error) {
        console.error("Error setting stock alert:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const productId = url.searchParams.get("productId");
        const variantId = url.searchParams.get("variantId");

        if (!productId) {
            return NextResponse.json(
                { error: "Product ID gerekli" },
                { status: 400 }
            );
        }

        await disableStockAlert(productId, variantId || undefined);

        return NextResponse.json({
            success: true,
            message: "Stok uyarısı kaldırıldı",
        });
    } catch (error) {
        console.error("Error removing stock alert:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
