"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { parseCSV, findExactAmountMatches, applyMerchantMapping, type ParsedTransaction } from "@/lib/reconciliation/csv-parser"
import { weightedMatching } from "@/lib/reconciliation/matching"
import { sanitizeCSVValue } from "@/lib/csv-sanitizer"

// Types for the Reconciliation Report
export interface Transaction {
    date: string
    merchant: string
    amount: number
    status: 'MATCHED' | 'UNAUTHORIZED' | 'MISSING' | 'NEEDS_REVIEW'
    notes: string
    confidence: number
    expenseId?: string | null
    rawBankName?: string // Original bank description for learning
}

export interface ReconciliationReport {
    statement_period: string
    matched_transactions: Transaction[]
    needs_review_transactions: Transaction[]  // 70-90% confidence
    unauthorized_transactions: Transaction[]
    missing_from_bank: Transaction[]
    bankDetected?: string // Which bank template was detected
}

// Confidence thresholds
const HIGH_CONFIDENCE_THRESHOLD = 0.90    // Auto-match
const REVIEW_THRESHOLD = 0.70             // Needs human review
// Below 0.70 = Unauthorized

// Helper for NVIDIA API (for fuzzy matching fallback)
async function callNvidiaAI(prompt: string) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error("Server Error: NVIDIA_API_KEY missing");

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "meta/llama-3.3-70b-instruct",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            top_p: 1,
            max_tokens: 4096,
            stream: false
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NVIDIA API Error: ${response.status} - ${errorText.slice(0, 200)}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
}

// Polyfill for old pdfjs-dist if needed by pdf-parse 1.1.1
if (!global.DOMMatrix) {
    global.DOMMatrix = class DOMMatrix {
        constructor() { }
        multiply() { return this; }
        translate() { return this; }
        scale() { return this; }
        transformPoint(p: any) { return p; }
    } as any;
}

const pdfParse = require("pdf-parse/lib/pdf-parse.js")

// Helper to parse PDF buffer (for PDFs, we still use AI)
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
        const data = await pdfParse(buffer)
        return data.text
    } catch (error) {
        console.error("PDF Parse Error:", error)
        throw new Error("Failed to parse PDF file.")
    }
}

// Get user's learned merchant mappings
async function getUserMerchantMappings(userId: string): Promise<Record<string, string>> {
    const mappings = await prisma.merchantMapping.findMany({
        where: { userId },
        orderBy: { usageCount: 'desc' }
    });

    const result: Record<string, string> = {};
    for (const m of mappings) {
        result[m.bankName] = m.mappedName;
    }
    return result;
}

