import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import BudgetsPageClient from "./client"
import { redirect } from "next/navigation"

export default async function BudgetsPage() {
    const session = await auth()
    if (!session?.user?.email) redirect("/login")

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) redirect("/login")

    // Calculate spent this month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

    const expenseSum = await prisma.expense.aggregate({
        where: {
            userId: user.id,
            status: "APPROVED",
            createdAt: {
                gte: firstDay
            }
        },
        _sum: { amount: true }
    })

    const spent = expenseSum._sum.amount || 0
    // Use default limit if null (though schema has default)
    const limit = user.monthlyLimit || 5000.0

    return <BudgetsPageClient spent={spent} limit={limit} />
}
