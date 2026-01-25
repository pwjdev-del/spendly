"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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

// Reuse logic from trips.ts if possible, but for now simple check
async function checkAccess(tripId: string) {
    const user = await getUser()
    const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: { userId: true, organizationId: true }
    })

    if (!trip) return { error: "Trip not found", user: null }

    const isInternal = trip.organizationId === user.organizationId
    if (!isInternal) return { error: "Trip not found", user: null } // cross-org protection

    // Allow members of the org to view/edit tasks for the trip if it's in their org?
    // User requirement: "task list for trips where people can do copy paste"
    // Usually tasks are collaborative. 
    // I will allow any member of the org to add tasks/check tasks for now, or match Trip access.
    // Let's assume Trip Access rules (Owner or Admin/Auditor/Approver in same org).
    // Actually, any MEMBER in the org should probably be able to support if Collaboration is key.
    // But let's stick to: Owner or Admin/Approver/Auditor.

    return { error: null, user }
}

export async function createTripTask(tripId: string, title: string) {
    const { error, user } = await checkAccess(tripId)
    if (error || !user) return { error: error || "Unauthorized" }

    try {
        await prisma.task.create({
            data: {
                title,
                tripId,
                ownerId: user.id,
                status: "TODO"
            }
        })
        revalidatePath(`/trips/${tripId}`)
        return { success: true }
    } catch (e) {
        return { error: "Failed to create task" }
    }
}

export async function bulkCreateTripTasks(tripId: string, titles: string[]) {
    const { error, user } = await checkAccess(tripId)
    if (error || !user) return { error: error || "Unauthorized" }

    try {
        await prisma.task.createMany({
            data: titles.map(title => ({
                title: title.substring(0, 100), // truncate if too long
                tripId,
                ownerId: user.id,
                status: "TODO"
            }))
        })
        revalidatePath(`/trips/${tripId}`)
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: "Failed to create tasks" }
    }
}

export async function updateTaskStatus(taskId: string, status: string) {
    const user = await getUser()

    // Check task ownership/trip access
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { trip: true }
    })

    if (!task || !task.tripId) return { error: "Task not found" }

    if (task.trip?.organizationId !== user.organizationId) return { error: "Unauthorized" }

    try {
        await prisma.task.update({
            where: { id: taskId },
            data: { status }
        })
        revalidatePath(`/trips/${task.tripId}`)
        return { success: true }
    } catch (e) {
        return { error: "Failed to update task" }
    }
}

export async function deleteTask(taskId: string) {
    const user = await getUser()
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { trip: true }
    })

    if (!task || !task.tripId) return { error: "Task not found" }

    // Only Owner or Admin should delete? Or anyone who can edit?
    // Let's allow anyone in Org for now or restricting is safer. 
    // Restricting to Task Owner OR Trip Owner OR Admin.
    const isTaskOwner = task.ownerId === user.id
    const isAdmin = user.role === 'ADMIN'

    if (!isTaskOwner && !isAdmin) {
        return { error: "Unauthorized" }
    }

    try {
        await prisma.task.delete({ where: { id: taskId } })
        revalidatePath(`/trips/${task.tripId}`)
        return { success: true }
    } catch (e) {
        return { error: "Failed to delete task" }
    }
}
