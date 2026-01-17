/**
 * Query Operators - Defines all supported search operators and their types
 */

export type OperatorType = "string" | "number" | "date" | "boolean" | "enum";
export type ComparisonKind = "eq" | "gt" | "lt" | "gte" | "lte" | "contains";

export interface OperatorDef {
    field: string;
    type: OperatorType;
    comparisons: ComparisonKind[];
    prismaField?: string; // Maps to actual Prisma field if different
    enumValues?: string[]; // For enum types
    aliases?: string[]; // Alternative names
}

export const OPERATORS: Record<string, OperatorDef> = {
    // Status filters
    status: {
        field: "status",
        type: "enum",
        comparisons: ["eq"],
        enumValues: ["pending", "approved", "rejected", "draft"],
    },

    // Amount filters
    amount: {
        field: "amount",
        type: "number",
        comparisons: ["eq", "gt", "lt", "gte", "lte"],
    },

    // Date filters
    date: {
        field: "date",
        type: "date",
        comparisons: ["eq", "gt", "lt", "gte", "lte"],
    },
    created: {
        field: "createdAt",
        type: "date",
        comparisons: ["eq", "gt", "lt", "gte", "lte"],
        prismaField: "createdAt",
    },

    // Text filters
    merchant: {
        field: "merchant",
        type: "string",
        comparisons: ["eq", "contains"],
    },
    category: {
        field: "category",
        type: "string",
        comparisons: ["eq"],
    },
    currency: {
        field: "currency",
        type: "enum",
        comparisons: ["eq"],
        enumValues: ["usd", "eur", "gbp", "inr"],
    },

    // Entity type filter
    type: {
        field: "entityType",
        type: "enum",
        comparisons: ["eq"],
        enumValues: ["expense", "trip", "reconciliation"],
        prismaField: "_entityType", // Virtual field
    },

    // Boolean filters
    has: {
        field: "has",
        type: "enum",
        comparisons: ["eq"],
        enumValues: ["receipt", "location", "trip"],
        prismaField: "_has", // Virtual field
    },

    // User filters
    user: {
        field: "userId",
        type: "string",
        comparisons: ["eq"],
        prismaField: "user.email",
    },
    approver: {
        field: "approverId",
        type: "string",
        comparisons: ["eq"],
        prismaField: "trip.approver.email",
    },

    // Trip filter
    trip: {
        field: "tripId",
        type: "string",
        comparisons: ["eq"],
        prismaField: "trip.name",
    },

    // Reconciliation filters
    reconciled: {
        field: "reconciliationStatus",
        type: "enum",
        comparisons: ["eq"],
        enumValues: ["unreconciled", "matched", "reconciled"],
        prismaField: "reconciliationStatus",
    },
};

// Relative date keywords
export const RELATIVE_DATES = [
    "today",
    "yesterday",
    "this-week",
    "last-week",
    "this-month",
    "last-month",
    "last-7-days",
    "last-30-days",
    "last-90-days",
    "this-quarter",
    "this-year",
] as const;

export type RelativeDate = (typeof RELATIVE_DATES)[number];

export function isRelativeDate(value: string): value is RelativeDate {
    return RELATIVE_DATES.includes(value as RelativeDate);
}
