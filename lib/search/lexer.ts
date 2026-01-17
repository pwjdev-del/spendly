/**
 * Query Lexer - Tokenizes search query strings
 * 
 * Supports:
 * - field:value operators
 * - Comparisons: field>value, field<value, field>=value, field<=value
 * - Negation: -field:value
 * - Quoted strings: field:"multi word value"
 * - OR with comma: field:value1,value2
 */

export type TokenType =
    | "FIELD"
    | "OPERATOR"
    | "VALUE"
    | "NEGATION"
    | "COMMA"
    | "LPAREN"
    | "RPAREN"
    | "EOF";

export interface Token {
    type: TokenType;
    value: string;
    position: number;
}

export class Lexer {
    private input: string;
    private position: number = 0;
    private tokens: Token[] = [];

    constructor(input: string) {
        this.input = input.trim();
    }

    tokenize(): Token[] {
        while (this.position < this.input.length) {
            this.skipWhitespace();

            if (this.position >= this.input.length) break;

            const char = this.input[this.position];

            // Negation
            if (char === "-" && this.position + 1 < this.input.length && /[a-zA-Z]/.test(this.input[this.position + 1])) {
                this.tokens.push({ type: "NEGATION", value: "-", position: this.position });
                this.position++;
                continue;
            }

            // Parentheses
            if (char === "(") {
                this.tokens.push({ type: "LPAREN", value: "(", position: this.position });
                this.position++;
                continue;
            }

            if (char === ")") {
                this.tokens.push({ type: "RPAREN", value: ")", position: this.position });
                this.position++;
                continue;
            }

            // Field:value or comparison
            if (/[a-zA-Z]/.test(char)) {
                this.readFieldOperator();
                continue;
            }

            // Unknown character, skip
            this.position++;
        }

        this.tokens.push({ type: "EOF", value: "", position: this.position });
        return this.tokens;
    }

    private skipWhitespace(): void {
        while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
            this.position++;
        }
    }

    private readFieldOperator(): void {
        const startPos = this.position;
        let field = "";

        // Read field name
        while (this.position < this.input.length && /[a-zA-Z0-9_-]/.test(this.input[this.position])) {
            field += this.input[this.position];
            this.position++;
        }

        if (this.position >= this.input.length) {
            // Just a bare word, treat as search term
            this.tokens.push({ type: "VALUE", value: field, position: startPos });
            return;
        }

        const operatorChar = this.input[this.position];

        // Determine operator type
        let operator = "";
        if (operatorChar === ":") {
            operator = ":";
            this.position++;
        } else if (operatorChar === ">" || operatorChar === "<") {
            operator = operatorChar;
            this.position++;
            if (this.input[this.position] === "=") {
                operator += "=";
                this.position++;
            }
        } else if (operatorChar === "=") {
            operator = "=";
            this.position++;
        } else {
            // Just a bare word
            this.tokens.push({ type: "VALUE", value: field, position: startPos });
            return;
        }

        this.tokens.push({ type: "FIELD", value: field.toLowerCase(), position: startPos });
        this.tokens.push({ type: "OPERATOR", value: operator, position: startPos + field.length });

        // Read value(s)
        this.readValues();
    }

    private readValues(): void {
        // Handle comma-separated values (OR)
        while (this.position < this.input.length) {
            this.skipWhitespace();

            const char = this.input[this.position];

            // Stop on whitespace or end
            if (!char || /\s/.test(char)) break;

            // Comma means another value coming
            if (char === ",") {
                this.tokens.push({ type: "COMMA", value: ",", position: this.position });
                this.position++;
                continue;
            }

            // Read the value
            const value = this.readValue();
            if (value) {
                this.tokens.push({ type: "VALUE", value, position: this.position - value.length });
            } else {
                break;
            }
        }
    }

    private readValue(): string {
        const startPos = this.position;

        // Quoted string
        if (this.input[this.position] === '"') {
            this.position++; // Skip opening quote
            let value = "";
            while (this.position < this.input.length && this.input[this.position] !== '"') {
                // Handle escaped quotes
                if (this.input[this.position] === "\\" && this.input[this.position + 1] === '"') {
                    value += '"';
                    this.position += 2;
                } else {
                    value += this.input[this.position];
                    this.position++;
                }
            }
            this.position++; // Skip closing quote
            return value;
        }

        // Unquoted value (stop at whitespace or comma)
        let value = "";
        while (
            this.position < this.input.length &&
            !/[\s,)]/.test(this.input[this.position])
        ) {
            value += this.input[this.position];
            this.position++;
        }
        return value;
    }
}

export function tokenize(query: string): Token[] {
    return new Lexer(query).tokenize();
}
