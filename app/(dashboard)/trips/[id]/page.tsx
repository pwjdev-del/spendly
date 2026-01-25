import Link from "next/link"
import { ArrowLeft, Edit, MapPin, Plus, Calendar, User, DollarSign, Wallet, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { getTripById } from "@/app/actions/trips"
import { redirect } from "next/navigation"
import { TripStatusSelector } from "./TripStatusSelector"
import { TripDocumentManager } from "./TripDocumentManager"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { getStatusConfig, canAddExpense, getBadgeColor } from "@/lib/trip-workflow"
import { TripReportButton } from "./TripReportButton"
import { DiscussionPanel } from "@/components/discussions/DiscussionPanel"
import { TripTasks } from "@/components/trips/TripTasks"

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const trip = await getTripById(id) as any // Cast to any to handle new relations before TS refresh

    if (!trip) {
        redirect("/trips")
    }

    // Fetch current user role
    const session = await auth()
    const currentUser = await prisma.user.findUnique({
        where: { email: session?.user?.email! },
        select: { role: true }
    })
    const userRole = currentUser?.role || "MEMBER"

    const totalSpent = trip.expenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0)
    const budgetProgress = trip.budget ? (totalSpent / trip.budget) * 100 : 0
    const isOverBudget = trip.budget && totalSpent > trip.budget

    // Get workflow progress
    const statusConfig = getStatusConfig(trip.status)
    const workflowProgress = statusConfig?.percentage || 0

    const progressColorRaw = statusConfig?.color || "blue"
    const progressColorMap: Record<string, string> = {
        blue: "bg-blue-600",
        orange: "bg-orange-500",
        green: "bg-green-600"
    }
    const progressColor = progressColorMap[progressColorRaw] || "bg-primary"
    const badgeColorClass = statusConfig ? getBadgeColor(statusConfig.color) : "bg-zinc-100 text-zinc-800"

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                        <Link href="/trips">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{trip.name}</h1>
                            <Badge variant="outline" className={`${badgeColorClass} border-0 font-semibold px-2.5 py-0.5 rounded-md`}>
                                {statusConfig?.label || trip.status}
                            </Badge>
                        </div>
                        <p className="text-zinc-500 font-mono text-sm mt-1">#{trip.tripNumber}</p>
                    </div>
                </div>
                <div className="flex gap-3 items-center">
                    {userRole === "ADMIN" && (
                        <Button variant="outline" asChild className="rounded-xl font-semibold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                            <Link href={`/trips/${trip.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Trip
                            </Link>
                        </Button>
                    )}

                    <TripReportButton trip={trip} />

                    {/* Only show Add Expense if trip allows adding expenses (Planning/Active) */}
                    {canAddExpense(trip.status) && (
                        <Button asChild className="rounded-xl font-semibold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Link href={`/expenses/new?tripId=${trip.id}`}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Expense (Verify)
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Workflow Progress Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                        <CardTitle className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-indigo-500" />
                            Workflow Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                    <span>Progress</span>
                                    <span>{workflowProgress}%</span>
                                </div>
                                <Progress
                                    value={workflowProgress}
                                    className="h-2.5 bg-zinc-100 dark:bg-zinc-800"
                                    indicatorClassName={progressColor}
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <span className="text-sm text-zinc-500">Current Phase: <strong className="text-zinc-900 dark:text-zinc-100">{statusConfig?.label}</strong></span>
                                <TripStatusSelector tripId={trip.id} currentStatus={trip.status} userRole={userRole} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats / Budget */}
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <DollarSign className="w-32 h-32 text-indigo-600 transform rotate-12 -translate-y-8 translate-x-8" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Total Spent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-4xl font-bold mb-4 tabular-nums ${isOverBudget ? 'text-red-500' : 'text-zinc-900 dark:text-white'}`}>
                            ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>

                        {trip.budget ? (
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-semibold text-zinc-500">
                                    <span>Budget: ${trip.budget.toLocaleString()}</span>
                                    <span className={isOverBudget ? "text-red-500" : "text-green-600"}>
                                        {isOverBudget ? 'Over Budget' : `${Math.max(0, trip.budget - totalSpent).toLocaleString(undefined, { style: 'currency', currency: 'USD' })} left`}
                                    </span>
                                </div>
                                <Progress
                                    value={Math.min(budgetProgress, 100)}
                                    className="h-2 bg-zinc-100 dark:bg-zinc-800"
                                    indicatorClassName={isOverBudget ? "bg-red-500" : "bg-zinc-900 dark:bg-zinc-50"}
                                />
                            </div>
                        ) : (
                            <div className="text-sm text-zinc-500 italic pb-2">No budget set for this trip.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Trip Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardContent className="pt-6 flex items-start gap-4">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase text-zinc-400 mb-1">Dates</div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {new Date(trip.startDate).toLocaleDateString()}
                                {trip.endDate && ` - ${new Date(trip.endDate).toLocaleDateString()}`}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardContent className="pt-6 flex items-start gap-4">
                        <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg text-pink-600 dark:text-pink-400">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase text-zinc-400 mb-1">Created By</div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">{trip.user.name || trip.user.email}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardContent className="pt-6 flex items-start gap-4">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase text-zinc-400 mb-1">Description</div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2" title={trip.description || "No description"}>
                                {trip.description || "No description"}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Expenses Table */}
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <CardHeader className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Expenses</CardTitle>
                        <Badge variant="secondary" className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                            {trip.expenses.length} Items
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {trip.expenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                            <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                <DollarSign className="h-6 w-6 text-zinc-400" />
                            </div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No expenses yet</p>
                            <p className="text-xs max-w-xs mx-auto mt-1">Expenses added to this trip will appear here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-[700px]">
                                <TableHeader>
                                    <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50/50">
                                        <TableHead className="py-3 font-semibold text-zinc-600">Date</TableHead>
                                        <TableHead className="py-3 font-semibold text-zinc-600">Merchant</TableHead>
                                        <TableHead className="py-3 font-semibold text-zinc-600">Category</TableHead>
                                        <TableHead className="py-3 font-semibold text-zinc-600">Member</TableHead>
                                        <TableHead className="py-3 font-semibold text-zinc-600">Status</TableHead>
                                        <TableHead className="py-3 font-semibold text-zinc-600 text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {trip.expenses.map((expense: any) => (
                                        <TableRow key={expense.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer group">
                                            <TableCell className="py-4">
                                                <Link href={`/expenses/${expense.id}`} className="block">
                                                    <div className="font-medium text-zinc-900 dark:text-zinc-200">
                                                        {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </div>
                                                    <div className="text-xs text-zinc-500">
                                                        {new Date(expense.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/expenses/${expense.id}`} className="block">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-primary transition-colors">{expense.merchant}</span>
                                                        {expense.latitude && expense.longitude && (
                                                            <div className="text-zinc-400">
                                                                <MapPin className="h-3 w-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/expenses/${expense.id}`} className="block">
                                                    <Badge variant="outline" className="bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 font-normal">
                                                        {expense.category}
                                                    </Badge>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                                                <Link href={`/expenses/${expense.id}`} className="block">
                                                    {expense.user.name || expense.user.email}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/expenses/${expense.id}`} className="block">
                                                    <Badge variant={expense.status === 'APPROVED' ? 'default' : 'secondary'} className={expense.status === 'APPROVED' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                                                        {expense.status}
                                                    </Badge>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/expenses/${expense.id}`} className="block">
                                                    <span className="font-bold text-zinc-900 dark:text-white tabular-nums">
                                                        ${expense.amount.toFixed(2)}
                                                    </span>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                {/* Trip Documents */}
                <TripDocumentManager tripId={trip.id} documents={(trip as any).documents || []} />

                {/* Discussion Panel */}
                <Card className="flex flex-col h-full border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                        <CardTitle className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-indigo-500" />
                            Discussion
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <DiscussionPanel
                            entityType="TRIP"
                            entityId={trip.id}
                            currentUserId={session?.user?.id!}
                            title={`Discussion for ${trip.name}`}
                            className="border-0 shadow-none rounded-none"
                            scrollAreaClassName="h-[400px]"
                        />
                    </CardContent>
                </Card>

                {/* Trip Tasks */}
                <Card className="lg:col-span-2 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardContent className="pt-6">
                        <TripTasks tripId={trip.id} tasks={(trip as any).tasks || []} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
