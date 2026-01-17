/**
 * Prisma Translator - Converts parsed AST to Prisma where clauses
 * 
 * Safe: No raw SQL, all queries go through Prisma's parameterized queries
 */

import { type FilterNode, type ParseResult } from "./parser";
import { OPERATORS } from "./operators";
import { parseRelativeDate } from "./relative-dates";

type PrismaWhere = Record<string, unknown>;

/**
 * Build a Prisma condition for a single filter value
 */
function buildValueCondition(
    field: string,
    operator: string,
    value: string,
    prismaField: string
): PrismaWhere {
    const operatorDef = OPERATORS[field];

    // Handle special virtual fields
    if (prismaField === "_entityType") {
        // Entity type filter handled separately by caller
        return {};
    }

    if (prismaField === "_has") {
        // Boolean checks
        switch (value.toLowerCase()) {
            case "receipt":
                return { receiptUrl: { not: null } };
            case "location":
                return {
                    AND: [
                        { latitude: { not: null } },
                        { longitude: { not: null } },
                    ],
                };
            case "trip":
                return { tripId: { not: null } };
            default:
                return {};
        }
    }

    // Handle nested fields (e.g., "user.email")
    const fieldParts = prismaField.split(".");

    // Build the value based on type
    let processedValue: unknown = value;

    if (operatorDef.type === "number") {
        processedValue = parseFloat(value);
    } else if (operatorDef.type === "date") {
        const dateRange = parseRelativeDate(value);
        if (dateRange) {
            if (dateRange.eq) {
                processedValue = dateRange.eq;
            } else {
                // Date range - return compound condition
                const conditions: PrismaWhere = {};
                if (dateRange.gte) conditions.gte = dateRange.gte;
                if (dateRange.lte) conditions.lte = dateRange.lte;
                return buildNestedWhere(fieldParts, conditions);
            }
        }
    } else if (operatorDef.type === "enum") {
        processedValue = value.toUpperCase();
    }

    // Map operator to Prisma
    let prismaOp: PrismaWhere;
    switch (operator) {
        case "eq":
            prismaOp = { equals: processedValue } as PrismaWhere;
            break;
        case "gt":
            prismaOp = { gt: processedValue };
            break;
        case "lt":
            prismaOp = { lt: processedValue };
            break;
        case "gte":
            prismaOp = { gte: processedValue };
            break;
        case "lte":
            prismaOp = { lte: processedValue };
            break;
        case "contains":
            // Note: SQLite doesn't support mode: "insensitive" - its LIKE is case-insensitive by default
            prismaOp = { contains: processedValue };
            break;
        default:
            prismaOp = { equals: processedValue } as PrismaWhere;
    }

    return buildNestedWhere(fieldParts, prismaOp);
}

/**
 * Build nested where clause for dotted field paths
 */
function buildNestedWhere(parts: string[], condition: unknown): PrismaWhere {
    if (parts.length === 1) {
        return { [parts[0]]: condition };
    }

    return {
        [parts[0]]: buildNestedWhere(parts.slice(1), condition),
    };
}

/**
 * Translate a single filter to Prisma where clause
 */
function translateFilter(filter: FilterNode): PrismaWhere {
    const operatorDef = OPERATORS[filter.field];
    if (!operatorDef) return {};

    const prismaField = operatorDef.prismaField || operatorDef.field;

    // Multiple values = OR condition
    if (filter.values.length > 1) {
        const orConditions = filter.values.map((value) =>
            buildValueCondition(filter.field, filter.operator, value, prismaField)
        );

        const condition: PrismaWhere = { OR: orConditions };
        return filter.negated ? { NOT: condition } : condition;
    }

    // Single value
    const condition = buildValueCondition(
        filter.field,
        filter.operator,
        filter.values[0],
        prismaField
    );

    return filter.negated ? { NOT: condition } : condition;
}

/**
 * Translate full parsed query to Prisma where clause
 */
export function translateToPrisma(parsed: ParseResult): PrismaWhere {
    const conditions: PrismaWhere[] = [];

    // Add filter conditions
    for (const filter of parsed.filters) {
        const condition = translateFilter(filter);
        if (Object.keys(condition).length > 0) {
            conditions.push(condition);
        }
    }

    // Add search terms as merchant/category contains search
    if (parsed.searchTerms.length > 0) {
        // SQLite's LIKE is case-insensitive by default, so no mode needed
        const searchConditions = parsed.searchTerms.map((term) => ({
            OR: [
                { merchant: { contains: term } },
                { category: { contains: term } },
            ],
        }));
        conditions.push(...searchConditions);
    }

    // Combine with AND
    if (conditions.length === 0) {
        return {};
    }

    if (conditions.length === 1) {
        return conditions[0];
    }

    return { AND: conditions };
}

/**
 * High-level function to parse and translate a query string
 */
export function queryToWhere(queryString: string): {
    where: PrismaWhere;
    errors: string[];
} {
    const { parse, validate } = require("./parser");

    const parsed = parse(queryString);
    const errors = validate(parsed);

    if (errors.length > 0) {
        return { where: {}, errors };
    }

    return {
        where: translateToPrisma(parsed),
        errors: [],
    };
}
