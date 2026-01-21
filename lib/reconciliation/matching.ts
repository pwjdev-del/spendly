
import type { ParsedTransaction } from "./csv-parser";

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

/**
 * Normalizes merchant names for better matching
 * e.g., "AMAZON.COM WA" -> "amazon"
 */
function normalizeMerchant(name: string): string {
    return name
        .toLowerCase()
        .replace(/inc\.|llc|ltd|corp|corporation/g, "") // Remove entities
        .replace(/\.com|\.net|\.org/g, "") // Remove domains
        .replace(/[^a-z0-9 ]/g, "") // Remove special chars
        .replace(/\s+/g, " ") // Normalize spaces
        .trim();
}

/**
 * Calculates a match score between a bank transaction and a ledger expense.
 * 
 * Rules:
 * 1. Amount: Must be extremely close (within $0.05).
 * 2. Date: Score decays as date difference increases (up to 7 days).
 * 3. Text: Levenshtein distance on normalized text.
 * 
 * Returns score 0.0 - 1.0
 */
export function calculateMatchScore(
    bankTx: ParsedTransaction,
    expense: { id: string; date: Date; amount: number; merchant: string }
): number {
    // 1. Amount Check (Critical)
    // Expense amount is in Cents. Bank is in Dollars.
    const expenseAmountDollars = expense.amount / 100;
    const amountDiff = Math.abs(bankTx.amount - expenseAmountDollars);

    if (amountDiff > 0.05) {
        return 0; // Immediate fail if amount doesn't match
    }

    // 2. Date Score
    const bankDate = new Date(bankTx.date);
    const expenseDate = new Date(expense.date);
    const dayDiff = Math.abs((bankDate.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff > 10) return 0; // Too far apart

    // Date Score: 1.0 at 0 days, 0.5 at 5 days.
    // Logistic decay or linear? Let's use simple linear for now.
    const dateScore = Math.max(0, 1 - (dayDiff / 10));

    // 3. Text Score
    const bankNorm = normalizeMerchant(bankTx.description);
    const expNorm = normalizeMerchant(expense.merchant);

    if (bankNorm === expNorm) return 0.9 + (dateScore * 0.1); // Exact text match = very high confidence

    const dist = levenshteinDistance(bankNorm, expNorm);
    const maxLength = Math.max(bankNorm.length, expNorm.length);
    const similarity = maxLength === 0 ? 0 : (maxLength - dist) / maxLength;

    // Boost partial containment ("Netflix" in "Netflix.com")
    let finalTextScore = similarity;
    if (bankNorm.includes(expNorm) || expNorm.includes(bankNorm)) {
        finalTextScore = Math.max(similarity, 0.85);
    }

    // Weighted Average
    // Date is important (40%), Text is important (60%) -- assuming Amount matched
    return (dateScore * 0.4) + (finalTextScore * 0.6);
}

/**
 * matches transactions using a weighted algorithm
 */
export function weightedMatching(
    bankTransactions: ParsedTransaction[],
    ledgerExpenses: { id: string; date: Date; amount: number; merchant: string }[]
): { matched: Array<{ bank: ParsedTransaction; expense: typeof ledgerExpenses[0]; confidence: number }>, unmatched: ParsedTransaction[] } {
    const matched: Array<{ bank: ParsedTransaction; expense: typeof ledgerExpenses[0]; confidence: number }> = [];
    const unmatchedBank = [...bankTransactions];
    const usedExpenseIds = new Set<string>();

    // Sort bank transactions by date? Or just iterate.

    for (let i = unmatchedBank.length - 1; i >= 0; i--) {
        const bankTx = unmatchedBank[i];
        let bestMatch = null;
        let bestScore = -1;

        for (const expense of ledgerExpenses) {
            if (usedExpenseIds.has(expense.id)) continue;

            const score = calculateMatchScore(bankTx, expense);

            if (score > bestScore) {
                bestScore = score;
                bestMatch = expense;
            }
        }

        // Confidence Threshold
        if (bestMatch && bestScore >= 0.70) {
            matched.push({ bank: bankTx, expense: bestMatch, confidence: bestScore });
            usedExpenseIds.add(bestMatch.id);
            unmatchedBank.splice(i, 1);
        }
    }

    return { matched, unmatched: unmatchedBank };
}
