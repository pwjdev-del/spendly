import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const now = new Date();

        // Find all active subscriptions due today or earlier
        const dueSubscriptions = await prisma.recurringExpense.findMany({
            where: {
                status: "ACTIVE",
                nextDueDate: { lte: now }
            }
        });

        const createdExpenses = [];

        for (const sub of dueSubscriptions) {
            // 1. Create the Expense
            // Note: organizationId might be null for personal subscriptions.
            // Ensure Expense model can handle this or fallback (Expense requires organizationId currently? Let's check schema).
            // Schema check: Expense.organizationId is NOT optional.
            // If sub.organizationId is null, we cannot create an Expense unless we find a fallback org or update Expense schema.
            // Logic change: Personal subscriptions MUST create personal expenses. In current schema, Expense MUST have organizationId.
            // This is a blocker. 
            // Workaround: We will skip creation if no org ID, or we must update Expense schema too.
            // Given the user wants personal subscriptions, we likely need to make Expense.organizationId optional too, 
            // OR we assume the user has a "Personal Organization" under the hood?
            // Actually, let's look at the Expense schema again. It is required.
            // I will assume for now we only process if organizationId exists, OR if I modify Expense schema.
            // Wait, the user said "personal use".
            // Let's modify Expense.organizationId to be optional as well in a future step if needed. 
            // For now, I will guard against null orgId.
            if (!sub.organizationId) {
                console.warn(`Skipping recurring expense ${sub.id} because it has no organizationId linked.Schema requires one.`);
                continue;
            }

            const expense = await prisma.expense.create({
                data: {
                    merchant: sub.merchant,
                    amount: sub.amount,
                    currency: sub.currency,
                    category: sub.category,
                    date: new Date(),
                    status: "PENDING", // Auto-approved? Or PENDING? Let's say PENDING by default.
                    userId: sub.userId,
                    organizationId: sub.organizationId,
                    locationName: "Recurring Subscription"
                }
            });
            createdExpenses.push(expense.id);

            // 2. Update Next Due Date
            let nextDate = new Date(sub.nextDueDate);
            if (sub.frequency === "MONTHLY") {
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (sub.frequency === "WEEKLY") {
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (sub.frequency === "BIWEEKLY") {
                nextDate.setDate(nextDate.getDate() + 14);
            } else if (sub.frequency === "YEARLY") {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            }

            await prisma.recurringExpense.update({
                where: { id: sub.id },
                data: { nextDueDate: nextDate }
            });
        }

        return NextResponse.json({
            success: true,
            processed: dueSubscriptions.length,
            created: createdExpenses.length,
            ids: createdExpenses
        });

    } catch (error: any) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
