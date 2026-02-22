import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/slug";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function GET() {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("Starting slug migration via API...");
        const categories = await prisma.category.findMany();

        let updatedCount = 0;
        const details = [];

        for (const category of categories) {
            const baseSlug = generateSlug(category.name);

            let slugPrefix = "";
            if (category.gender === "MALE") slugPrefix = "men-";
            else if (category.gender === "FEMALE") slugPrefix = "women-";
            else if (category.gender === "UNISEX") slugPrefix = "unisex-";

            const newSlug = `${slugPrefix}${baseSlug}`;

            if (category.slug !== newSlug) {
                await prisma.category.update({
                    where: { id: category.id },
                    data: { slug: newSlug }
                });
                details.push({ name: category.name, old: category.slug, new: newSlug });
                updatedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Updated ${updatedCount} categories.`,
            details
        });
    } catch (error: any) {
        console.error("Migration API error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
