import { PrismaClient } from '@prisma/client';
import { generateBlogSlug } from '../lib/slug.js'; // Note: might need to handle imports carefully with ts/esm

const prisma = new PrismaClient();

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
