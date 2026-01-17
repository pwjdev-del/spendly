import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { CalendarClient } from "./client"
import { redirect } from "next/navigation"

export default async function CalendarPage() {
    const session = await auth()
    if (!session?.user?.email) redirect("/login")

    // WORKAROUND: Raw SQL to bypass "invalid characters" error on User table
    const users: any[] = await prisma.$queryRaw`SELECT * FROM User WHERE email = ${session.user.email} LIMIT 1`;
    const user = users[0];
    if (!user) redirect("/login")

    // Allow personal items OR organization items
    const whereClause: any = {
        OR: [
            { userId: user.id },
            ...(user.organizationId ? [{ organizationId: user.organizationId }] : [])
        ]
    }

    const expenses = await prisma.expense.findMany({
        where: whereClause,
        orderBy: { date: 'asc' },
        select: {
            id: true,
            merchant: true,
            amount: true,
            category: true,
            date: true,
            currency: true,
            status: true
        }
    })

    const recurringExpenses = await prisma.recurringExpense.findMany({
        where: {
            AND: [
                whereClause,
                { status: 'ACTIVE' }
            ]
        },
        orderBy: { nextDueDate: 'asc' },
        select: {
            id: true,
            merchant: true,
            amount: true,
            category: true,
            nextDueDate: true,
            currency: true,
            frequency: true
        }
    })

    return (
        <div className="flex flex-col gap-6 h-full">
            <h1 className="text-2xl font-bold tracking-tight">Expense Calendar</h1>
            <CalendarClient expenses={expenses} />
        </div>
    )
}
