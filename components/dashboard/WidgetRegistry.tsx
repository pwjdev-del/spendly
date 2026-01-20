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
import { AnimatedCurrency, AnimatedCounter } from "@/components/ui/AnimatedCounter"

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
        <Card className="h-full border border-border bg-card shadow-sm relative overflow-hidden group widget-interactive">
            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Total Balance</h3>
                        <div className="mt-2 text-4xl font-bold text-foreground tracking-tight number-glow">
                            <AnimatedCurrency value={data.balance} />
                        </div>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Wallet className="w-6 h-6 text-primary" />
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>+<AnimatedCurrency value={data.totalIncome} /> this month</span>
                    </div>
                </div>
            </CardContent>
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-primary/10 transition-colors duration-500" />
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
        <Card className="h-full border border-border bg-card shadow-sm relative overflow-hidden group widget-interactive">
            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Total Spend</h3>
                        <div className="mt-2 text-4xl font-bold text-foreground tracking-tight number-glow">
                            <AnimatedCurrency value={data.totalSpend} />
                        </div>
                    </div>
                    <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <CreditCard className="w-6 h-6 text-indigo-400" />
                    </div>
                </div>

                <div className="space-y-3 mt-6">
                    <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Budget: ${budget.toLocaleString()}</span>
                        <span className="text-foreground"><AnimatedCounter value={percentage} decimals={0} suffix="%" duration={1200} /></span>
                    </div>
                    <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-1000 ease-out"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium pt-1">
                        ${remaining.toLocaleString(undefined, { minimumFractionDigits: 0 })} remaining
                    </p>
                </div>
            </CardContent>
            {/* Background Glow */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mb-16 pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-500" />
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
    // Import helper dynamically or use if available in scope. 
    // Since we are inside the file, we can't import easily if it's not at top.
    // Ideally we assume the user will auto-import or we add import at top.
    // For now, I will use the helper logic here or expect top-level import.
    // Let's assume we added the import at the top in a separate edit or use inline logic if complex.
    // Actually, I should add the import first. But I can't do two ranges. 
    // I will replace the whole component and rely on a separate 'Add Import' step or just assume I can edit the top later.
    // Wait, I can use the tool to edit the top too? No, single contiguous block.
    // I will use a multi_replace for this file.

    return (
        <Card
            className="h-full cursor-pointer border border-border bg-card shadow-sm hover:border-primary/50 transition-all duration-200"
            onClick={() => router.push('/expenses')}
        >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold text-foreground">Recent Activity</CardTitle>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Link href="/expenses" className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                        View All <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="space-y-4">
                    {data.recentExpenses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No recent activity</p>
                        </div>
                    ) : (
                        data.recentExpenses.slice(0, 4).map((expense) => {
                            // Inline generic logic if import fails, but ideally we use the helper.
                            // I'll add the import in a separate tool call.
                            return (
                                <ExpenseRow key={expense.id} expense={expense} />
                            )
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

import { getExpenseIcon } from "@/lib/category-icons"

function ExpenseRow({ expense }: { expense: any }) {
    const { icon: Icon, color, bg } = getExpenseIcon(expense.category, expense.merchant)

    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-full ${bg} flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-sm text-foreground">{expense.merchant}</span>
                    <span className="text-xs text-muted-foreground">
                        {expense.category} • {new Date(expense.createdAt).toLocaleDateString(undefined, { hour: 'numeric', minute: 'numeric' })}
                    </span>
                </div>
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">
                ${(expense.amount / 100).toFixed(2)}
            </span>
        </div>
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
            className="h-full cursor-pointer border border-border bg-card shadow-sm hover:border-primary/50 transition-all duration-200 group relative overflow-hidden"
            onClick={() => router.push('/approvals')}
        >
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                <CheckSquare className="w-24 h-24" />
            </div>

            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Pending Approvals</h3>
                        <div className="mt-2 text-4xl font-bold text-foreground tracking-tight">
                            {data.pendingCount}
                        </div>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-xl">
                        <CheckSquare className="w-6 h-6 text-orange-500" />
                    </div>
                </div>
                <div className="mt-4">
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                        Requires attention
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

// 6. Active Trips Widget
export function ActiveTripsWidget({ data }: { data: DashboardData }) {
    const router = useRouter()
    return (
        <Card className="h-full col-span-2 border border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold text-foreground">Active Trips</CardTitle>
                <Link href="/trips" className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    View All <ArrowRight className="h-3 w-3" />
                </Link>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="space-y-4">
                    {data.trips.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No active trips</p>
                        </div>
                    ) : (
                        data.trips.map((trip) => (
                            <div
                                key={trip.id}
                                className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:bg-accent/50 cursor-pointer transition-all group bg-card"
                                onClick={() => router.push(`/trips/${trip.id}`)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{trip.name}</span>
                                        <span className="text-xs text-muted-foreground font-medium">
                                            {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            {trip.endDate ? ` - ${new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Status Pill matching screenshot style */}
                                    <div className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wide">
                                        {trip.status}
                                    </div>
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
        { label: "Scan Receipt", icon: Camera, path: "/expenses/new", color: "text-sky-400", bg: "bg-sky-400/10", border: 'border-sky-400/20' },
        { label: "New Expense", icon: Plus, path: "/expenses/new", color: "text-emerald-400", bg: "bg-emerald-400/10", border: 'border-emerald-400/20' },
        { label: "New Trip", icon: MapPin, path: "/trips/new", color: "text-indigo-400", bg: "bg-indigo-400/10", border: 'border-indigo-400/20' },
        { label: "Settings", icon: Settings, path: "/settings", color: "text-slate-400", bg: "bg-slate-400/10", border: 'border-slate-400/20' },
    ]

    return (
        <Card className="h-full border border-border bg-card shadow-sm p-6">
            <h3 className="text-sm font-medium text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-full">
                {actions.map((action) => {
                    const isExpenseAction = action.label === "Scan Receipt" || action.label === "New Expense"

                    const ActionButton = (
                        <div
                            className={`flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer transition-all border ${action.border} bg-card hover:bg-secondary/50 hover:border-primary/20 group h-full`}
                            onClick={isExpenseAction ? undefined : () => router.push(action.path)}
                        >
                            <div className={`p-3 rounded-full mb-3 ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                                <action.icon className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center">{action.label}</span>
                        </div>
                    )

                    if (isExpenseAction) {
                        return (
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
export const WIDGET_REGISTRY: Record<WidgetId, { component: React.FC<{ data: DashboardData }>; title: string; defaultSize: string; mobileVisible?: boolean }> = {
    "balance": { component: BalanceWidget, title: "Total Balance", defaultSize: "hidden" },
    "spend": { component: TotalSpendWidget, title: "Total Spend", defaultSize: "col-span-1 md:col-span-2", mobileVisible: true }, // Essentials
    "payout": { component: () => null, title: "Next Payout (Hidden)", defaultSize: "hidden" },
    "spending-chart": { component: SpendingChartWidget, title: "Spending Over Time", defaultSize: "col-span-1 md:col-span-4 lg:col-span-5" },
    "category-chart": { component: CategoryChartWidget, title: "Spending by Category (Hidden)", defaultSize: "hidden" },
    "recent-expenses": { component: RecentExpensesWidget, title: "Recent Expenses", defaultSize: "col-span-1 md:col-span-3 lg:col-span-3" },
    "approvals": { component: ApprovalsWidget, title: "Approvals", defaultSize: "col-span-1 md:col-span-2", mobileVisible: true }, // Essentials
    "cards": { component: () => null, title: "My Cards (Hidden)", defaultSize: "hidden" },
    "trips": { component: ActiveTripsWidget, title: "Active Trips", defaultSize: "col-span-1 md:col-span-4" },
    "ask-kharcho": { component: AskKharchoWidget, title: "Ask Penny", defaultSize: "col-span-1 md:col-span-2 lg:col-span-3" },
    "quick-actions": { component: QuickActionsWidget, title: "Quick Actions", defaultSize: "col-span-1 md:col-span-4 lg:col-span-4", mobileVisible: true }, // Essentials
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
