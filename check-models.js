
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'))
console.log('Models found:', models.join(', '))
if (models.includes('blogPost')) {
    console.log('SUCCESS: blogPost found')
} else {
    console.log('FAILURE: blogPost NOT found')
}
if (models.includes('order')) {
    console.log('SUCCESS: order found')
}
