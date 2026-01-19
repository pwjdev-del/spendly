"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SpendingChart } from "@/components/dashboard/SpendingChart"
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart"
import { AddFundsDialog } from "@/components/dashboard/AddFundsDialog"
import Link from "next/link"
import { AskDataWidget } from "@/components/dashboard/AskDataWidget"
import { ArrowRight, Wallet, Receipt, CreditCard, Calendar, BarChart3, Settings, Plus, CheckSquare, MapPin, TrendingUp, TrendingDown, History, Utensils, Car, ShoppingBag, Camera } from "lucide-react"
import { SpendingMapWidget } from "@/components/dashboard/SpendingMapWidget"
import { FastExpenseWrapper } from "@/components/expenses/FastExpenseWrapper"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export type WidgetId =
    | "balance"
    | "spend"
    | "payout"
    | "spending-chart"
    | "category-chart"
    | "recent-expenses"
    | "approvals"
    | "cards"
    | "trips"
    | "ask-kharcho"
    | "quick-actions"
    | "spending-map";

export interface DashboardData {
    balance: number
    totalIncome: number
    totalSpend: number
    pendingCount: number
    nextPayout: string
    graphData: any[]
    categoryData: any[]
    recentExpenses: any[]
    trips: any[]
    role: "ADMIN" | "MEMBER"
}

