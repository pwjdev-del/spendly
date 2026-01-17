import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import prisma from "@/lib/prisma"
import { ApprovalButtons } from "@/components/dashboard/ApprovalButtons"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ApprovalsList } from "@/components/approvals/ApprovalsList"

export default async function ApprovalsPage() {
    const session = await auth()
    if (!session?.user?.email) redirect("/login")

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    })

    if (!user) redirect("/login")

    // RBAC Check
    const { canApprove } = await import("@/lib/permissions")
    if (!canApprove(user.role)) {
        redirect("/")
    }

    // Only fetch approvals for the organization
    if (!user.organizationId) {
        return (
            <div className="p-8 text-center">
                <p>You need to join an organization to approve expenses.</p>
            </div>
        )
    }

    const pendingExpenses = await prisma.expense.findMany({
        where: { status: "PENDING" },
        include: { user: true },
        orderBy: { createdAt: "desc" },
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
            </div>

            <ApprovalsList expenses={pendingExpenses} />
        </div>
    )
}
