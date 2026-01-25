require('dotenv').config();
const { PrismaClient } = require('@prisma/client');


const prisma = new PrismaClient();

function generateSlug(text) {
    const turkishToEnglish = {
        'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U',
    };
    let slug = text;
    for (const [turkish, english] of Object.entries(turkishToEnglish)) {
        slug = slug.replace(new RegExp(turkish, 'g'), english);
    }
    return slug.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function generateBlogSlug(title, id) {
    const baseSlug = generateSlug(title);
    const partialId = id.slice(0, 8);
    return `${baseSlug}-${partialId}`;
}

async function main() {
    const posts = await prisma.blogPost.findMany();
    console.log(`Found ${posts.length} posts to update.`);

    for (const post of posts) {
        const newSlug = generateBlogSlug(post.title, post.id);
        console.log(`Updating post ${post.id}: ${post.slug} -> ${newSlug}`);
        await prisma.blogPost.update({
            where: { id: post.id },
            data: { slug: newSlug }
        });
    }

    console.log('Migration complete.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