// 1. Metrics Widget (Balance, Income, Spend)
// 1a. Balance Widget
export function BalanceWidget({ data }: { data: DashboardData }) {
    return (
        <Card className="h-full border-border shadow-sm hover:shadow-md transition-all duration-200 bg-card">
            <CardContent className="p-6 flex flex-col justify-between h-full">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-muted rounded-lg">
                            <Wallet className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Balance</h3>
                    </div>
                    <div className={`mt-2 font-bold ${data.balance >= 0 ? "text-foreground" : "text-destructive"} truncate text-3xl tabular-nums`}>
                        ${(data.balance / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-4 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full w-fit">
                    <TrendingUp className="w-3 h-3" />
                    <span>Income: ${(data.totalIncome / 100).toLocaleString()}</span>
                </div>
            </CardContent>
        </Card>
    )
}

// 1b. Total Spend Widget
export function TotalSpendWidget({ data }: { data: DashboardData }) {
    const budget = 3000; // Mock budget for UI matching
    const totalSpendDollars = data.totalSpend / 100;
    const remaining = Math.max(0, budget - totalSpendDollars);
    const percentage = Math.min((totalSpendDollars / budget) * 100, 100);

    return (
        <Card className="h-full border-none shadow-xl bg-gradient-to-br from-[#0F1D2E] via-[#1A2942] to-[#0D9488]/30 text-white overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">Total Spent</h3>
                        <div className="text-4xl font-bold tracking-tight text-white mb-1">
                            ${totalSpendDollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                </div>

                <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-xs font-medium text-white/80">
                        <span>Remaining Budget</span>
                        <span>${remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="h-3 w-full bg-[#0A1628]/50 rounded-full overflow-hidden backdrop-blur-md p-0.5">
                        <div
                            className="h-full bg-gradient-to-r from-[#2DD4BF] to-[#0D9488] rounded-full shadow-sm shadow-[#2DD4BF]/30"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
            </CardContent>
            {/* Decorative glow */}
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#2DD4BF]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#0D9488]/10 rounded-full blur-2xl pointer-events-none" />
        </Card>
    )
}

// 1d. Payout Widget (Admin Only) - HIDDEN
export function PayoutWidget({ data }: { data: DashboardData }) {
    return null;
}

// 2. Spending Chart Widget
export function SpendingChartWidget({ data }: { data: DashboardData }) {
    return <SpendingChart data={data.graphData} />
}

// 3. Category Pie Chart Widget
export function CategoryChartWidget({ data }: { data: DashboardData }) {
    return <CategoryPieChart data={data.categoryData} />
}

// 4. Recent Expenses Widget
export function RecentExpensesWidget({ data }: { data: DashboardData }) {
    const router = useRouter()

    return (
        <Card
            className="h-full cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all duration-200 group border-border shadow-sm bg-card"
            onClick={() => router.push('/expenses')}
        >
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Recent Activity
                </CardTitle>
                <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                    <div className="scale-90 origin-right">
                        <FastExpenseWrapper trips={data.trips} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-1">
                    {data.recentExpenses.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No expenses yet</p>
                        </div>
                    ) : (
                        data.recentExpenses.slice(0, 5).map((expense) => (
                            <div key={expense.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group/item">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform">
                                        {expense.category === 'Food' ? <Utensils className="h-4 w-4" /> :
                                            expense.category === 'Transport' ? <Car className="h-4 w-4" /> :
                                                expense.category === 'Shopping' ? <ShoppingBag className="h-4 w-4" /> :
                                                    <Receipt className="h-4 w-4" />}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-semibold text-sm text-foreground group-hover/item:text-primary transition-colors">{expense.merchant}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(expense.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                                <span className="font-bold text-sm tracking-tight text-foreground">
                                    ${(expense.amount / 100).toFixed(2)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                    <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20" size="sm">
                        <Link href="/expenses/new">
                            <Plus className="w-4 h-4 mr-2" /> Add Expense
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}


// Helper for placeholders
function PlaceholderWidget({ title, icon: Icon }: { title: string, icon: any }) {
    return (
        <Card className="h-full flex flex-col items-center justify-center p-6 text-muted-foreground border-dashed border-border bg-card">
            <Icon className="h-8 w-8 mb-2 opacity-50" />
            <h3 className="font-medium">{title}</h3>
            <p className="text-xs">Widget coming soon</p>
        </Card>
    )
}

// 5. Approvals Widget
export function ApprovalsWidget({ data }: { data: DashboardData }) {
    const router = useRouter()
    return (
        <Card
            className="h-full cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all duration-200 group border-border shadow-sm flex flex-col justify-center p-6 relative overflow-hidden bg-card"
            onClick={() => router.push('/approvals')}
        >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <CheckSquare className="w-32 h-32" />
            </div>

            <div className="flex items-center gap-2 mb-4 relative z-10">
                <div className="p-1.5 bg-muted rounded-lg">
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Approvals</span>
            </div>

            <div className="relative z-10">
                <div className="text-5xl font-bold tracking-tighter text-foreground mb-1">{data.pendingCount}</div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Pending requests
                </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-primary relative z-10">
                Review <ArrowRight className="ml-1 h-3 w-3" />
            </div>
        </Card>
    )
}

// 6. Active Trips Widget
export function ActiveTripsWidget({ data }: { data: DashboardData }) {
    const router = useRouter()
    return (
        <Card className="h-full col-span-2 border-border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Active Trips
                </CardTitle>
                <Link href="/trips" className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    View All <ArrowRight className="h-3 w-3" />
                </Link>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-3">
                    {data.trips.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No active trips</p>
                        </div>
                    ) : (
                        data.trips.map((trip) => (
                            <div
                                key={trip.id}
                                className="flex items-center justify-between p-3 border border-border rounded-xl hover:border-primary/30 hover:shadow-sm bg-background cursor-pointer transition-all group"
                                onClick={() => router.push(`/trips/${trip.id}`)}
                            >
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{trip.name}</span>
                                    <span className="text-xs text-muted-foreground font-medium">
                                        {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        {trip.endDate ? ` - ${new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-xs font-bold bg-muted text-muted-foreground px-2.5 py-1 rounded-md">
                                        {trip.status}
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

// 7. Quick Actions Widget
export function QuickActionsWidget({ data }: { data: DashboardData }) {
    const router = useRouter()

    const actions = [
        { label: "Scan Receipt", icon: Camera, path: "/expenses/new", color: "text-primary", bg: "bg-primary/10" },
        { label: "New Expense", icon: Plus, path: "/expenses/new", color: "text-primary", bg: "bg-primary/10" },
        { label: "New Trip", icon: MapPin, path: "/trips/new", color: "text-primary", bg: "bg-primary/10" },
        { label: "Settings", icon: Settings, path: "/settings", color: "text-muted-foreground", bg: "bg-muted" },
    ]

    return (
        <Card className="h-full border-border shadow-sm p-4 bg-card">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 h-full">
                {actions.map((action) => {
                    const isExpenseAction = action.label === "Scan Receipt" || action.label === "New Expense"

                    const ActionButton = (
                        <div
                            className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-all border border-transparent hover:border-border/50 group w-full h-full"
                            onClick={isExpenseAction ? undefined : () => router.push(action.path)}
                        >
                            <div className={`p-3 rounded-full mb-2 ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                                <action.icon className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground text-center">{action.label}</span>
                        </div>
                    )

                    if (isExpenseAction) {
                        return (
                            // Wrapper needs a unique key, and we pass Trips (empty array is fine as it fetches inside or we can pass data.trips if available in the widget)
                            // Actually data is available in props.
                            <FastExpenseWrapper key={action.label} trips={data.trips} trigger={ActionButton} />
                        )
                    }

                    return <div key={action.label} className="contents">{ActionButton}</div>
                })}
            </div>
        </Card>
    )
}


// 8. Ask Kharcho AI Widget
export function AskKharchoWidget({ data }: { data: DashboardData }) {
    return <AskDataWidget />
}

// Registry mapping ID to Component
export const WIDGET_REGISTRY: Record<WidgetId, { component: React.FC<{ data: DashboardData }>; title: string; defaultSize: string }> = {
    "balance": { component: BalanceWidget, title: "Total Balance", defaultSize: "hidden" },
    "spend": { component: TotalSpendWidget, title: "Total Spend", defaultSize: "col-span-1 md:col-span-2" }, // Resized to be smaller
    "payout": { component: () => null, title: "Next Payout (Hidden)", defaultSize: "hidden" },
    "spending-chart": { component: SpendingChartWidget, title: "Spending Over Time", defaultSize: "col-span-1 md:col-span-4 lg:col-span-5" }, // Expanded to fill space
    "category-chart": { component: CategoryChartWidget, title: "Spending by Category (Hidden)", defaultSize: "hidden" }, // HIDDEN
    "recent-expenses": { component: RecentExpensesWidget, title: "Recent Expenses", defaultSize: "col-span-1 md:col-span-3 lg:col-span-3" },
    "approvals": { component: ApprovalsWidget, title: "Approvals", defaultSize: "col-span-1 md:col-span-2" },
    "cards": { component: () => null, title: "My Cards (Hidden)", defaultSize: "hidden" },
    "trips": { component: ActiveTripsWidget, title: "Active Trips", defaultSize: "col-span-1 md:col-span-4" },
    "ask-kharcho": { component: AskKharchoWidget, title: "Ask Penny", defaultSize: "col-span-1 md:col-span-2 lg:col-span-3" },
    "quick-actions": { component: QuickActionsWidget, title: "Quick Actions", defaultSize: "col-span-1 md:col-span-4 lg:col-span-4" },
    "spending-map": { component: SpendingMapWidget, title: "Spending Map", defaultSize: "col-span-1 md:col-span-4 lg:col-span-4" }
}

export const WIDGET_SIZES = [
    { label: "Small", value: "col-span-1" },
    { label: "Medium", value: "col-span-1 md:col-span-2" },
    { label: "Large", value: "col-span-1 md:col-span-2 lg:col-span-3" },
    { label: "Half Width", value: "col-span-1 md:col-span-2 lg:col-span-4" },
    { label: "Extra Large", value: "col-span-1 md:col-span-4 lg:col-span-5" },
    { label: "Full Width", value: "col-span-1 md:col-span-2 lg:col-span-7" }
]

export const DEFAULT_LAYOUT = [
    { id: "quick-actions", type: "quick-actions" },
    { id: "spend", type: "spend" },
    { id: "approvals", type: "approvals" },
    { id: "spending-chart", type: "spending-chart" },
    { id: "recent-expenses", type: "recent-expenses" },
    { id: "spending-map", type: "spending-map" },
    { id: "trips", type: "trips" },
    { id: "ask-kharcho", type: "ask-kharcho" },
];
