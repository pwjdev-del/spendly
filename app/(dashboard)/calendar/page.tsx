import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { CalendarClient } from "./client"
import { redirect } from "next/navigation"

export default async function CalendarPage(props: { searchParams: Promise<{ month?: string; year?: string }> }) {
    const session = await auth()
    if (!session?.user?.email) redirect("/login")

    // Reverted workaround: Standard Prisma query matches auth.ts behavior
    const user = await prisma.user.findFirst({ where: { email: session.user.email } });
    if (!user) redirect("/login")

    // Allow personal items OR organization items
    const whereClause: any = {
        OR: [
            { userId: user.id },
            ...(user.organizationId ? [{ organizationId: user.organizationId }] : [])
        ]
    }

    // URL Params for Month Navigation
    // @ts-ignore
    const { month, year } = props.searchParams || {};
    const date = new Date();
    const currentMonth = month ? parseInt(month as string) : date.getMonth();
    const currentYear = year ? parseInt(year as string) : date.getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    // Fetch surrounding months for smoother transitions (optional, keeping strict for perf)
    const queryStart = new Date(currentYear, currentMonth - 1, 1);
    const queryEnd = new Date(currentYear, currentMonth + 2, 0);

    const expenses = await prisma.expense.findMany({
        where: {
            ...whereClause,
            date: {
                gte: queryStart,
                lte: queryEnd
            }
        },
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

    // --- BALANCE CALCULATION FOR TIME TRAVEL ---
    // We need "True Liquidity" (All Time Income - All Time Spend) to forecast future solvency.

    // 1. Get All-Time Income
    let totalIncome = 0;
    // @ts-ignore
    if (prisma.income) {
        let incomeWhereClause;
        if (user.role === 'ADMIN' && user.organizationId) {
            const orgUsers = await prisma.user.findMany({
                where: { organizationId: user.organizationId },
                select: { id: true }
            });
            const userIds = orgUsers.map(u => u.id);
            incomeWhereClause = { userId: { in: userIds } };
        } else {
            incomeWhereClause = { userId: user.id };
        }

        const incomeSum = await prisma.income.aggregate({
            where: incomeWhereClause,
            _sum: { amount: true },
        });
        totalIncome = incomeSum._sum.amount || 0;
    }

    // 2. Get All-Time Spend
    const allTimeExpenseSum = await prisma.expense.aggregate({
        where: whereClause, // Reuse existing whereClause which is correct for User/Org
        _sum: { amount: true },
    });
    const totalSpend = allTimeExpenseSum._sum.amount || 0;

    const balance = totalIncome - totalSpend;

    // 3. Get User Preferences for Time Travel
    let enableTimeTravel = false;
    try {
        if (user.preferences) {
            const prefs = JSON.parse(user.preferences);
            enableTimeTravel = !!prefs.enableTimeTravel;
        }
    } catch (e) {
        // Fallback to false
    }

    return (
        <div className="flex flex-col gap-6 h-full">
            <h1 className="text-2xl font-bold tracking-tight">Expense Calendar</h1>
            <CalendarClient
                expenses={expenses}
                recurringExpenses={recurringExpenses}
                balance={balance}
                enableTimeTravel={enableTimeTravel}
            />
        </div>
    )
}