// Save learned merchant mapping
export async function saveMerchantMapping(bankName: string, mappedName: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await prisma.merchantMapping.upsert({
            where: {
                bankName_userId: { bankName: bankName.toUpperCase(), userId: session.user.id }
            },
            update: {
                mappedName,
                usageCount: { increment: 1 }
            },
            create: {
                bankName: bankName.toUpperCase(),
                mappedName,
                userId: session.user.id
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to save merchant mapping:", error);
        return { error: "Failed to save mapping" };
    }
}

export async function reconcileStatements(formData: FormData): Promise<ReconciliationReport | { error: string }> {
    const session = await auth()

    // Improved Auth Check: Lookup by ID or Email
    let user = null
    if (session?.user?.id) {
        user = await prisma.user.findUnique({ where: { id: session.user.id } })
    } else if (session?.user?.email) {
        user = await prisma.user.findUnique({ where: { email: session.user.email } })
    }

    if (!user || (!user.canReconcile && user.role !== 'ADMIN')) {
        return { error: "Unauthorized: Access Denied or Session Stale. Try logging out and back in." }
    }

    const file = formData.get("file") as File
    if (!file) {
        return { error: "No file provided." }
    }

    const isCSV = file.type === "text/csv" || file.name.endsWith(".csv")
    const isPDF = file.type === "application/pdf" || file.name.endsWith(".pdf")

    // Fetch user's learned mappings
    const userMappings = await getUserMerchantMappings(user.id);

    // Fetch User's Ledger (last 90 days for better matching)
    const existingExpenses = await prisma.expense.findMany({
        where: {
            userId: user.id,
            date: {
                gte: new Date(new Date().setDate(new Date().getDate() - 90))
            }
        },
        select: {
            id: true,
            date: true,
            amount: true,
            merchant: true,
            category: true
        }
    })

    console.log(`Found ${existingExpenses.length} expenses in ledger`);

    // ===== CSV PROCESSING (NEW DETERMINISTIC APPROACH) =====
    if (isCSV) {
        try {
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const csvContent = buffer.toString('utf-8')

            console.log("Parsing CSV with deterministic matching...");

            // Parse CSV with merchant mappings
            const bankTransactions = parseCSV(csvContent, userMappings);
            console.log(`Parsed ${bankTransactions.length} transactions from CSV`);

            if (bankTransactions.length === 0) {
                return { error: "No transactions found in CSV. Check the file format." }
            }

            // Run matching based on preference
            let matched, unmatched;

            const userPrefs = JSON.parse(user.preferences || "{}");
            const useSmartRecon = userPrefs.enableSmartReconciliation === true;

            if (useSmartRecon) {
                console.log("Using SMART Reconciliation (Weighted Matching)");
                const result = weightedMatching(bankTransactions, existingExpenses);
                matched = result.matched;
                unmatched = result.unmatched;
            } else {
                console.log("Using STANDARD Reconciliation (Exact Amount)");
                const result = findExactAmountMatches(bankTransactions, existingExpenses);
                matched = result.matched;
                unmatched = result.unmatched;
            }

            // Categorize by confidence
            const highConfidence: Transaction[] = [];
            const needsReview: Transaction[] = [];

            for (const m of matched) {
                const tx: Transaction = {
                    date: m.bank.date,
                    merchant: sanitizeCSVValue(m.bank.description),
                    amount: m.bank.amount,
                    status: m.confidence >= HIGH_CONFIDENCE_THRESHOLD ? 'MATCHED' : 'NEEDS_REVIEW',
                    notes: `Matched to ${sanitizeCSVValue(m.expense.merchant)} (${Math.round(m.confidence * 100)}% confidence)`,
                    confidence: m.confidence,
                    expenseId: m.expense.id,
                    rawBankName: m.bank.rawDescription
                };

                if (m.confidence >= HIGH_CONFIDENCE_THRESHOLD) {
                    highConfidence.push(tx);
                } else if (m.confidence >= REVIEW_THRESHOLD) {
                    needsReview.push(tx);
                }
            }

            // Unauthorized = unmatched from bank (not in ledger)
            const unauthorized: Transaction[] = unmatched
                .filter(tx => tx.type === 'debit') // Only debits are concerning
                .map(tx => ({
                    date: tx.date,
                    merchant: tx.description,
                    amount: tx.amount,
                    status: 'UNAUTHORIZED' as const,
                    notes: 'Found in bank statement but not in ledger',
                    confidence: 1.0,
                    rawBankName: tx.rawDescription
                }));

            // Missing = expenses in ledger but not in bank statement
            const matchedExpenseIds = new Set(matched.map(m => m.expense.id));
            const missing: Transaction[] = existingExpenses
                .filter(e => !matchedExpenseIds.has(e.id))
                .slice(0, 20) // Limit to avoid overwhelming
                .map(e => ({
                    date: e.date.toISOString().split('T')[0],
                    merchant: e.merchant,
                    amount: e.amount,
                    status: 'MISSING' as const,
                    notes: 'In ledger but not found in bank statement (may be pending)',
                    confidence: 1.0,
                    expenseId: e.id
                }));

            return {
                statement_period: `CSV Import - ${new Date().toLocaleDateString()}`,
                matched_transactions: highConfidence,
                needs_review_transactions: needsReview,
                unauthorized_transactions: unauthorized,
                missing_from_bank: missing,
                bankDetected: "CSV Auto-Detected"
            };

        } catch (error: any) {
            console.error("CSV Processing Error:", error);
            return { error: `Failed to process CSV: ${error.message}` };
        }
    }

    // ===== PDF PROCESSING (AI-BASED - FALLBACK) =====
    if (isPDF) {
        let pdfTextContent = "";

        try {
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            console.log("Parsing PDF file:", file.name, "Size:", buffer.length)
            pdfTextContent = await extractTextFromPdf(buffer)
            console.log("PDF parsed successfully, text length:", pdfTextContent.length)
        } catch (error: any) {
            console.error("File parsing error:", error)
            return { error: `Failed to read PDF: ${error.message || "Unknown error"}` }
        }

        const ledgerJson = JSON.stringify(existingExpenses.map(e => ({
            id: e.id,
            date: e.date.toISOString().split('T')[0],
            amount: e.amount,
            merchant: e.merchant
        })))

        const prompt = `
        You are a Transaction Reconciliation Engine.
        Analyze this extracted bank statement text and reconcile it against the provided User Ledger.

        CRITICAL RULES:
        1. NOISE REMOVAL: Ignore artifact tags like "<Artifact>", page numbers, etc.
        2. ROW PARSING:
           - A new transaction starts with a Date (MM/DD/YY or similar).
           - Merge all text lines between dates into the 'merchant' description.
        3. POLARITY:
           - Identify "Payments" vs "New Charges".
           - "Payments" or negative signs are CREDITS.
           - "New Charges" are DEBITS. Positive amounts.
        4. RECONCILIATION LOGIC:
           - Compare extracted bank transactions against "USER LEDGER".
           - MATCHED: Amount is identical (approx) AND Date is within +/- 7 days. Fuzzy name match. Include confidence score.
           - NEEDS_REVIEW: Partial match (70-90% confidence).
           - UNAUTHORIZED: Found in Bank, NOT in Ledger. Confidence < 70%.
           - MISSING: Found in Ledger, NOT in Bank.

        OUTPUT FORMAT (JSON Schema):
        {
            "statement_period": "string",
            "matched_transactions": [
                { "date": "YYYY-MM-DD", "merchant": "string", "amount": 0.00, "status": "MATCHED", "expenseId": "EXACT_ID_FROM_LEDGER", "notes": "Confidence logic...", "confidence": 0.95 }
            ],
            "needs_review_transactions": [
                { "date": "YYYY-MM-DD", "merchant": "string", "amount": 0.00, "status": "NEEDS_REVIEW", "expenseId": "EXACT_ID_FROM_LEDGER", "notes": "Partial match reason...", "confidence": 0.75 }
            ],
            "unauthorized_transactions": [
                { "date": "YYYY-MM-DD", "merchant": "string", "amount": 0.00, "status": "UNAUTHORIZED", "notes": "Potential fraud or forgotten expense", "confidence": 1.0 }
            ],
            "missing_from_bank": [
                { "date": "YYYY-MM-DD", "merchant": "string", "amount": 0.00, "status": "MISSING", "notes": "Pending or entry error", "confidence": 1.0 }
            ]
        }

        --- RAW BANK STATEMENT TEXT ---
        ${pdfTextContent}

        --- USER LEDGER (EXPECTED EXPENSES) ---
        ${ledgerJson}
        
        Return ONLY the valid JSON object. No markdown.
        `

        // Retry logic for AI
        let lastError;
        const MAX_ATTEMPTS = 3;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                if (attempt > 1) {
                    console.log(`Reconciliation Attempt ${attempt}/${MAX_ATTEMPTS}: Retrying...`);
                }

                const text = await callNvidiaAI(prompt);
                const jsonString = text.replace(/```json\n|\n```/g, "").replace(/```/g, "").trim()

                const result = JSON.parse(jsonString) as ReconciliationReport;

                // Ensure needs_review_transactions exists
                if (!result.needs_review_transactions) {
                    result.needs_review_transactions = [];
                }

                return result;
            } catch (error: any) {
                console.error(`AI Attempt ${attempt} Failed:`, error.message)
                lastError = error

                if (error.message?.includes('503') || error.status === 503 || error.message?.includes('429') || error.status === 429) {
                    const waitTime = 2000 * Math.pow(2, attempt - 1);
                    console.log(`Model Overloaded/RateLimited. Waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime))
                    continue;
                }

                if (error.message?.includes('400')) break;
            }
        }

        return { error: lastError instanceof Error ? lastError.message : "Failed to process statement (AI System Busy)" }
    }

    return { error: "Unsupported file type. Please upload a CSV or PDF file." }
}

