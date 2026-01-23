"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { canApprove, canCreateExpenseForOthers, canManageSystem } from "@/lib/permissions"
import { canAddExpense } from "@/lib/trip-workflow"
import { CreateExpenseSchema } from "@/lib/schemas"
import { z } from "zod"
import { ActionResult } from "@/lib/api-types"
import { SafeMath } from "@/lib/math"

async function getUser() {
    const session = await auth()
    if (!session?.user?.email) throw new Error("Not authenticated")

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    })
    if (!user) throw new Error("User not found")
    return user
}

export async function createExpense(prevState: any, formData: FormData): Promise<ActionResult<any>> {
    const rawAmount = formData.get("amount");
    // Handle both "10.50" (string) and potential raw inputs
    const amountInCents = rawAmount ? SafeMath.toCents(rawAmount.toString()) : 0;

    const rawData = {
        merchant: formData.get("merchant"),
        amount: amountInCents,
        currency: formData.get("currency") || "USD",
        category: formData.get("categorySelect") === "Other" ? formData.get("customCategory") : (formData.get("categorySelect") || "General"),
        date: formData.get("date"),
        latitude: formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null,
        longitude: formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null,
        locationName: formData.get("locationName"),
        tripId: (formData.get("tripId") && formData.get("tripId") !== "none") ? formData.get("tripId") : null,
        idempotencyKey: formData.get("idempotencyKey")
    }

    // 1. Strict Server-Side Validation
    const validated = CreateExpenseSchema.safeParse(rawData)
    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message }
    }
    const data = validated.data

    // ---------------------------------------------------------
    // GEOCODING ENHANCEMENT (Server-Side)
    // ---------------------------------------------------------
    if (!data.latitude || !data.longitude) {
        // Try to find location from locationName first, then merchant
        const query = data.locationName || data.merchant;
        if (query) {
            try {
                // Dynamic import to avoid circular dep issues if any
                const { geocodeWithNominatim } = await import("@/lib/geocoding");
                const geoResult = await geocodeWithNominatim(query);

                if (geoResult) {
                    data.latitude = geoResult.latitude;
                    data.longitude = geoResult.longitude;
                    // Optional: update location name if it was just merchant
                    if (!data.locationName) {
                        data.locationName = geoResult.displayName;
                    }
                }
            } catch (e) {
                // Ignore geocoding errors, proceed without location
                console.error("Geocoding failed gracefully:", e);
            }
        }
    }
    // ---------------------------------------------------------

    const user = await getUser()

    // 2. Idempotency Check
    if (data.idempotencyKey) {
        const existingKey = await prisma.idempotencyKey.findUnique({
            where: { key: data.idempotencyKey }
        })
        if (existingKey) {
            return { success: false, error: "Duplicate request detected (Idempotency Key violation)" }
        }
    }

    // Logic flags
    const force = formData.get("force") === "true"
    const replaceId = formData.get("replaceId") as string

    // Parse the transaction date
    const transactionDate = new Date(data.date)

    // DUPLICATE CHECK (Business Logic Duplicate, separate from Idempotency)
    if (!force && !replaceId) {
        const startWindow = new Date(transactionDate.getTime() - 60000)
        const endWindow = new Date(transactionDate.getTime() + 60000)

        const existing = await prisma.expense.findFirst({
            where: {
                userId: user.id,
                merchant: data.merchant,
                amount: data.amount,
                date: {
                    gte: startWindow,
                    lte: endWindow
                },
            }
        })

        if (existing) {
            return {
                success: false,
                error: "A similar expense already exists."
            }
        }
    }

    // Handle Receipt Upload
    const file = formData.get("file") as File
    let receiptUrl = null

    if (file && file.size > 0) {
        try {
            const { storage } = await import("@/lib/storage");
            receiptUrl = await storage.upload(file, "receipts");
        } catch (error) {
            console.error("Receipt upload failed:", error);
            return { success: false, error: "Failed to upload receipt file." }
        }
    }

    // Trip Locking Validation
    if (data.tripId) {
        const trip = await prisma.trip.findUnique({
            where: { id: data.tripId },
            select: { status: true }
        })

        if (trip && !canAddExpense(trip.status)) {
            return { success: false, error: `Cannot add expenses to trip in '${trip.status}' status` }
        }
    }

    // REPLICATE / UPDATE LOGIC
    if (replaceId) {
        const existingToReplace = await prisma.expense.findUnique({
            where: { id: replaceId },
            select: { status: true, userId: true, tripId: true }
        })

        // Check if existing expense belongs to a locked trip
        if (existingToReplace?.tripId) {
            const existingTrip = await prisma.trip.findUnique({
                where: { id: existingToReplace.tripId },
                select: { status: true }
            })
            if (existingTrip && !canAddExpense(existingTrip.status)) {
                return { success: false, error: `Cannot edit expense from a locked trip (${existingTrip.status})` }
            }
        }

        // RBAC: Edit Check
        if (existingToReplace?.userId !== user.id && !canManageSystem(user.role)) {
            return { success: false, error: "Unauthorized to edit this expense" }
        }

        if (existingToReplace?.status === "APPROVED") {
            return { success: false, error: "Cannot edit a verified (approved) expense." }
        }

        await prisma.expense.update({
            where: { id: replaceId },
            data: {
                merchant: data.merchant,
                amount: data.amount,
                currency: data.currency,
                category: data.category,
                date: transactionDate,
                ...(receiptUrl ? { receiptUrl } : {}),
                organizationId: user.organizationId!,
                tripId: data.tripId,
                status: "PENDING",
                latitude: data.latitude,
                longitude: data.longitude,
                locationName: data.locationName
            }
        })
    } else {
        // Transaction to ensure Idempotency Key + Expense are created together
        await prisma.$transaction(async (tx) => {
            // Create Expense
            await tx.expense.create({
                data: {
                    merchant: data.merchant,
                    amount: data.amount,
                    currency: data.currency,
                    category: data.category,
                    date: transactionDate,
                    status: "PENDING",
                    receiptUrl: receiptUrl,
                    userId: user.id,
                    organizationId: user.organizationId!,
                    tripId: data.tripId,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    locationName: data.locationName
                },
            })

            // Mark Idempotency Key as used
            if (data.idempotencyKey) {
                await tx.idempotencyKey.create({
                    data: {
                        key: data.idempotencyKey,
                        userId: user.id,
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h expiry
                    }
                })
            }
        })
    }

    revalidatePath("/expenses")
    revalidatePath("/trips")
    if (data.tripId) {
        revalidatePath(`/trips/${data.tripId}`)
        redirect(`/trips/${data.tripId}`)
    } else {
        redirect("/expenses")
    }

    return { success: true, data: null }
}

