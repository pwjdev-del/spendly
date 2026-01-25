import { z } from "zod";

export const CreateExpenseSchema = z.object({
    merchant: z.string().min(1, "Merchant is required"),
    amount: z.number().positive("Amount must be positive"), // Strict positive enforcement
    currency: z.string().length(3, "Currency must be a 3-letter code").default("USD"),
    originalAmount: z.number().nullable().optional(),
    originalCurrency: z.string().length(3).nullable().optional(),
    exchangeRate: z.number().nullable().optional(),
    category: z.string().min(1, "Category is required"),
    // Accept both date-only (YYYY-MM-DD) and full ISO datetime strings
    date: z.string().min(1, "Date is required").refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
    }, "Invalid date"),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    locationName: z.string().nullable().optional().transform(val => val ?? undefined),
    tripId: z.string().nullable().optional(),
    idempotencyKey: z.string().nullable().optional()
});