export async function getBatchDetails(batchId: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    const batch = await prisma.reconciliationBatch.findUnique({
        where: { id: batchId, userId: session.user.id },
        include: {
            expenses: true
        }
    })

    if (!batch) return null

    return {
        matched_transactions: batch.expenses.map(e => ({
            date: e.date.toISOString().split('T')[0],
            merchant: e.merchant,
            amount: e.amount,
            status: 'MATCHED',
            notes: 'Historical Record',
            confidence: 1.0,
            expenseId: e.id
        })),
        needs_review_transactions: [],
        unauthorized_transactions: [],
        missing_from_bank: []
    }
}

export async function deleteReconciliationBatch(batchId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        await prisma.expense.updateMany({
            where: { reconciliationBatchId: batchId },
            data: {
                reconciliationStatus: "UNRECONCILED",
                reconciliationBatchId: null
            }
        })

        await prisma.reconciliationBatch.delete({
            where: { id: batchId, userId: session.user.id }
        })

        return { success: true }
    } catch (error) {
        console.error("Failed to delete batch", error)
        return { error: "Failed to delete" }
    }
}

export async function getReconciliationHistory() {
    const session = await auth()
    if (!session?.user?.id) return []

    return await prisma.reconciliationBatch.findMany({
        where: { userId: session.user.id },
        orderBy: { date: 'desc' },
        include: {
            _count: {
                select: { expenses: true }
            }
        }
    })
}

