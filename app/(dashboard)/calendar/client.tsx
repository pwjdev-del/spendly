"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Expense {
    id: string
    merchant: string
    amount: number
    category: string
    date: Date
    currency: string
    status: string
}



export function CalendarClient({ expenses }: { expenses: Expense[] }) {
    const [date, setDate] = useState<Date | undefined>(new Date())

    // DEBUG logs removed

    // Helper to adjust date for timezone offset to prevent shifting
    // (e.g. 2025-12-15T00:00 UTC -> 2025-12-14T19:00 EST -> we want 2025-12-15 Local)
    const normalizeDate = (dateDisplay: Date | string) => {
        const d = new Date(dateDisplay);
        // Add the timezone offset to get back to the "intended" day visually
        // This is a common trick when dates are stored as UTC midnight but meant to be "dates"
        return new Date(d.valueOf() + d.getTimezoneOffset() * 60000);
    };

    const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    const addMonths = (date: Date, months: number) => {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    };

    const addYears = (date: Date, years: number) => {
        const result = new Date(date);
        result.setFullYear(result.getFullYear() + years);
        return result;
    };

    // Generate upcoming occurences - DISABLED AS PER USER REQUEST
    // const generateRecurrences = (sub: RecurringExpense, count = 24) => { ... }

    // Normalize regular expenses date too
    const normalizedExpenses = expenses.map(e => ({
        ...e,
        date: normalizeDate(e.date)
    }));

    // Project recurring expenses - DISABLED
    const subscriptionEvents: any[] = [];

    // Combined pool of events - EXPENSES ONLY
    const allEvents = [...normalizedExpenses]

    // Filter expenses for selected date
    const selectedExpenses = allEvents.filter(expense =>
        date &&
        new Date(expense.date).toDateString() === date.toDateString()
    )

    // Get dates that have expenses for highlighting (modifiers)
    const expenseDates = expenses.map(e => new Date(e.date))
    const subscriptionDates: Date[] = []

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Left Side: Calendar Widget */}
            <div className="flex-none w-full lg:w-auto">
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle>Select Date</CardTitle>
                        <CardDescription>View expenses by date</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 flex justify-center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="p-0"
                            modifiers={{
                                hasExpense: expenseDates
                            }}
                            classNames={{
                                head_cell: "text-zinc-500 font-medium text-[0.8rem]",
                                cell: "h-9 w-9 text-center p-0 relative [&:has([aria-selected])]:bg-zinc-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-zinc-100 rounded-md transition-colors",
                                day_selected: "bg-zinc-900 text-zinc-50 hover:bg-zinc-900 hover:text-zinc-50 focus:bg-zinc-900 focus:text-zinc-50",
                                day_today: "bg-zinc-100 text-zinc-900",
                            }}
                            modifiersClassNames={{
                                hasExpense: "font-bold relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-indigo-600 after:rounded-full"
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Legend */}
                <div className="mt-4 flex gap-4 text-sm px-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        <span className="text-muted-foreground">Expense recorded</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Transaction List */}
            <div className="flex-1 min-w-0">
                <Card className="h-full border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <div>
                            <CardTitle className="text-xl">
                                {date ? format(date, "MMMM d, yyyy") : "Select a date"}
                            </CardTitle>
                            <CardDescription>
                                {selectedExpenses.length > 0
                                    ? `${selectedExpenses.length} transaction${selectedExpenses.length !== 1 ? 's' : ''}`
                                    : "No transactions"}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0">
                        {selectedExpenses.length > 0 ? (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {selectedExpenses.map((expense) => (
                                    <div key={expense.id} className="p-4 hover:bg-zinc-50/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg">
                                                {/* Simple category icon or initial */}
                                                {expense.merchant.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-zinc-900 dark:text-zinc-100">{expense.merchant}</div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                                        {expense.category}
                                                    </Badge>
                                                    <span>{format(new Date(expense.date), "h:mm a")}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                                                {expense.currency === 'USD' ? '$' : expense.currency}{(expense.amount / 100).toFixed(2)}
                                            </div>
                                            <div className={cn("text-[10px] uppercase font-bold tracking-wider",
                                                expense.status === 'APPROVED' ? "text-emerald-600" :
                                                    expense.status === 'REJECTED' ? "text-red-600" :
                                                        "text-zinc-400"
                                            )}>
                                                {expense.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                                <div className="p-4 rounded-full bg-zinc-50 dark:bg-zinc-800 mb-2">
                                    <CalendarIcon className="h-6 w-6 opacity-30" />
                                </div>
                                <p className="text-sm">No activity on this day</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function CalendarIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
        </svg>
    )
}
