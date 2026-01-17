const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const update = await prisma.user.updateMany({
            data: {
                canReconcile: true
            }
        })
        console.log(`Updated ${update.count} users to have canReconcile = true`)
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
