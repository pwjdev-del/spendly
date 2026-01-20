import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ApprovalsList } from "@/components/approvals/ApprovalsList"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

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

    // Fetch metrics
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
        prisma.expense.count({ where: { status: "PENDING" } }),
        prisma.expense.count({ where: { status: "APPROVED" } }),
        prisma.expense.count({ where: { status: "REJECTED" } })
    ])

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Approvals</h1>
                <p className="text-muted-foreground">Review and manage expense requests</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    label="Pending Actions"
                    value={pendingCount.toString()}
                    icon={AlertCircle}
                    color="text-amber-500"
                    bg="bg-amber-500/10"
                />
                <MetricCard
                    label="Approved"
                    value={approvedCount.toString()}
                    icon={CheckCircle2}
                    color="text-emerald-500"
                    bg="bg-emerald-500/10"
                />
                <MetricCard
                    label="Rejected"
                    value={rejectedCount.toString()}
                    icon={XCircle}
                    color="text-red-500"
                    bg="bg-red-500/10"
                />
            </div>

            <ApprovalsList expenses={pendingExpenses} />
        </div>
    )
}

function MetricCard({ label, value, icon: Icon, color, bg }: any) {
    return (
        <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
                    <h3 className={cn("text-3xl font-bold tracking-tight", color)}>{value}</h3>
                </div>
                <div className={cn("p-4 rounded-2xl", bg)}>
                    <Icon className={cn("h-6 w-6", color)} />
                </div>
            </CardContent>
        </Card>
    )
}
