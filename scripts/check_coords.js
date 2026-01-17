
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const expenses = await prisma.expense.findMany({
        where: {
            OR: [
                { latitude: { not: null } },
                { longitude: { not: null } }
            ]
        },
        select: {
            id: true,
            merchant: true,
            amount: true,
            latitude: true,
            longitude: true
        }
    })

    console.log(`Found ${expenses.length} expenses with coordinates.`)
    if (expenses.length > 0) {
        console.log("Sample:", expenses[0])
    } else {
        console.log("No expenses have coordinates. The issue is likely in the 'Saving' step or Browser Geolocation.")
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