export async function approveExpense(id: string) {
    const user = await getUser()
    if (!canApprove(user.role)) {
        throw new Error("Unauthorized: Insufficient permissions to approve expenses")
    }

    // ✅ SECURITY: Verify expense belongs to same organization
    const expense = await prisma.expense.findUnique({
        where: { id },
        select: { organizationId: true, status: true, merchant: true, amount: true }
    })

    if (!expense) {
        throw new Error("Expense not found")
    }

    if (expense.organizationId !== user.organizationId) {
        throw new Error("Unauthorized: Cross-organization access denied")
    }

    if (expense.status === "APPROVED") {
        throw new Error("Expense already approved")
    }

    await prisma.expense.update({
        where: { id },
        data: {
            status: "APPROVED",
            approvedBy: user.id,
            approvedAt: new Date()
        },
    })

    console.log(`[AUDIT] Expense ${id} (${expense.merchant} $${expense.amount / 100}) approved by ${user.email}`)

    revalidatePath("/approvals")
    revalidatePath("/")
}

export async function rejectExpense(id: string) {
    const user = await getUser()
    if (!canApprove(user.role)) {
        throw new Error("Unauthorized: Insufficient permissions to reject expenses")
    }

    // ✅ SECURITY: Verify expense belongs to same organization  
    const expense = await prisma.expense.findUnique({
        where: { id },
        select: { organizationId: true, status: true, merchant: true, amount: true }
    })

    if (!expense) {
        throw new Error("Expense not found")
    }

    if (expense.organizationId !== user.organizationId) {
        throw new Error("Unauthorized: Cross-organization access denied")
    }

    if (expense.status === "REJECTED") {
        throw new Error("Expense already rejected")
    }

    await prisma.expense.update({
        where: { id },
        data: {
            status: "REJECTED",
            rejectedBy: user.id,
            rejectedAt: new Date()
        },
    })

    console.log(`[AUDIT] Expense ${id} (${expense.merchant} $${expense.amount / 100}) rejected by ${user.email}`)

    revalidatePath("/approvals")
    revalidatePath("/")
}

export async function deleteExpense(id: string) {
    const user = await getUser()

    const expense = await prisma.expense.findUnique({
        where: { id },
        select: { status: true, userId: true }
    })

    if (!expense) return

    // RBAC: Delete Check
    const isOwner = expense.userId === user.id
    const isAdmin = canManageSystem(user.role)

    if (!isOwner && !isAdmin) {
        throw new Error("Unauthorized: Cannot delete expenses of other users")
    }

    if (expense.status === "APPROVED") {
        throw new Error("Cannot delete a verified (approved) expense.")
    }

    await prisma.expense.delete({
        where: { id },
    })
    revalidatePath("/expenses")
    revalidatePath("/approvals")
    revalidatePath("/")
}