export async function confirmReconciliation(matches: Transaction[], filename: string, nickname?: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "Unauthorized" }
    }

    try {
        const reconciledIds = matches
            .filter(t => (t.status === 'MATCHED' || t.status === 'NEEDS_REVIEW') && t.expenseId)
            .map(t => t.expenseId as string)

        if (reconciledIds.length > 0) {
            const batch = await prisma.reconciliationBatch.create({
                data: {
                    name: nickname || filename,
                    fileName: filename,
                    userId: session.user.id
                }
            })

            await prisma.expense.updateMany({
                where: {
                    id: { in: reconciledIds },
                    userId: session.user.id
                },
                data: {
                    reconciliationStatus: "RECONCILED",
                    reconciliationBatchId: batch.id
                }
            })

            // Save merchant mappings for learning
            for (const match of matches) {
                if (match.rawBankName && match.expenseId) {
                    const expense = await prisma.expense.findUnique({
                        where: { id: match.expenseId },
                        select: { merchant: true }
                    });

                    if (expense && match.rawBankName.toUpperCase() !== expense.merchant.toUpperCase()) {
                        await saveMerchantMapping(match.rawBankName, expense.merchant);
                    }
                }
            }
        }

        return { success: true, count: reconciledIds.length }
    } catch (error) {
        console.error("Failed to confirm reconciliation:", error)
        return { error: "Failed to save to ledger." }
    }
}

export async function manualMatchTransaction(transactionData: Transaction, expenseId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        const expense = await prisma.expense.findUnique({
            where: { id: expenseId }
        })

        if (!expense) return { error: "Expense not found" }

        const newTransaction = await prisma.transaction.create({
            data: {
                date: new Date(transactionData.date),
                amount: transactionData.amount,
                description: transactionData.merchant,
                source: "BANK_STATEMENT",
                status: "RECONCILED",
                userId: session.user.id,
                organizationId: expense.organizationId,
                expenseId: expense.id
            }
        })

        await prisma.expense.update({
            where: { id: expenseId },
            data: { reconciliationStatus: "RECONCILED" }
        })

        // Learn the mapping
        if (transactionData.rawBankName) {
            await saveMerchantMapping(transactionData.rawBankName, expense.merchant);
        }

        return { success: true, transactionId: newTransaction.id }

    } catch (error) {
        console.error("Manual match failed:", error)
        return { error: "Failed to link transaction" }
    }
}

export async function searchExpenses(query: string = "") {
    const session = await auth()
    if (!session?.user?.id) return []

    const where: any = {
        userId: session.user.id,
        reconciliationStatus: "UNRECONCILED"
    }

    if (query) {
        const amount = parseFloat(query)
        if (!isNaN(amount)) {
            where.amount = amount
        } else {
            where.OR = [
                { merchant: { contains: query } },
                { category: { contains: query } }
            ]
        }
    }

    const expenses = await prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        take: 10,
        select: {
            id: true,
            date: true,
            merchant: true,
            amount: true,
            category: true
        }
    })

    return expenses
}
