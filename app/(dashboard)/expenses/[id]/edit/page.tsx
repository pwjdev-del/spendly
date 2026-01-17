import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { ExpenseForm } from "@/components/expenses/ExpenseForm"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user?.email) redirect("/login")

    const resolvedParams = await params
    const expenseId = resolvedParams.id

    const expense = await prisma.expense.findUnique({
        where: { id: expenseId },
        include: {
            trip: {
                select: { id: true, name: true, description: true }
            }
        }
    })

    if (!expense) notFound()

    // ENFORCE RESTRICTION: Redirect if already verified
    if (expense.status === "APPROVED") {
        redirect("/expenses?error=Cannot edit a verified expense")
    }

    const trips = await prisma.trip.findMany({
        where: {
            organizationId: expense.organizationId,
            status: { not: "COMPLETED" }
        },
        select: {
            id: true,
            tripNumber: true,
            name: true,
            status: true
        },
        orderBy: { createdAt: "desc" }
    })

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between space-y-2">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/expenses">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h2 className="text-3xl font-bold tracking-tight">Edit Expense</h2>
                </div>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-1 md:col-span-4 lg:col-span-5">
                    <ExpenseForm
                        trips={trips}
                        selectedTrip={expense.trip}
                        initialData={{
                            id: expense.id,
                            merchant: expense.merchant,
                            amount: expense.amount,
                            date: expense.date.toISOString().slice(0, 16),
                            currency: expense.currency,
                            category: expense.category,
                            tripId: expense.tripId
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
