"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

// Helper to get current user
async function getUser() {
    const session = await auth()
    if (!session?.user?.email) redirect("/login")

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, organizationId: true }
    })

    if (!user) redirect("/login")
    return user
}

// Auto-generate trip number for organization
async function generateTripNumber(organizationId: string | null): Promise<string> {
    const count = await prisma.trip.count({
        where: organizationId ? { organizationId } : {}
    })
    return `TRIP-${String(count + 1).padStart(3, '0')}`
}

export async function createTrip(prevState: string | undefined, formData: FormData) {
    try {
        const user = await getUser()

        const name = (formData.get("name") as string)?.trim()
        const description = (formData.get("description") as string)?.trim() || null
        const startDate = formData.get("startDate") as string
        const endDate = (formData.get("endDate") as string) || null
        const budget = formData.get("budget") as string
        const status = (formData.get("status") as string) || "PLANNING"

        if (!name || !startDate) {
            return "Name and start date are required"
        }

        const tripNumber = await generateTripNumber(user.organizationId)

        await prisma.trip.create({
            data: {
                tripNumber,
                name,
                description,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                budget: budget ? parseFloat(budget) : null,
                status,
                userId: user.id,
                organizationId: user.organizationId
            }
        })

        revalidatePath("/trips")
        return "success"
    } catch (error) {
        console.error("Failed to create trip:", error)
        return "Failed to create trip"
    }
}

export async function updateTrip(id: string, prevState: string | undefined, formData: FormData) {
    try {
        const user = await getUser()

        // Check if user owns this trip or is admin
        const trip = await prisma.trip.findUnique({
            where: { id },
            select: { userId: true, organizationId: true }
        })

        if (!trip) return "Trip not found"

        const normalizedRole = user.role === 'MEMBER' ? 'SUBMITTER' : user.role
        const canEdit = trip.userId === user.id ||
            (['ADMIN', 'APPROVER', 'AUDITOR'].includes(normalizedRole) && trip.organizationId === user.organizationId)

        if (!canEdit) return "Not authorized"

        const name = (formData.get("name") as string)?.trim()
        const description = (formData.get("description") as string)?.trim() || null
        const startDate = formData.get("startDate") as string
        const endDate = (formData.get("endDate") as string) || null
        const budget = formData.get("budget") as string
        const status = (formData.get("status") as string) || "PLANNING"

        if (!name || !startDate) {
            return "Name and start date are required"
        }

        await prisma.trip.update({
            where: { id },
            data: {
                name,
                description,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                budget: budget ? parseFloat(budget) : null,
                status
            }
        })

        revalidatePath("/trips")
        revalidatePath(`/trips/${id}`)
        return "success"
    } catch (error) {
        console.error("Failed to update trip:", error)
        return "Failed to update trip"
    }
}

export async function deleteTrip(id: string) {
    try {
        const user = await getUser()

        // Check ownership or admin
        const trip = await prisma.trip.findUnique({
            where: { id },
            select: { userId: true, organizationId: true, status: true }
        })

        if (!trip) return { error: "Trip not found" }

        const canDelete = trip.userId === user.id ||
            (user.role === 'ADMIN' && trip.organizationId === user.organizationId)

        if (!canDelete) return { error: "Not authorized" }

        // Prevent deletion of trips that are in payment or closed stages (unless ADMIN)
        const lockedStatuses = ['APPROVED_FOR_PAYMENT', 'PAYMENT_SENT', 'PAYMENT_RECEIVED', 'CLOSED']
        if (lockedStatuses.includes(trip.status) && user.role !== 'ADMIN') {
            return { error: "Cannot delete trip after payment processing has started." }
        }

        // Unlink expenses before deleting
        await prisma.expense.updateMany({
            where: { tripId: id },
            data: { tripId: null }
        })

        await prisma.trip.delete({ where: { id } })

        revalidatePath("/trips")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete trip:", error)
        return { error: "Failed to delete trip" }
    }
}

// Get trips based on user role
// MEMBER: only their own trips
// ADMIN: all trips in organization
export async function getTrips() {
    const user = await prisma.user.findUnique({
        where: { email: (await auth())?.user?.email! },
        select: { id: true, role: true, organizationId: true }
    })

    if (!user) return []

    const normalizedRole = user.role === 'MEMBER' ? 'SUBMITTER' : user.role // Handle legacy

    let whereClause: any = {}

    if (normalizedRole === 'ADMIN') {
        // ADMIN: all trips in organization
        whereClause = { organizationId: user.organizationId }
    } else if (['APPROVER', 'AUDITOR'].includes(normalizedRole)) {
        // APPROVER/AUDITOR: all trips in organization EXCEPT those created by ADMINs
        whereClause = {
            organizationId: user.organizationId,
            user: {
                role: { not: 'ADMIN' }
            }
        }
    } else {
        // MEMBER/SUBMITTER/DELEGATE: only their own trips
        whereClause = { userId: user.id }
    }

    return await prisma.trip.findMany({
        where: whereClause,
        include: {
            user: { select: { name: true, email: true } },
            expenses: { select: { id: true, amount: true } }
        },
        orderBy: { createdAt: 'desc' }
    })
}

