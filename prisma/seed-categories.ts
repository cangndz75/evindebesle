import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const categories = [
        { id: "clothing", name: "Giyim", slug: "giyim" },
        { id: "accessories", name: "Aksesuar", slug: "aksesuar" },
        { id: "new-arrivals", name: "Yeni Gelenler", slug: "yeni-gelenler" },
    ];

    for (const cat of categories) {
        const existing = await prisma.category.findUnique({
            where: { id: cat.id },
        });

        if (!existing) {
            const slugExists = await prisma.category.findUnique({
                where: { slug: cat.slug },
            });

            if (slugExists) {
                console.log(`Skipping ${cat.name} (slug collision)`);
                continue;
            }

            await prisma.category.create({
                data: cat,
            });
            console.log(`Created category: ${cat.name}`);
        } else {
            console.log(`Category ${cat.name} already exists.`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
