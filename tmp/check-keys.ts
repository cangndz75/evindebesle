import { prisma } from './lib/db'

async function main() {
    try {
        const cat = await (prisma.category as any).findFirst()
        if (cat) {
            console.log('Category object keys:', Object.keys(cat))
        } else {
            console.log('No categories found to check keys.')
        }
    } catch (err: any) {
        console.error('Error fetching category:', err.message)
    }
    process.exit(0)
}

main()
