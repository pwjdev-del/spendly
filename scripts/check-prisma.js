const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Checking Prisma Client...')
    try {
        // Try to find a trip with documents include
        // We don't need a real ID, just want to see if it throws "Unknown field"
        const trip = await prisma.trip.findFirst({
            include: {
                documents: true
            }
        })
        console.log('Success: Prisma Client accepted "documents" field in include.')
    } catch (e) {
        console.error('Error: Prisma Client failed.')
        console.error(e.message)
        process.exit(1)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
