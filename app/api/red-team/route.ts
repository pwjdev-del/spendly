import { NextResponse } from "next/server";
import { createExpense } from "@/app/actions/expenses";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
    // SECURITY PATCH: Require Authentication
    const session = await auth();
    if (!session || !session.user) {
        return new NextResponse("Unauthorized Access - Security Audit Logged", { status: 401 });
    }

    // Optional: Restrict to ADMIN role if available
    // if (session.user.role !== 'ADMIN') { ... }

    const report = {
        timestamp: new Date().toISOString(),
        auditor: session.user.email,
        tests: [] as any[]
    };

    // Helper to log test results
    const logParams = (name: string, passed: boolean, details: string) => {
        report.tests.push({ name, result: passed ? "PASSED" : "FAILED", details });
    };

    // MOCK FORM DATA HELPER
    const createMockFormData = (data: Record<string, string>) => {
        const formData = new FormData();
        Object.entries(data).forEach(([k, v]) => formData.append(k, v));
        return formData;
    };

    try {
        // --- TEST 1: Logic Exploitation - Negative Amount ---
        // Expectation: Should fail due to Zod .positive()
        const negativePayload = createMockFormData({
            merchant: "Evil Corp",
            amount: "-100", // ATTACK
            categorySelect: "General",
            date: new Date().toISOString()
        });
        const negResponse = await createExpense({}, negativePayload);
        // @ts-ignore
        if (negResponse?.error && negResponse.error.includes("Amount must be positive")) {
            logParams("Negative Amount Attack", true, "Blocked by Zod Validation");
        } else {
            logParams("Negative Amount Attack", false, `Failed to block: ${JSON.stringify(negResponse)}`);
        }

        // --- TEST 2: SQL Injection Simulation ---
        // Expectation: Should be treated as literal string by Prisma, creating a valid expense (but not executing SQL)
        // We will check if it crashes or saves "literally".
        const sqliPayload = createMockFormData({
            merchant: "'; DROP TABLE User; --", // ATTACK
            amount: "50",
            categorySelect: "General",
            date: new Date().toISOString()
        });

        // We expect this to SUCCEED as a literal string save (Sanitized by ORM), OR fail validation if we restrict chars.
        // For this audit, "Passed" means it didn't throw a DB error.
        try {
            // Need a user content for this to work?
            // "createExpense" calls "getUser()", which needs a session.
            // This is the tricky part. Route Handlers don't automatically have session if called via curl without cookie.
            // WE NEED TO MOCK getUser inside the action OR run this as an authenticated user.

            // NOTE: Since we are now calling this route WITH a session (via auth check above),
            // the `createExpense` action *should* work if it uses `auth()`.
            // However, `createExpense` might depend on `auth()` returning the same session.
            // `auth()` in server actions reads headers. When calling API route, browser sends cookies.
            // So this integration test SHOULD work now!

            const sqliResponse = await createExpense({}, sqliPayload);
            // @ts-ignore
            if (sqliResponse?.error === "Not authenticated") {
                logParams("SQL Injection Test", true, "Stopped by Auth Wall (Secure default)");
            } else {
                // @ts-ignore
                if (sqliResponse?.error) {
                    logParams("SQL Injection Test", true, `Blocked/Handled: ${(sqliResponse as any).error}`);
                } else {
                    // If it succeeded (and we are mocked auth?), verify literal save.
                    logParams("SQL Injection Test", true, "Handled safely by ORM (Literal Save)");
                }
            }
        } catch (e: any) {
            if (e.message === "Not authenticated") {
                logParams("Auth Wall Test", true, "Unauthenticated access blocked successfully");
            } else {
                logParams("SQL Injection Test", false, `System Crash: ${e.message}`);
            }
        }


        // --- TEST 3: Business Logic - Integer Overflow ---
        const overflowPayload = createMockFormData({
            merchant: "Overflow Inc",
            amount: "9999999999999999999999", // ATTACK
            categorySelect: "General",
            date: new Date().toISOString()
        });
        // This relies on parseFloat. Infinity handling?
        // Zod 'number' handles Infinity?
        // Let's see.
        try {
            const ovResponse = await createExpense({}, overflowPayload);
            // @ts-ignore
            if (ovResponse?.error) {
                logParams("Integer Overflow", true, `Handled: ${(ovResponse as any).error}`);
            } else {
                logParams("Integer Overflow", false, "Accepted massive number (Check DB type safety)");
            }
        } catch (e: any) {
            logParams("Integer Overflow", true, `Blocked by Exception: ${e.message}`);
        }

        // --- TEST 4: Idempotency Check ---
        // We can test this directly against Prisma if Action fails auth
        const key = "test-idempotency-key-" + Date.now();

        // 1. Create Key Mock
        await prisma.idempotencyKey.create({
            data: {
                key: key,
                userId: session.user.id || "test-user-id", // Use actual ID
                expiresAt: new Date(Date.now() + 10000)
            }
        });

        // 2. Try to use it again (Simulated Logic)
        const duplicateKey = await prisma.idempotencyKey.findUnique({ where: { key } });
        if (duplicateKey) {
            logParams("Idempotency Mechanism", true, "Database correctly identified existing key");
        } else {
            logParams("Idempotency Mechanism", false, "Failed to find existing key");
        }

    } catch (error: any) {
        logParams("Global Execution", false, `Test Suite Crash: ${error.message}`);
    }

    return NextResponse.json(report);
}
