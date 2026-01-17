import { PrismaClient } from "@prisma/client";
import { CreateExpenseSchema } from "../lib/schemas";
import { z } from "zod";

const prisma = new PrismaClient();

async function runAudit() {
    console.log("🔥 STARTING RED TEAM AUDIT 🔥");
    const results = [];

    // --- TEST 1: Zod Input Fuzzing ---
    console.log("\n[TEST 1] Input Integrity (Zod)");

    // 1a. Negative Amount
    const negPayload = {
        merchant: "Teapot",
        amount: -500,
        currency: "USD",
        category: "General",
        date: new Date().toISOString()
    };
    const negResult = CreateExpenseSchema.safeParse(negPayload);
    if (!negResult.success && negResult.error.issues[0].message.includes("positive")) {
        console.log("✅ Negative Amount: BLOCKED");
        results.push({ name: "Negative Amount", passed: true });
    } else {
        console.log("❌ Negative Amount: FAILED TO BLOCK");
        results.push({ name: "Negative Amount", passed: false });
    }

    // 1b. Overflow
    // Zod number validation handles Javascript numbers. 
    // If we pass a string that parses to 'Infinity', or a super large number.
    const overflowPayload = { ...negPayload, amount: Infinity };
    // Zod usually allows Infinity unless .finite() is used. 
    // Let's check if our schema blocks Infinity? We didn't add .finite().
    // We'll see.
    const ovResult = CreateExpenseSchema.safeParse(overflowPayload);
    // Actually, in the text "9999..." it parses to a finite number usually.
    // If it passes, we mark as "Accepted".
    console.log(`ℹ️ Infinity Payload Result: ${ovResult.success}`);

    // --- TEST 2: Database Constraints (Idempotency) ---
    console.log("\n[TEST 2] Idempotency Mechanism");
    const key = `audit-key-${Date.now()}`;
    const user = await prisma.user.findFirst();

    if (!user) {
        console.log("⚠️ No user found. Skipping DB Tests.");
    } else {
        try {
            // Create Key
            await prisma.idempotencyKey.create({
                data: {
                    key: key,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 100000)
                }
            });
            console.log("✅ Created Key 1");

            // Try Duplicate
            try {
                await prisma.idempotencyKey.create({
                    data: {
                        key: key,
                        userId: user.id,
                        expiresAt: new Date(Date.now() + 100000)
                    }
                });
                console.log("❌ Idempotency: FAILED (Duplicate Allowed)");
                results.push({ name: "Idempotency Check", passed: false });
            } catch (e) {
                console.log("✅ Idempotency: PASSED (Duplicate Blocked by DB)");
                results.push({ name: "Idempotency Check", passed: true });
            }

        } catch (e: any) {
            console.error("DB Error:", e.message);
            results.push({ name: "Idempotency Check", passed: false, error: e.message });
        }
    }

    // --- REPORT ---
    console.log("\n📊 FINAL REPORT");
    console.table(results);
    process.exit(0);
}

runAudit();
