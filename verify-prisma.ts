
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Verifying Prisma Client with Nested Query...')
    try {
        // Try to simulate the family details query, checking for status field existence in the input type
        const org = await prisma.organization.findFirst({
            include: {
                users: {
                    select: {
                        id: true,
                        status: true
                    }
                }
            }
        })
        console.log('Success! Found org:', org ? org.id : 'None found')
    } catch (e) {
        console.error('Error verifying Prisma Client:')
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
