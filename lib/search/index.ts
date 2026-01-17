/**
 * Kharcho Power Search Engine
 * 
 * Usage:
 * ```ts
 * import { search } from "@/lib/search";
 * 
 * const { where, errors } = search.parse("status:pending amount>100");
 * if (errors.length === 0) {
 *   const expenses = await prisma.expense.findMany({ where });
 * }
 * ```
 */

export { tokenize, type Token, type TokenType } from "./lexer";
export { parse, validate, type FilterNode, type ParseResult } from "./parser";
export { translateToPrisma } from "./translator";
export { OPERATORS, RELATIVE_DATES, type OperatorDef } from "./operators";
export { parseRelativeDate, type DateRange } from "./relative-dates";

import { parse, validate } from "./parser";
import { translateToPrisma } from "./translator";

/**
 * Parse a query string and return Prisma where clause
 */
export function parseQuery(queryString: string): {
    where: Record<string, unknown>;
    errors: string[];
    filters: import("./parser").FilterNode[];
    searchTerms: string[];
} {
    const parsed = parse(queryString);
    const errors = validate(parsed);

    if (errors.length > 0) {
        return {
            where: {},
            errors,
            filters: parsed.filters,
            searchTerms: parsed.searchTerms,
        };
    }

    return {
        where: translateToPrisma(parsed),
        errors: [],
        filters: parsed.filters,
        searchTerms: parsed.searchTerms,
    };
}

/**
 * Get autocomplete suggestions for a partial query
 */
export function getAutocompleteSuggestions(
    partialQuery: string,
    cursorPosition?: number
): string[] {
    const pos = cursorPosition ?? partialQuery.length;
    const beforeCursor = partialQuery.slice(0, pos);
    const afterColon = beforeCursor.split(/\s+/).pop() || "";

    // If we're typing a field name
    if (!afterColon.includes(":") && !afterColon.includes(">") && !afterColon.includes("<")) {
        const fieldPrefix = afterColon.toLowerCase();
        return Object.keys(require("./operators").OPERATORS)
            .filter((field) => field.startsWith(fieldPrefix))
            .map((field) => `${field}:`);
    }

    // If we're typing a value
    const [field, valuePart] = afterColon.split(/[:><=]+/);
    const operatorDef = require("./operators").OPERATORS[field?.toLowerCase()];

    if (operatorDef?.enumValues) {
        const valuePrefix = (valuePart || "").toLowerCase();
        return operatorDef.enumValues
            .filter((v: string) => v.startsWith(valuePrefix))
            .map((v: string) => `${field}:${v}`);
    }

    if (operatorDef?.type === "date") {
        const valuePrefix = (valuePart || "").toLowerCase();
        return require("./operators").RELATIVE_DATES
            .filter((d: string) => d.startsWith(valuePrefix))
            .map((d: string) => `${field}:${d}`);
    }

    return [];
}
