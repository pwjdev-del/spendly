"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const updateOrganizationNameSchema = z.object({
    name: z.string().min(1, "Name is required").max(50, "Name is too long"),
})

export async function updateOrganizationName(formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { error: "Unauthorized" }
        }

        const name = formData.get("name")
        const parsed = updateOrganizationNameSchema.safeParse({ name })

        if (!parsed.success) {
            return { error: parsed.error.issues[0].message }
        }

        // Get user's org ID and role
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { organizationId: true, role: true }
        })

        if (!user?.organizationId) {
            return { error: "Organization not found" }
        }

        if (user.role !== "ADMIN") {
            return { error: "Only admins can change the organization name" }
        }

        await prisma.organization.update({
            where: { id: user.organizationId },
            data: { name: parsed.data.name }
        })

        revalidatePath("/")
        return { success: "Organization name updated" }
    } catch (error) {
        console.error("Failed to update organization name:", error)
        return { error: "Failed to update organization name" }
    }
}
