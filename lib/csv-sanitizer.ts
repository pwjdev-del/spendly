/**
 * Security utility: Protects against CSV injection attacks
 * 
 * CSV Injection (Formula Injection) occurs when malicious formulas like
 * =1+1, @SUM(A1:A10), +cmd|'/c calc', etc. are embedded in CSV files
 * and executed by spreadsheet applications when opened.
 */

export function sanitizeCSVValue(value: string | null | undefined): string {
    if (!value) return "";

    const stringValue = String(value);

    // Check if value starts with potential injection characters
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];

    if (dangerousChars.some(char => stringValue.startsWith(char))) {
        // Escape by prepending single quote
        return "'" + stringValue;
    }

    return stringValue;
}

/**
 * Sanitize an entire row of CSV data
 */
export function sanitizeCSVRow(row: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeCSVValue(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}
