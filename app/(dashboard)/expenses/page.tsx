import Link from "next/link"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { ExportPdfButton } from "@/components/dashboard/ExportPdfButton"
import { ExportCsvButton } from "@/components/dashboard/ExportCsvButton"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ExpensesWithSearch } from "@/components/expenses/ExpensesWithSearch"
import { getTrips } from "@/app/actions/trips"
import { FastExpenseWrapper } from "@/components/expenses/FastExpenseWrapper"

export default async function ExpensesPage() {
    const session = await auth()
    if (!session?.user?.email) redirect("/login")

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) redirect("/login")

    // Fetch Trips for Fast Scan
    const trips = await getTrips()
    const activeTrips = trips.filter(t => t.status !== 'COMPLETED')

    // Determine scope based on role
    const normalizedRole = user.role === 'MEMBER' ? 'SUBMITTER' : user.role // Handle legacy

    let roleCondition = {}
    if (normalizedRole === 'ADMIN') {
        // Admin sees EVERYTHING in the organization
        roleCondition = { organizationId: user.organizationId }
    } else if (['APPROVER', 'AUDITOR'].includes(normalizedRole)) {
        // Approver/Auditor sees organization expenses EXCEPT those created by ADMINs
        roleCondition = {
            organizationId: user.organizationId,
            user: {
                role: { not: 'ADMIN' }
            }
        }
    } else {
        // Submitters/Delegates see only their own expenses
        // (Delegates might need to see ones they created for others, but `userId: user.id` usually covers ownership)
        roleCondition = { userId: user.id }
    }

    const whereClause = {
        AND: [
            roleCondition,
            {
                OR: [
                    { tripId: null },
                    { trip: { status: { not: "COMPLETED" } } }
                ]
            }
        ]
    }

    const expenses = await prisma.expense.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            },
            trip: {
                select: {
                    name: true
                }
            }
        }
    })

    const isAdmin = user.role === 'ADMIN'

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Expense Transactions</h1>
                <div className="flex gap-2 self-start md:self-auto overflow-x-auto w-full md:w-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 scrollbar-hide no-scrollbar">
                    <FastExpenseWrapper trips={activeTrips} />
                    <ExportCsvButton expenses={expenses.map(e => ({ ...e, date: e.date, amount: e.amount }))} />
                    <ExportPdfButton expenses={expenses.map(e => ({ ...e, date: e.date, amount: e.amount }))} />
                </div>
            </div>

            <ExpensesWithSearch initialExpenses={expenses} userRole={user.role} />
        </div>
    )
}

