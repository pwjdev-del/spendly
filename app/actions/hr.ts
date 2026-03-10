"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getEmployeeProfile() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    return await prisma.employeeProfile.findUnique({
        where: { userId: session.user.id }
    })
}

export async function createOrUpdateProfile(data: { jobTitle?: string, department?: string, emergencyContact?: string }) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const profile = await prisma.employeeProfile.upsert({
        where: { userId: session.user.id },
        update: data,
        create: {
            userId: session.user.id,
            ...data
        }
    })

    revalidatePath("/hr/profile")
    return profile
}

export async function getLeaveRecords() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    return await prisma.leaveRecord.findMany({
        where: { userId: session.user.id },
        orderBy: { startDate: "desc" }
    })
}

export async function requestLeave(data: { type: string, startDate: Date, endDate: Date, reason?: string }) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const leave = await prisma.leaveRecord.create({
        data: {
            userId: session.user.id,
            type: data.type,
            startDate: data.startDate,
            endDate: data.endDate,
            reason: data.reason
        }
    })

    revalidatePath("/hr/leaves")
    return leave
}

export async function getPayslips() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    return await prisma.payslip.findMany({
        where: { userId: session.user.id, isPublished: true },
        orderBy: [{ year: "desc" }, { month: "desc" }]
    })
}
