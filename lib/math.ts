/**
 * SafeMath Utility for Financial Calculations
 * Strategy: Store everything as Integer Cents.
 * Rules:
 * - NEVER use floats for storage or calculation.
 * - ONLY convert to float/string for UI display.
 */

export const SafeMath = {
    /**
     * Converts a Dollar amount (e.g. 10.50 or "10.50") to Cents (e.g. 1050).
     * Handles string input to avoid initial float parsing errors if possible.
     */
    toCents: (amount: number | string): number => {
        const stringAmount = typeof amount === 'number' ? amount.toFixed(2) : amount;
        // Remove standard currency symbols just in case, though usually raw input
        const cleanString = stringAmount.replace(/[$,]/g, '');
        // Multiply by 100 but do it safely via string manipulation or strict math
        // Best way: Math.round(float * 100) handles the .00000004 IEEE ghost
        return Math.round(parseFloat(cleanString) * 100);
    },

    /**
     * Converts Cents (e.g. 1050) to Dollar number (e.g. 10.50) for UI inputs.
     */
    toDollars: (cents: number): number => {
        return cents / 100;
    },

    /**
     * Converts Cents to formatted string (e.g. "$10.50")
     */
    format: (cents: number, currency = 'USD'): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(cents / 100);
    }
};
