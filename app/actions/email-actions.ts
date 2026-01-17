"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { sendReceiptRequestEmail, sendTripReportEmail } from "@/lib/mail"

export async function sendReceiptRequest(expenseIds: string[]) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        const expenses = await prisma.expense.findMany({
            where: {
                id: { in: expenseIds },
                // Ensure we only touch expenses in user's org (or own if personal)
                // For now, simple check:
                userId: session.user.id
            },
            select: {
                id: true,
                date: true,
                merchant: true,
                amount: true,
                user: { select: { email: true } }
            }
        })

        if (expenses.length === 0) return { error: "No expenses found" }

        // Group by user email (though likely all same user if selected by user, but Admin might select multiple users)
        // For this iteration, assuming single user action or self-action. 
        // If Admin sends to others, we need 'user.email'.

        // We will send one email per user found in the selection.
        const inputsByUser = new Map<string, typeof expenses>()

        for (const exp of expenses) {
            const email = exp.user.email
            if (email) {
                const list = inputsByUser.get(email) || []
                list.push(exp)
                inputsByUser.set(email, list)
            }
        }

        for (const [email, userExpenses] of inputsByUser.entries()) {
            await sendReceiptRequestEmail(email, userExpenses)
        }

        return { success: true, count: expenses.length }
    } catch (error) {
        console.error("Failed to send receipt request:", error)
        return { error: "Failed to send emails" }
    }
}

export async function sendTripReportRequest(expenseIds: string[]) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        const expenses = await prisma.expense.findMany({
            where: {
                id: { in: expenseIds },
                userId: session.user.id
            },
            include: {
                trip: true,
                user: { select: { email: true } }
            }
        })

        if (expenses.length === 0) return { error: "No expenses found" }

        // Group by User AND Trip
        // Key: "email|tripId"
        const inputsByTrip = new Map<string, typeof expenses>()

        for (const exp of expenses) {
            if (!exp.tripId || !exp.user.email) continue

            const key = `${exp.user.email}|${exp.tripId}`
            const list = inputsByTrip.get(key) || []
            list.push(exp)
            inputsByTrip.set(key, list)
        }

        for (const [key, userExpenses] of inputsByTrip.entries()) {
            const [email, tripId] = key.split('|')
            const trip = userExpenses[0].trip // specific trip details

            if (!trip) continue

            const isRev2 = trip.status === 'COMPLETED' || trip.status === 'APPROVED' // Closed trip logic

            await sendTripReportEmail(email, userExpenses, trip.name, isRev2)
        }

        return { success: true, count: expenses.length }

    } catch (error) {
        console.error("Failed to send trip report request:", error)
        return { error: "Failed to send emails" }
    }
}
