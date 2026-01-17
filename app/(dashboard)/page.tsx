import prisma from "@/lib/prisma"
import { SpendingChart } from "@/components/dashboard/SpendingChart"
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart"
import { auth } from "@/auth"
import { AddFundsDialog } from "@/components/dashboard/AddFundsDialog"
import { resetBalance } from "@/app/actions/income"
import { redirect } from "next/navigation"
import { DashboardGrid } from "@/components/dashboard/DashboardGrid"
import { DEFAULT_LAYOUT, WidgetId } from "@/components/dashboard/WidgetRegistry"

async function getGraphData(userId: string) {
  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  })

  // Group by Date for Bar Chart
  const dailyMap = new Map<string, number>()
  expenses.forEach((e) => {
    const date = e.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    dailyMap.set(date, (dailyMap.get(date) || 0) + e.amount)
  })

  // Convert to array
  const graphData = Array.from(dailyMap).map(([name, total]) => ({ name, total }))

  return graphData
}

async function getCategoryData(userId: string) {
  const expenses = await prisma.expense.groupBy({
    by: ['category'],
    where: { userId },
    _sum: {
      amount: true,
    },
  })

  return expenses.map((e: { category: string; _sum: { amount: number | null; }; }) => ({
    name: e.category,
    value: e._sum.amount || 0
  }))
}

function getNextPayoutDate(day: number) {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  let payoutDate = new Date(currentYear, currentMonth, day)

  // If payout day for this month has passed, go to next month
  if (today > payoutDate) {
    payoutDate = new Date(currentYear, currentMonth + 1, day)
  }

  return payoutDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")



  // WORKAROUND: Raw SQL to bypass "invalid characters" error on User table
  const users: any[] = await prisma.$queryRaw`SELECT * FROM User WHERE email = ${session.user.email} LIMIT 1`;
  const user = users[0];

  if (!user) redirect("/login")

  // Calculate start of current month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Determine scope based on Role
  const whereClause = user.role === 'ADMIN' && user.organizationId
    ? { organizationId: user.organizationId } // Admin sees all in org
    : { userId: user.id } // Member sees only their own

  // Re-fetch data with correct scope
  const expenseSum = await prisma.expense.aggregate({
    where: {
      ...whereClause,
      createdAt: { gte: startOfMonth }
    },
    _sum: { amount: true },
  })

  const pendingCount = await prisma.expense.count({
    where: {
      status: "PENDING",
      ...whereClause
    },
  })

  // getGraphData equivalent
  const expenses = await prisma.expense.findMany({
    where: whereClause,
    orderBy: { createdAt: 'asc' }
  })

  // Group by Date for Bar Chart
  const dailyMap = new Map<string, number>()
  expenses.forEach((e) => {
    if (e.latitude || e.longitude) {
      console.log(`[Dashboard] Found expense with location: ${e.merchant} (${e.latitude}, ${e.longitude})`)
    }
    const date = `${e.createdAt.getMonth() + 1}/${e.createdAt.getDate()}`
    dailyMap.set(date, (dailyMap.get(date) || 0) + e.amount)
  })
  const graphData = Array.from(dailyMap).map(([name, total]) => ({ name, total }))

  // getCategoryData equivalent
  const categoryExpenses = await prisma.expense.groupBy({
    by: ['category'],
    where: whereClause,
    _sum: { amount: true },
  })
  const categoryData = categoryExpenses.map((e) => ({
    name: e.category,
    value: e._sum.amount || 0
  }))

  let totalIncome = 0
  let totalSpend = expenseSum._sum.amount || 0
  let balance = 0

  // Safety check for stale server (Prisma client not reloading)
  // @ts-ignore
  if (prisma.income) {
    // Income is personal (tied to userId), not organizational
    // For ADMIN: aggregate income across all family members
    // For MEMBER: only their own income
    let incomeWhereClause;
    if (user.role === 'ADMIN' && user.organizationId) {
      // Get all user IDs in the organization
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
    })
    totalIncome = incomeSum._sum.amount || 0
    balance = totalIncome - totalSpend
  } else {
    console.error("Prisma Income model not found. Restart server.")
  }

  const nextPayout = getNextPayoutDate(user.payoutDay || 15)

  // Fetch Active Trips (limited to 5)
  // @ts-ignore
  const activeTrips = prisma.trip ? await prisma.trip.findMany({
    where: {
      ...whereClause,
      status: { not: "COMPLETED" } // Show PLANNING and ACTIVE
    },
    orderBy: { startDate: 'asc' },
    take: 5
  }) : [];

  /* Dashboard Data Construction for Widget Grid */
  const dashboardData = {
    balance: balance,
    totalIncome: totalIncome,
    totalSpend: totalSpend,
    pendingCount: pendingCount,
    nextPayout: nextPayout,
    graphData: graphData,
    categoryData: categoryData,
    recentExpenses: expenses,
    trips: activeTrips,
    role: user.role as "ADMIN" | "MEMBER"
  }

  // Parse layout from user preferences or use default
  let initialLayout: { id: string; type: WidgetId }[] = DEFAULT_LAYOUT as { id: string; type: WidgetId }[];
  if (user.dashboardLayout) {
    try {
      const savedLayout = JSON.parse(user.dashboardLayout) as { id: string; type: WidgetId }[]
      // Check if the saved layout has the new Quick Actions widget
      // If not (legacy layout), fallback to the new DEFAULT_LAYOUT to showcase the redesign
      const hasQuickActions = savedLayout.some(item => item.type === 'quick-actions');

      if (hasQuickActions) {
        initialLayout = savedLayout;
      }
    } catch (e) {
      console.error("Failed to parse user dashboard layout", e)
    }
  }

  return (
    <main className="flex flex-col gap-4" suppressHydrationWarning>
      {/* Header with Fluid Typography */}
      <div className="w-full h-auto py-2">
        <h1 className="text-fluid-heading font-bold text-safe text-foreground">
          Dashboard
        </h1>
      </div>

      {/* @ts-ignore */}
      {!prisma.income && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md border border-destructive/50 font-bold">
          ⚠️ Database Schema Updated. Please RESTART your terminal (npm run dev) to see the Income features.
        </div>
      )}

      <DashboardGrid initialLayout={initialLayout} data={dashboardData} />
    </main>
  )
}
