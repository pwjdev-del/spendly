/**
 * Query Parser - Builds AST from tokens
 */

import { type Token, tokenize } from "./lexer";
import { OPERATORS, type ComparisonKind } from "./operators";

export interface FilterNode {
    field: string;
    operator: ComparisonKind;
    values: string[];
    negated: boolean;
}

export interface ParseResult {
    filters: FilterNode[];
    searchTerms: string[];
    errors: string[];
}

/**
 * Map lexer operators to comparison kinds
 * For string fields with ":" operator, defaults to contains (partial match)
 */
function mapOperator(op: string, fieldType?: string): ComparisonKind {
    switch (op) {
        case ":":
        case "=":
            // For string fields, ":" means partial match (contains)
            // For other types, it means exact match
            return fieldType === "string" ? "contains" : "eq";
        case ">":
            return "gt";
        case "<":
            return "lt";
        case ">=":
            return "gte";
        case "<=":
            return "lte";
        default:
            return "eq";
    }
}

export function parse(query: string): ParseResult {
    const tokens = tokenize(query);
    const filters: FilterNode[] = [];
    const searchTerms: string[] = [];
    const errors: string[] = [];

    let i = 0;
    let negated = false;

    while (i < tokens.length && tokens[i].type !== "EOF") {
        const token = tokens[i];

        // Handle negation
        if (token.type === "NEGATION") {
            negated = true;
            i++;
            continue;
        }

        // Handle field:operator:value pattern
        if (token.type === "FIELD") {
            const field = token.value;

            // Check if this is a valid operator
            if (!OPERATORS[field]) {
                errors.push(`Unknown field: ${field}`);
                negated = false;
                i++;
                // Skip past the operator and value
                while (i < tokens.length && tokens[i].type !== "EOF" && tokens[i].type !== "FIELD" && tokens[i].type !== "NEGATION") {
                    i++;
                }
                continue;
            }

            const operatorDef = OPERATORS[field];
            i++; // Move past field

            if (i >= tokens.length || tokens[i].type !== "OPERATOR") {
                errors.push(`Expected operator after field: ${field}`);
                negated = false;
                continue;
            }

            // Pass field type to mapOperator so string fields use "contains" by default
            const operator = mapOperator(tokens[i].value, operatorDef.type);
            i++; // Move past operator

            // Collect all values (comma-separated = OR)
            const values: string[] = [];
            while (i < tokens.length) {
                if (tokens[i].type === "VALUE") {
                    values.push(tokens[i].value);
                    i++;
                } else if (tokens[i].type === "COMMA") {
                    i++;
                } else {
                    break;
                }
            }

            if (values.length === 0) {
                errors.push(`Expected value for field: ${field}`);
            } else {
                // Validate comparison is supported for this field
                if (!operatorDef.comparisons.includes(operator)) {
                    errors.push(`Operator ${operator} not supported for field: ${field}`);
                } else {
                    filters.push({
                        field,
                        operator,
                        values,
                        negated,
                    });
                }
            }

            negated = false;
            continue;
        }

        // Bare value = search term
        if (token.type === "VALUE") {
            searchTerms.push(token.value);
            i++;
            continue;
        }

        // Skip other tokens
        i++;
    }

    return { filters, searchTerms, errors };
}

/**
 * Validate a parsed query against operator definitions
 */
export function validate(result: ParseResult): string[] {
    const errors: string[] = [...result.errors];

    for (const filter of result.filters) {
        const operatorDef = OPERATORS[filter.field];

        if (!operatorDef) {
            errors.push(`Unknown field: ${filter.field}`);
            continue;
        }

        // Validate enum values
        if (operatorDef.type === "enum" && operatorDef.enumValues) {
            for (const value of filter.values) {
                if (!operatorDef.enumValues.includes(value.toLowerCase())) {
                    errors.push(
                        `Invalid value "${value}" for field "${filter.field}". ` +
                        `Expected: ${operatorDef.enumValues.join(", ")}`
                    );
                }
            }
        }

        // Validate number values
        if (operatorDef.type === "number") {
            for (const value of filter.values) {
                if (isNaN(parseFloat(value))) {
                    errors.push(`Invalid number value "${value}" for field "${filter.field}"`);
                }
            }
        }
    }

    return errors;
}
