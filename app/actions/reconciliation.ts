"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { canReconcile } from "@/lib/permissions"
import { parseBankCSV } from "@/lib/reconciliation/csv-parser"

export async function uploadReconciliationFile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { error: "Not authenticated" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, organizationId: true }
    });

    if (!user || !canReconcile(user.role)) {
        return { error: "Unauthorized: You do not have permission to reconcile." };
    }

    const file = formData.get("file") as File;
    if (!file) return { error: "No file provided" };

    try {
        const text = await file.text();
        const result = parseBankCSV(text);

        if (result.errors.length > 0) {
            // Return first 5 errors to avoid massive payloads
            return { success: false, errors: result.errors.slice(0, 5) };
        }

        // Return transactions for client-side preview
        // In a real app, we might save to a temp DB table "ReconciliationBatch"
        return { success: true, transactions: result.transactions };
    } catch (e: any) {
        console.error("CSV Processing Error:", e);
        return { success: false, error: "Failed to process CSV file." };
    }
}
