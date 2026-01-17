const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'patelkathan134@gmail.com'; // or 'm@example.com' - checking both
        console.log(`--- Debugging for ${email} ---`);

        const user = await prisma.user.findFirst({ where: { email } });
        if (!user) {
            console.log("User not found via findFirst(email)");
            return;
        }
        console.log("User found:", { id: user.id, role: user.role, orgId: user.organizationId });

        // Reconstruct the whereClause exactly as in the page
        const whereClause = {
            OR: [
                { userId: user.id },
                ...(user.organizationId ? [{ organizationId: user.organizationId }] : [])
            ]
        };

        console.log("Where Clause:", JSON.stringify(whereClause, null, 2));

        const expenses = await prisma.expense.findMany({
            where: whereClause,
            orderBy: { date: 'asc' },
            take: 5
        });
        console.log(`Found ${expenses.length} expenses`);
        if (expenses.length > 0) console.log("Sample Expense:", expenses[0]);

        // DUMP ALL RECURRING EXPENSES
        const allRecurring = await prisma.recurringExpense.findMany();
        console.log(`TOTAL Recurring Expenses in DB: ${allRecurring.length}`);
        allRecurring.forEach(r => {
            console.log(`- ID: ${r.id}, UserID: ${r.userId}, OrgID: ${r.organizationId}, Status: ${r.status}`);
        });

    } catch (e) {
        console.error("Query failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
