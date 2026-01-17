"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

type TodoKind = "SUBMIT" | "APPROVE" | "RECONCILE" | "FIX_RECEIPT" | "RECATEGORIZE";

interface TodoItem {
    id: string;
    entityType: string;
    entityId: string;
    kind: TodoKind;
    priority: number;
    reason: string;
    primaryAction: string;
    title: string;
    amount?: number;
    merchant?: string;
    createdAt: Date;
    age: number; // Days since created
}

/**
 * Compute and return to-do items for current user
 * Uses role-based logic to determine actionable items
 */
export async function getTodos(): Promise<TodoItem[]> {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    const userId = session.user.id;
    const orgId = session.user.organizationId;
    const role = session.user.role || "MEMBER";
    const canApprove = ["APPROVER", "AUDITOR", "ADMIN"].includes(role);
    const canReconcile = ["AUDITOR", "ADMIN"].includes(role);

    const todos: TodoItem[] = [];
    const now = new Date();

    // 1. Approvals pending for user (if they can approve)
    if (canApprove && orgId) {
        // Admins in small orgs can self-approve, others must approve different users' expenses
        const isAdmin = role === "ADMIN";

        const pendingApprovals = await prisma.expense.findMany({
            where: {
                organizationId: orgId,
                status: "PENDING",
                // Admins can see all pending (including their own for single-admin orgs)
                // Non-admins can only approve others' expenses
                ...(isAdmin ? {} : { userId: { not: userId } }),
            },
            orderBy: { createdAt: "asc" },
            take: 20,
        });

        for (const expense of pendingApprovals) {
            const age = Math.floor((now.getTime() - expense.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            const isOwnExpense = expense.userId === userId;
            todos.push({
                id: `approve-${expense.id}`,
                entityType: "EXPENSE",
                entityId: expense.id,
                kind: "APPROVE",
                priority: age > 3 ? 1 : 2, // Higher priority if older
                reason: isOwnExpense ? "Self-review (admin)" : (age > 3 ? `Pending for ${age} days` : "Awaiting your approval"),
                primaryAction: "Approve",
                title: expense.merchant,
                amount: expense.amount,
                merchant: expense.merchant,
                createdAt: expense.createdAt,
                age,
            });
        }
    }

    // 2. Reconciliation items (if they can reconcile)
    if (canReconcile && orgId) {
        const unreconciled = await prisma.expense.findMany({
            where: {
                organizationId: orgId,
                reconciliationStatus: "UNRECONCILED",
                status: "APPROVED",
            },
            orderBy: { createdAt: "asc" },
            take: 20,
        });

        for (const expense of unreconciled) {
            const age = Math.floor((now.getTime() - expense.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            todos.push({
                id: `reconcile-${expense.id}`,
                entityType: "EXPENSE",
                entityId: expense.id,
                kind: "RECONCILE",
                priority: age > 7 ? 3 : 4,
                reason: age > 7 ? `Unreconciled for ${age} days` : "Ready for reconciliation",
                primaryAction: "Match",
                title: expense.merchant,
                amount: expense.amount,
                merchant: expense.merchant,
                createdAt: expense.createdAt,
                age,
            });
        }
    }

    // 3. User's own rejected expenses needing fix
    const rejectedExpenses = await prisma.expense.findMany({
        where: {
            userId,
            status: "REJECTED",
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
    });

    for (const expense of rejectedExpenses) {
        const age = Math.floor((now.getTime() - expense.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
        const hasReceipt = !!expense.receiptUrl;

        todos.push({
            id: `fix-${expense.id}`,
            entityType: "EXPENSE",
            entityId: expense.id,
            kind: hasReceipt ? "RECATEGORIZE" : "FIX_RECEIPT",
            priority: 5,
            reason: hasReceipt ? "Rejected - needs update" : "Missing receipt",
            primaryAction: hasReceipt ? "Edit" : "Add Receipt",
            title: expense.merchant,
            amount: expense.amount,
            merchant: expense.merchant,
            createdAt: expense.updatedAt,
            age,
        });
    }

    // 4. Pending trips assigned to user
    const pendingTrips = await prisma.trip.findMany({
        where: {
            OR: [
                { approverId: userId },
                { auditorId: userId },
            ],
            status: { in: ["PLANNING", "ACTIVE"] },
        },
        take: 10,
    });

    for (const trip of pendingTrips) {
        const age = Math.floor((now.getTime() - trip.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const isApprover = trip.approverId === userId;

        todos.push({
            id: `trip-${trip.id}`,
            entityType: "TRIP",
            entityId: trip.id,
            kind: isApprover ? "APPROVE" : "RECONCILE",
            priority: 6,
            reason: isApprover ? "Trip needs approval" : "Trip needs audit",
            primaryAction: isApprover ? "Review" : "Audit",
            title: trip.name,
            createdAt: trip.createdAt,
            age,
        });
    }

    // Sort by priority (lower = more urgent)
    todos.sort((a, b) => a.priority - b.priority);

    return todos;
}

/**
 * Get to-do count for badge
 */
export async function getTodoCount(): Promise<number> {
    const todos = await getTodos();
    return todos.length;
}

/**
 * Quick action: Approve expense from to-do
 */
export async function quickApprove(expenseId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const role = session.user.role || "MEMBER";
    if (!["APPROVER", "AUDITOR", "ADMIN"].includes(role)) {
        throw new Error("You don't have permission to approve expenses");
    }

    try {
        await prisma.expense.update({
            where: { id: expenseId },
            data: { status: "APPROVED" },
        });

        revalidatePath("/todo");
        revalidatePath("/expenses");

        return { success: true };
    } catch (error: any) {
        if (error.code === 'P2025') {
            // Record to update not found
            console.warn(`Expense ${expenseId} not found during quick approve`);
            return { error: "Expense not found or already processed" };
        }
        throw error;
    }
}

/**
 * Quick action: Reject expense from to-do
 */
export async function quickReject(expenseId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const role = session.user.role || "MEMBER";
    if (!["APPROVER", "AUDITOR", "ADMIN"].includes(role)) {
        throw new Error("You don't have permission to reject expenses");
    }

    try {
        await prisma.expense.update({
            where: { id: expenseId },
            data: { status: "REJECTED" },
        });

        revalidatePath("/todo");
        revalidatePath("/expenses");

        return { success: true };
    } catch (error: any) {
        if (error.code === 'P2025') {
            return { error: "Expense not found or already processed" };
        }
        throw error;
    }
}

/**
 * Quick action: Mark as reconciled
 */
export async function quickReconcile(expenseId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const role = session.user.role || "MEMBER";
    if (!["AUDITOR", "ADMIN"].includes(role)) {
        throw new Error("You don't have permission to reconcile expenses");
    }

    await prisma.expense.update({
        where: { id: expenseId },
        data: { reconciliationStatus: "RECONCILED" },
    });

    revalidatePath("/todo");
    revalidatePath("/expenses");

    return { success: true };
}
