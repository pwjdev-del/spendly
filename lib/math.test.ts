
import { SafeMath } from "./math";
import { describe, it, expect } from "vitest"; // Assuming vitest, or standard test runner

// Mock minimal test runner if strictly node
// But ideally we use a proper runner. For now, let's write standard test code.

const runTests = () => {
    console.log("Running SafeMath Tests...");
    
    // Test toCents
    const cases = [
        { input: 10.50, expected: 1050 },
        { input: "10.50", expected: 1050 },
        { input: 0, expected: 0 },
        { input: 100, expected: 10000 },
        { input: 0.1, expected: 10 },    // Standard float issue: 0.1 * 100 = 10.000000000000002
        { input: 0.2, expected: 20 },    // 0.2 * 100 = 20.000000000000004
        { input: 0.29, expected: 29 },   // 0.29 * 100 = 28.999999999999996 -> Math.round fixes this
    ];

    let passed = 0;
    let failed = 0;

    cases.forEach(({ input, expected }) => {
        const result = SafeMath.toCents(input);
        if (result === expected) {
            passed++;
        } else {
            console.error(`FAILED: Input ${input}. Expected ${expected}, Got ${result}`);
            failed++;
        }
    });

    console.log(`Tests Completed: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) process.exit(1);
};

// Auto-run if executed directly
if (require.main === module) {
    runTests();
}

export { runTests };
