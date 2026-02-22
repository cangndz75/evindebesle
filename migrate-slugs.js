import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const turkishToEnglish = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
};

function generateSlug(text) {
    let slug = text;
    for (const [turkish, english] of Object.entries(turkishToEnglish)) {
        slug = slug.replace(new RegExp(turkish, 'g'), english);
    }
    return slug
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function fixSlugs() {
    try {
        console.log("Starting slug migration...");
        console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Defined" : "Not Defined");

        console.log("Fetching categories...");
        const categories = await prisma.category.findMany();
        console.log(`Found ${categories.length} categories.`);

        let updatedCount = 0;

        for (const category of categories) {
            const baseSlug = generateSlug(category.name);

            let slugPrefix = "";
            if (category.gender === "MALE") slugPrefix = "men-";
            else if (category.gender === "FEMALE") slugPrefix = "women-";
            else if (category.gender === "UNISEX") slugPrefix = "unisex-";

            const newSlug = `${slugPrefix}${baseSlug}`;

            if (category.slug !== newSlug) {
                console.log(`Updating "${category.name}": "${category.slug}" -> "${newSlug}"`);

                await prisma.category.update({
                    where: { id: category.id },
                    data: { slug: newSlug }
                });
                updatedCount++;
            } else {
                console.log(`No change needed for "${category.name}" (${category.slug})`);
            }
        }

        console.log(`\nMigration completed. ${updatedCount} categories updated.`);
    } catch (error) {
        console.error("Migration failed!");
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

fixSlugs();
