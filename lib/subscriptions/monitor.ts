import prisma from "@/lib/prisma";

export interface SubscriptionAnomaly {
    name: string;
    oldAmount: number;
    newAmount: number;
    percentChange: number;
    type: "PRICE_HIKE" | "NEW_SUBSCRIPTION";
}

/**
 * Subscription 911: The "Ghost Spend" Detector.
 * 
 * 1. Checks if a transaction looks like a subscription (recurring merchant).
 * 2. Checks if a known subscription has increased in price.
 */
export async function checkForSubscriptionAnomalies(userId: string): Promise<SubscriptionAnomaly[]> {
    const anomalies: SubscriptionAnomaly[] = [];

    // Get active subscriptions
    const subscriptions = await prisma.subscription.findMany({
        where: { userId, status: "ACTIVE" }
    });

    // Get recent expenses (last 30 days) to compare
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentExpenses = await prisma.expense.findMany({
        where: {
            userId,
            date: { gte: thirtyDaysAgo }
        }
    });

    // 1. Check for Price Hikes
    for (const sub of subscriptions) {
        // Find latest expense for this subscription
        // Simple merchant string match for now
        const relatedExpense = recentExpenses.find(e =>
            e.merchant.toLowerCase().includes(sub.name.toLowerCase()) ||
            sub.name.toLowerCase().includes(e.merchant.toLowerCase())
        );

        if (relatedExpense) {
            // Logic: If expense amount > subscription amount + threshold
            if (relatedExpense.amount > sub.amount) {
                const diff = relatedExpense.amount - sub.amount;
                const percent = (diff / sub.amount) * 100;

                if (percent > 5) { // Notify if > 5% increase
                    anomalies.push({
                        name: sub.name,
                        oldAmount: sub.amount,
                        newAmount: relatedExpense.amount,
                        percentChange: Math.round(percent),
                        type: "PRICE_HIKE"
                    });
                }

                // Auto-update amount if confirmed? (Left for UI action)
            }
        }
    }

    return anomalies;
}

/**
 * Scans for POTENTIAL new subscriptions from transaction history.
 * A simple heuristic: Same merchant, same amount, adjacent months.
 */
export async function detectNewSubscriptions(userId: string) {
    // Complex query logic would go here.
    // For MVP, we return empty or mock data.
    return [];
}
