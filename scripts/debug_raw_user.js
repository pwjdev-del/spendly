
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'patelkathan134@gmail.com';
        console.log(`--- Debugging Raw SQL for ${email} ---`);

        // EXACT QUERY from the page output
        const users = await prisma.$queryRaw`SELECT * FROM User WHERE email = ${email} LIMIT 1`;
        const user = users[0];

        console.log("Raw User Object keys:", Object.keys(user || {}));
        console.log("Raw User Object:", JSON.stringify(user, null, 2));

        if (!user) {
            console.log("User NOT found via Raw SQL");
            return;
        }

        // CHECK DATA OWNERSHIP
        const userId = user.id;
        console.log(`User ID: ${userId}`);

        const expensesCount = await prisma.expense.count({ where: { userId } });
        console.log(`Expenses owned by ${userId}: ${expensesCount}`);

        const recurringCount = await prisma.recurringExpense.count({ where: { userId } });
        console.log(`Recurring Expenses owned by ${userId}: ${recurringCount}`);

        // DUMP ALL RECURRING to compare IDs again
        const allRecurring = await prisma.recurringExpense.findMany({ select: { id: true, userId: true } });
        console.log("Sample of ALL Recurring Expense Owner IDs:");
        allRecurring.forEach(r => console.log(`- Sub ${r.id} owned by ${r.userId}`));

    } catch (e) {
        console.error("Query failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
