// CSV Parser with Bank Statement Templates
// Supports: Chase, Bank of America, Wells Fargo, Generic CSV

import merchantMappingsData from './merchant-mappings.json';

export interface ParsedTransaction {
    date: string;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
    rawDescription: string;
}

export interface BankTemplate {
    name: string;
    dateColumn: string[];  // Possible column names
    descriptionColumn: string[];
    amountColumn: string[];
    debitColumn?: string[];
    creditColumn?: string[];
    dateFormat: string;
}

// Bank-specific templates
const BANK_TEMPLATES: Record<string, BankTemplate> = {
    chase: {
        name: "Chase",
        dateColumn: ["Transaction Date", "Posting Date", "Date"],
        descriptionColumn: ["Description", "Merchant Name", "Name"],
        amountColumn: ["Amount"],
        dateFormat: "MM/DD/YYYY"
    },
    bankofamerica: {
        name: "Bank of America",
        dateColumn: ["Date", "Posted Date"],
        descriptionColumn: ["Description", "Payee"],
        amountColumn: ["Amount"],
        dateFormat: "MM/DD/YYYY"
    },
    wellsfargo: {
        name: "Wells Fargo",
        dateColumn: ["Date"],
        descriptionColumn: ["Description"],
        amountColumn: ["Amount"],
        debitColumn: ["Withdrawals"],
        creditColumn: ["Deposits"],
        dateFormat: "MM/DD/YYYY"
    },
    generic: {
        name: "Generic",
        dateColumn: ["Date", "Transaction Date", "Posted Date", "Trans Date"],
        descriptionColumn: ["Description", "Merchant", "Name", "Payee", "Details", "Memo"],
        amountColumn: ["Amount", "Transaction Amount", "Debit", "Credit"],
        dateFormat: "MM/DD/YYYY"
    }
};

// Get default merchant mappings
const DEFAULT_MAPPINGS: Record<string, string> = merchantMappingsData.mappings;

// Apply merchant mapping (default + user mappings)
export function applyMerchantMapping(
    rawName: string,
    userMappings: Record<string, string> = {}
): string {
    const upperName = rawName.toUpperCase().trim();

    // Check user mappings first (higher priority)
    for (const [pattern, mapped] of Object.entries(userMappings)) {
        if (upperName.includes(pattern.toUpperCase())) {
            return mapped;
        }
    }

    // Check default mappings
    for (const [pattern, mapped] of Object.entries(DEFAULT_MAPPINGS)) {
        if (upperName.includes(pattern.toUpperCase())) {
            return mapped;
        }
    }

    // Return original if no mapping found
    return rawName.trim();
}

// Detect which bank template to use based on headers
function detectBankTemplate(headers: string[]): BankTemplate {
    const headerSet = new Set(headers.map(h => h.toLowerCase().trim()));

    // Chase detection
    if (headerSet.has("transaction date") && headerSet.has("description")) {
        return BANK_TEMPLATES.chase;
    }

    // Bank of America detection
    if (headerSet.has("posted date") && headerSet.has("payee")) {
        return BANK_TEMPLATES.bankofamerica;
    }

    // Wells Fargo detection
    if (headerSet.has("withdrawals") || headerSet.has("deposits")) {
        return BANK_TEMPLATES.wellsfargo;
    }

    return BANK_TEMPLATES.generic;
}

// Find column index by possible names
function findColumnIndex(headers: string[], possibleNames: string[]): number {
    const lowerHeaders = headers.map(h => h.toLowerCase().trim());

    for (const name of possibleNames) {
        const idx = lowerHeaders.indexOf(name.toLowerCase());
        if (idx !== -1) return idx;
    }

    return -1;
}

// Parse date string to ISO format
function parseDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];

    // Handle MM/DD/YYYY or MM/DD/YY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        let year = parts[2];
        if (year.length === 2) {
            year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
        }
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Handle YYYY-MM-DD (already ISO)
    if (dateStr.includes('-')) {
        return dateStr.split('T')[0];
    }

    return dateStr;
}

// Parse amount string to number
function parseAmount(amountStr: string): number {
    if (!amountStr) return 0;

    // Remove currency symbols, commas, spaces
    const cleaned = amountStr.replace(/[$,\s()]/g, '').trim();

    // Handle negative amounts (parentheses or minus sign)
    const isNegative = amountStr.includes('(') || amountStr.startsWith('-');
    let value = parseFloat(cleaned);

    if (isNaN(value)) return 0;
    if (isNegative && value > 0) value = -value;

    return value;
}

// Parse CSV content into rows
function parseCSVRows(csvContent: string): string[][] {
    const rows: string[][] = [];
    const lines = csvContent.split(/\r?\n/);

    for (const line of lines) {
        if (!line.trim()) continue;

        // Simple CSV parsing (handles quoted fields)
        const row: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        row.push(current.trim());
        rows.push(row);
    }

    return rows;
}

