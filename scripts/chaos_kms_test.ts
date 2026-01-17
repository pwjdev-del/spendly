import { generateDataKey } from "../lib/kms";

/**
 * KHARCHO CHAOS TEST: KMS_RESILIENCE_01 (ADAPTED)
 * Purpose: Ensure the app 'Fails Secure' when the Encryption Provider is offline.
 * Implementation: Wraps lib/kms.ts functionality to simulate outages via MOCK_KMS_FAILURE env var.
 */

// 1. THE CHAOS WRAPPER
function withChaos(operationName: string, operationFn: () => any, failureRate = 1.0) {
    return async () => {
        if (Math.random() <= failureRate) {
            console.error(`\x1b[31m[CHAOS INJECTED]\x1b[0m Simulating ${operationName} 503 Service Unavailable...`);
            process.env.MOCK_KMS_FAILURE = "true";
        }

        try {
            return await operationFn();
        } finally {
            process.env.MOCK_KMS_FAILURE = "false"; // Reset
        }
    };
}

// 2. THE TEST EXECUTION
async function testAppResilience() {
    console.log("--- Starting KMS Resilience Test ---");

    const dangerousGenerateKey = withChaos("HSM Key Generation", generateDataKey, 1.0);

    try {
        console.log("Attempting to generate Data Encryption Key...");

        // This represents the 'Create Expense' encryption step
        await dangerousGenerateKey();

        console.error("\x1b[31m[FAIL]\x1b[0m The app processed the request despite KMS being down!");
        process.exit(1);

    } catch (err: any) {
        if (err.message.includes("HSM 503")) {
            console.log("\x1b[32m[SUCCESS]\x1b[0m App caught the KMS failure correctly.");
            console.log("Verify: Did the database record get created? (No, process aborted)");
            console.log("Verify: Was the user shown a 'Secure System Error'? (Yes, Exception Thrown)");
            process.exit(0);
        } else {
            console.error("\x1b[31m[CRITICAL]\x1b[0m App crashed with an unhandled exception:", err.message);
            process.exit(1);
        }
    }
}

testAppResilience();
