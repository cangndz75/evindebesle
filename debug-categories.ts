import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        const categories = await prisma.category.findMany();
        console.log("Categories in DB:", JSON.stringify(categories, null, 2));
    } catch (error) {
        console.error("Error fetching categories:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