export async function getTripById(id: string) {
    const user = await getUser()

    const trip = await prisma.trip.findUnique({
        where: { id },
        include: {
            user: { select: { name: true, email: true } },
            approver: { select: { name: true, email: true } },
            auditor: { select: { name: true, email: true } },
            expenses: {
                include: {
                    user: { select: { name: true } }
                },
                orderBy: { date: 'desc' }
            },
            documents: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!trip) return null

    // Check access
    const normalizedRole = user.role === 'MEMBER' ? 'SUBMITTER' : user.role

    let hasAccess = false

    if (normalizedRole === 'ADMIN') {
        hasAccess = trip.organizationId === user.organizationId
    } else if (['APPROVER', 'AUDITOR'].includes(normalizedRole)) {
        // Access Check: Same Org + (Own Trip OR (Not Admin Trip))
        if (trip.organizationId === user.organizationId) {
            if (trip.userId === user.id) {
                hasAccess = true
            } else {
                const owner = await prisma.user.findUnique({
                    where: { id: trip.userId },
                    select: { role: true }
                })
                if (owner && owner.role !== 'ADMIN') {
                    hasAccess = true
                }
            }
        }
    } else {
        // Submitter/Delegate/Member
        hasAccess = trip.userId === user.id
    }

    if (!hasAccess) return null

    return trip
}

import { getAvailableStatuses } from "@/lib/trip-workflow"

export async function updateTripStatus(id: string, status: string) {
    try {
        const user = await getUser()

        // Check if trip exists and belongs to organization
        const trip = await prisma.trip.findUnique({
            where: { id },
            select: { userId: true, organizationId: true, status: true }
        })

        if (!trip) return { error: "Trip not found" }

        // Basic Org Check
        if (trip.organizationId !== user.organizationId) {
            return { error: "Not authorized" }
        }

        const normalizedRole = user.role === 'MEMBER' ? 'SUBMITTER' : user.role // Handle legacy
        const availableStatuses = getAvailableStatuses(normalizedRole)
        const isStatusAllowed = availableStatuses.some(s => s.value === status)

        if (!isStatusAllowed) {
            return { error: `Role '${user.role}' cannot set status to '${status}'` }
        }

        let canEdit = false
        if (normalizedRole === 'ADMIN') {
            canEdit = true
        } else if (['APPROVER', 'AUDITOR'].includes(normalizedRole)) {
            const owner = await prisma.user.findUnique({ where: { id: trip.userId }, select: { role: true } })
            if (owner && owner.role !== 'ADMIN') {
                canEdit = true
            }
        } else {
            canEdit = trip.userId === user.id
        }

        if (!canEdit) return { error: "Not authorized to edit this trip" }

        // Track Approver/Auditor based on status transition
        const updateData: any = { status }

        if (status === 'APPROVED') {
            updateData.approverId = user.id
        } else if (['APPROVED_FOR_PAYMENT', 'PAYMENT_SENT', 'CLOSED'].includes(status)) {
            // Usually Auditor finalizes these
            // Only update if role is AUDITOR or ADMIN acting as auditor?
            // Actually, if they are setting this status, they are the one auditing.
            if (normalizedRole === 'AUDITOR' || normalizedRole === 'ADMIN') {
                updateData.auditorId = user.id
            }
        }

        await prisma.trip.update({
            where: { id },
            data: updateData
        })

        revalidatePath(`/trips/${id}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to update trip status:", error)
        return { error: "Failed to update status" }
    }
}

export async function uploadTripDocument(id: string, formData: FormData) {
    try {
        const user = await getUser()

        // Ownership check
        const trip = await prisma.trip.findUnique({
            where: { id },
            select: { userId: true, organizationId: true }
        })

        if (!trip) return { error: "Trip not found" }
        const canEdit = trip.userId === user.id ||
            (user.role === 'ADMIN' && trip.organizationId === user.organizationId)

        if (!canEdit) return { error: "Not authorized" }

        const file = formData.get("file") as File
        const customName = formData.get("name") as string

        if (!file) return { error: "No file provided" }

        // Use Storage Service
        const { storage } = await import("@/lib/storage");
        const url = await storage.upload(file, "documents");

        // Save to DB
        await prisma.tripDocument.create({
            data: {
                name: customName || file.name,
                url: url,
                type: file.type,
                size: file.size,
                tripId: id,
                uploadedBy: user.id
            }
        })

        revalidatePath(`/trips/${id}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to upload document:", error)
        return { error: "Failed to upload document" }
    }
}