// Main CSV parsing function
export function parseCSV(
    csvContent: string,
    userMappings: Record<string, string> = {}
): ParsedTransaction[] {
    const rows = parseCSVRows(csvContent);

    if (rows.length < 2) {
        return [];
    }

    const headers = rows[0];
    const template = detectBankTemplate(headers);

    console.log(`Detected bank template: ${template.name}`);

    const dateIdx = findColumnIndex(headers, template.dateColumn);
    const descIdx = findColumnIndex(headers, template.descriptionColumn);
    const amountIdx = findColumnIndex(headers, template.amountColumn);
    const debitIdx = template.debitColumn ? findColumnIndex(headers, template.debitColumn) : -1;
    const creditIdx = template.creditColumn ? findColumnIndex(headers, template.creditColumn) : -1;

    const transactions: ParsedTransaction[] = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        if (row.length < 2) continue;

        const dateStr = dateIdx >= 0 ? row[dateIdx] : '';
        const rawDescription = descIdx >= 0 ? row[descIdx] : '';

        let amount = 0;
        let type: 'debit' | 'credit' = 'debit';

        if (debitIdx >= 0 && creditIdx >= 0) {
            // Wells Fargo style: separate debit/credit columns
            const debit = parseAmount(row[debitIdx]);
            const credit = parseAmount(row[creditIdx]);

            if (debit !== 0) {
                amount = Math.abs(debit);
                type = 'debit';
            } else if (credit !== 0) {
                amount = Math.abs(credit);
                type = 'credit';
            }
        } else if (amountIdx >= 0) {
            // Single amount column (positive = credit, negative = debit typically)
            amount = parseAmount(row[amountIdx]);
            type = amount < 0 ? 'debit' : 'credit';
            amount = Math.abs(amount);
        }

        if (!rawDescription || amount === 0) continue;

        const mappedDescription = applyMerchantMapping(rawDescription, userMappings);

        transactions.push({
            date: parseDate(dateStr),
            description: mappedDescription,
            rawDescription: rawDescription.trim(),
            amount: Math.round(amount * 100) / 100, // Round to 2 decimals
            type
        });
    }

    return transactions;
}

// Deterministic matching for amounts
export function findExactAmountMatches(
    bankTransactions: ParsedTransaction[],
    ledgerExpenses: { id: string; date: Date; amount: number; merchant: string }[]
): { matched: Array<{ bank: ParsedTransaction; expense: typeof ledgerExpenses[0]; confidence: number }>, unmatched: ParsedTransaction[] } {
    const matched: Array<{ bank: ParsedTransaction; expense: typeof ledgerExpenses[0]; confidence: number }> = [];
    const unmatchedBank = [...bankTransactions];
    const usedExpenseIds = new Set<string>();

    for (let i = unmatchedBank.length - 1; i >= 0; i--) {
        const bankTx = unmatchedBank[i];

        // Find expense with matching amount
        for (const expense of ledgerExpenses) {
            if (usedExpenseIds.has(expense.id)) continue;

            // Amount must match exactly (or within 1 cent for rounding)
            const amountMatch = Math.abs(bankTx.amount - expense.amount) < 0.02;

            if (amountMatch) {
                // Calculate date proximity (within 7 days)
                const bankDate = new Date(bankTx.date);
                const expenseDate = new Date(expense.date);
                const daysDiff = Math.abs((bankDate.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));

                if (daysDiff <= 7) {
                    // Calculate merchant similarity
                    const bankMerchant = bankTx.description.toLowerCase();
                    const expenseMerchant = expense.merchant.toLowerCase();

                    let merchantSimilarity = 0;
                    if (bankMerchant === expenseMerchant) {
                        merchantSimilarity = 1.0;
                    } else if (bankMerchant.includes(expenseMerchant) || expenseMerchant.includes(bankMerchant)) {
                        merchantSimilarity = 0.8;
                    } else {
                        // Check for partial word matches
                        const bankWords = bankMerchant.split(/\s+/);
                        const expenseWords = expenseMerchant.split(/\s+/);
                        const matchingWords = bankWords.filter(w => expenseWords.some(ew => ew.includes(w) || w.includes(ew)));
                        merchantSimilarity = matchingWords.length / Math.max(bankWords.length, expenseWords.length);
                    }

                    // Calculate overall confidence
                    // Amount match: 40%, Date proximity: 30%, Merchant match: 30%
                    const dateScore = daysDiff === 0 ? 1.0 : daysDiff === 1 ? 0.9 : daysDiff <= 3 ? 0.7 : 0.5;
                    const confidence = 0.4 + (0.3 * dateScore) + (0.3 * merchantSimilarity);

                    matched.push({ bank: bankTx, expense, confidence });
                    usedExpenseIds.add(expense.id);
                    unmatchedBank.splice(i, 1);
                    break;
                }
            }
        }
    }

    return { matched, unmatched: unmatchedBank };
}
