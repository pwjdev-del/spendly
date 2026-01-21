import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import ReconciliationPageClient from "./client"

export default async function ReconciliationPage() {
    const session = await auth()
    if (!session?.user?.email) redirect("/login")

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })

    // RBAC Check
    const { canManageSystem } = await import("@/lib/permissions")
    // Approver and Auditor roles are explicitly allowed for reconciliation
    const allowedRoles = ["ADMIN", "APPROVER", "AUDITOR"]
    const hasRoleAccess = user && allowedRoles.includes(user.role)
    const hasDirectAccess = user?.canReconcile

    if (!user || (!hasRoleAccess && !hasDirectAccess)) redirect("/")

    // Feature Flags from Preferences
    let enableSubscriptionManager = false
    try {
        const prefs = JSON.parse(user.preferences || "{}")
        enableSubscriptionManager = prefs.enableSubscriptionManager || false
    } catch (e) { }

    return <ReconciliationPageClient initialSubscriptionEnabled={enableSubscriptionManager} />
}
