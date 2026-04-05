import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
import { normalizeDatabaseUrlForPg } from './lib/normalize-database-url.js'

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    console.error('DATABASE_URL is not defined in .env')
    process.exit(1)
}

const normalized = normalizeDatabaseUrlForPg(connectionString)
const pool = new Pool({ connectionString: normalized })
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
    const fields = [
        'id', 'name', 'description', 'price', 'image', 'isActive', 'createdAt', 'updatedAt',
        'detailText', 'gender', 'sizeType', 'stockCode', 'fabricType', 'primaryImage',
        'secondaryImage', 'slug', 'originalPrice', 'brand', 'categoryId', 'weight',
        'washingInstructionId', 'deliveryInfoId', 'sizeNoteId', 'sizeGuideId', 'modelInfoId'
    ]

    console.log('Checking individual Product fields...')
    for (const field of fields) {
        try {
            await (prisma.product as any).findFirst({
                select: { [field]: true }
            })
            console.log(`Field ${field}: OK`)
        } catch (err: any) {
            console.error(`Field ${field}: FAILED - ${err.message}`)
        }
    }

    await prisma.$disconnect()
    process.exit(0)
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
