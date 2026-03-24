import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    console.error('DATABASE_URL is not defined in .env')
    process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
    console.log('Checking Category fields...')
    const fields = ['showOnHome', 'showOnMen', 'showOnWomen', 'gender', 'group']
    
    for (const field of fields) {
        try {
            await (prisma.category as any).findFirst({
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
