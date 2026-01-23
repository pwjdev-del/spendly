import prisma from "@/lib/prisma";

/**
 * Gamified Budget Engine
 * 
 * "The Anti-Expense Report": Reward users for spending LESS than the policy.
 */

export async function processGamification(expenseId: string) {
    const expense = await prisma.expense.findUnique({
        where: { id: expenseId },
        include: { user: true, organization: true }
    });

    if (!expense || !expense.user.gamificationEnabled) return;

    // 1. Find applicable Smart Limit
    // e.g. "Hotel" -> $200 limit
    const smartLimit = await prisma.smartLimit.findFirst({
        where: {
            organizationId: expense.organizationId,
            category: expense.category, // e.g. "Accommodation"
            isEnabled: true
        }
    });

    if (!smartLimit) return; // No limit, no game.

    // 2. Compare Amount
    // Limit: $200 (20000 cents)
    // Spent: $150 (15000 cents)
    // Saved: $50
    if (expense.amount < smartLimit.amount) {
        const savedAmount = smartLimit.amount - expense.amount;

        // 3. Award Points (e.g. 50% of savings)
        const pointsToAward = Math.floor(savedAmount * 0.5);

        if (pointsToAward > 0) {
            // Update User Balance
            await prisma.user.update({
                where: { id: expense.userId },
                data: {
                    rewardsBalance: { increment: pointsToAward }
                }
            });

            // Log the "Win" - could create a Notification or feed item
            console.log(`[Gamification] User ${expense.userId} saved ${savedAmount} on ${expense.merchant}. Awarded ${pointsToAward} points.`);
        }
    }
}
