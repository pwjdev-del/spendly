"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format, addMonths, subMonths } from "date-fns"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Plus } from "lucide-react"
import Link from "next/link"

interface Expense {
    id: string
    merchant: string
    amount: number
    category: string
    date: Date
    currency: string
    status: string
}

export interface RecurringExpense {
    id: string
    merchant: string
    amount: number
    category: string
    nextDueDate: Date
    currency: string
    frequency: string
}

export function CalendarClient({ expenses, recurringExpenses, balance = 0, enableTimeTravel = false }: { expenses: Expense[], recurringExpenses: RecurringExpense[], balance?: number, enableTimeTravel?: boolean }) {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [viewDate, setViewDate] = useState<Date>(new Date())
    const [direction, setDirection] = useState(0)

    const onMonthChange = (newDate: Date) => {
        setDirection(newDate > viewDate ? 1 : -1)
        setViewDate(newDate)
    }

    const handleSwipe = (_: any, info: any) => {
        const swipeThreshold = 50;
        if (info.offset.x < -swipeThreshold) {
            onMonthChange(addMonths(viewDate, 1))
        } else if (info.offset.x > swipeThreshold) {
            onMonthChange(subMonths(viewDate, 1))
        }
    }

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50, // Inverse exit direction
            opacity: 0,
            scale: 0.95,
            position: "absolute" as const, // Fix layout shift
        })
    };

    // Helper to adjust date for timezone offset
    const normalizeDate = (dateDisplay: Date | string) => {
        const d = new Date(dateDisplay);
        return new Date(d.valueOf() + d.getTimezoneOffset() * 60000);
    };

    // Normalize expenses
    const normalizedExpenses = expenses.map(e => ({
        ...e,
        date: normalizeDate(e.date)
    }));

    // Group expenses by date string
    const expensesByDate = normalizedExpenses.reduce((acc, expense) => {
        const dateStr = expense.date.toDateString();
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(expense);
        return acc;
    }, {} as Record<string, Expense[]>);

    // Calculate daily totals for intensity
    const dailyTotals = Object.entries(expensesByDate).reduce((acc, [dateStr, exps]) => {
        acc[dateStr] = exps.reduce((sum, e) => sum + e.amount, 0);
        return acc;
    }, {} as Record<string, number>);

    // Determine thresholds (simple relative logic)
    const allTotals = Object.values(dailyTotals);
    const maxTotal = Math.max(...allTotals, 1); // Avoid div by 0

    const getIntensity = (d: Date) => {
        const total = dailyTotals[d.toDateString()] || 0;
        if (total === 0) return null;
        const ratio = total / maxTotal;
        if (ratio > 0.6) return "high";
        if (ratio > 0.2) return "medium";
        return "low";
    };

    // Modifiers for the calendar
    const highDates: Date[] = [];
    const mediumDates: Date[] = [];
    const lowDates: Date[] = [];

    // Populate intensity arrays
    // We only need to check dates that have expenses
    Object.keys(dailyTotals).forEach(dateStr => {
        const d = new Date(dateStr);
        const intensity = getIntensity(d);
        if (intensity === "high") highDates.push(d);
        else if (intensity === "medium") mediumDates.push(d);
        else if (intensity === "low") lowDates.push(d);
    });

    const selectedExpenses = date ? (expensesByDate[date.toDateString()] || []) : [];

    // Calculate Monthly Summary based on viewDate
    const currentMonthExpenses = normalizedExpenses.filter(e =>
        e.date.getMonth() === viewDate.getMonth() &&
        e.date.getFullYear() === viewDate.getFullYear()
    );
    const monthlySpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Normalize recurring expenses
    const normalizedRecurring = recurringExpenses.map(e => ({
        ...e,
        nextDueDate: normalizeDate(e.nextDueDate)
    }));

    // --- PROJECTION LOGIC: TIME TRAVEL ENGINE ---
    // Start with the user's current actual balance
    // We want to project this into the future
    const dailyForecast: Record<string, number> = {};
    let runningBalance = balance; // Start with current wallet balance

    // Let's simulate 365 days into the future to cover most views
    const forecastMap = new Map<string, number>();
    const simulationStart = new Date();
    simulationStart.setHours(0, 0, 0, 0);

    const dangerDates: Date[] = [];
    const warningDates: Date[] = [];

    // Only run projection if Time Travel is enabled
    if (enableTimeTravel) {
        // Sort recurring expenses by day of month for easier lookup?
        // Actually, iterating days is safer.
        for (let d = 0; d < 365; d++) {
            const currentDate = new Date(simulationStart);
            currentDate.setDate(simulationStart.getDate() + d);
            const dateStr = currentDate.toDateString();

            // Check for recurring expenses due on this date
            // (In a real app, we'd handle One-Time Future Expenses too, but here we only have Recurring schema available for future)
            const billsDue = normalizedRecurring.filter(r => {
                // Check if this date matches the recurring rule
                // Simplified: Just matching day of month for MONTHLY
                if (r.frequency.toUpperCase() === 'MONTHLY') {
                    return r.nextDueDate.getDate() === currentDate.getDate();
                }
                return false;
            });

            const dailyBillTotal = billsDue.reduce((sum, b) => sum + b.amount, 0);

            // Subtract from running balance
            runningBalance -= dailyBillTotal;

            // Store result
            forecastMap.set(dateStr, runningBalance);

            // Populate Visual State Arrays
            if (runningBalance < 0) {
                dangerDates.push(new Date(currentDate));
            } else if (runningBalance < 50000) { // Warning under $500.00
                warningDates.push(new Date(currentDate));
            }
        }
    }

    const getDailyForecast = (d: Date) => {
        // Only show forecast for Today and Future
        if (d < simulationStart) return null;
        return forecastMap.get(d.toDateString()) ?? null;
    };

    // --- RESTORED LOGIC ---
    // Calculate projected occurrences for the current view month (For Stats at top)
    const projectedOccurrences: { date: Date, amount: number }[] = [];

    normalizedRecurring.forEach(r => {
        // Simple projection logic for MONTHLY only to start (safest assumption)
        // If frequency is 'MONTHLY', we project it to the same day in the view month
        if (r.frequency.toUpperCase() === 'MONTHLY') {
            const day = r.nextDueDate.getDate();
            const projectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);

            // For visualization, we just show where it would fall in this month
            projectedOccurrences.push({
                date: projectedDate,
                amount: r.amount
            });
        }
    });

    const monthlyProjected = projectedOccurrences.reduce((sum, p) => sum + p.amount, 0);
    const projectedDates = projectedOccurrences.map(p => p.date);

    // Calculate No-Spend Streak
    const streakDates: Date[] = [];
    const today = new Date();
    // Check last 365 days for streaks
    for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toDateString();
        // Expenses on this day?
        const dayTotal = dailyTotals[dateStr] || 0;

        // If 0 spend AND not in the future
        if (dayTotal === 0 && d <= today) {
            streakDates.push(new Date(d));
        }
    }

    // Determine current active streak count
    let currentStreak = 0;
    // Check moving backwards from today (or yesterday if today has spend)
    let checkDate = new Date();
    // If today has spend, start check from yesterday
    if ((dailyTotals[checkDate.toDateString()] || 0) > 0) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
        const total = dailyTotals[checkDate.toDateString()] || 0;
        if (total === 0) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full">
            {/* Left Side: Calendar Widget */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-none w-full lg:w-auto lg:min-w-[400px]"
            >
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden p-6 space-y-6 relative z-10">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
                            {format(viewDate, "MMMM yyyy")}
                        </h2>
                        <div className="flex items-center gap-6 mt-2">
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase tracking-widest">Spent</span>
                                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    ${(monthlySpent / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Streak Counter */}
                            <div className="flex flex-col border-l pl-4 border-zinc-200 dark:border-zinc-700">
                                <span className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                    Streak <span className="text-amber-500">🔥</span>
                                </span>
                                <span className="text-2xl font-bold text-zinc-700 dark:text-zinc-200">
                                    {currentStreak} <span className="text-sm font-normal text-muted-foreground">days</span>
                                </span>
                            </div>

                            {monthlyProjected > 0 && (
                                <div className="flex flex-col border-l pl-4 border-zinc-200 dark:border-zinc-700">
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest">Projected</span>
                                    <span className="text-2xl font-bold text-zinc-500 dark:text-zinc-400">
                                        ${(monthlyProjected / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-center relative overflow-hidden min-h-[350px]">
                        <AnimatePresence initial={false} custom={direction} mode="popLayout">
                            <motion.div
                                key={viewDate.toISOString()}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 }
                                }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={handleSwipe}
                                className="absolute inset-0 flex justify-center items-start"
                            >
                                <Calendar
                                    mode="single"
                                    month={viewDate} // Controlled month
                                    selected={date}
                                    onSelect={setDate}
                                    onMonthChange={onMonthChange}
                                    className="p-0 bg-transparent border-none shadow-none"
                                    components={{
                                        // Removed Custom DayContent to fix type error; using modifiers instead
                                    }}
                                    modifiers={{
                                        high: highDates,
                                        medium: mediumDates,
                                        low: lowDates,
                                        projected: projectedDates,
                                        streak: streakDates,
                                        danger: dangerDates,
                                        warning: warningDates
                                    }}
                                    modifiersClassNames={{
                                        high: "before:content-[''] before:absolute before:inset-1 before:rounded-full before:bg-rose-500/20 before:z-[-1] after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-rose-500 after:rounded-full after:z-[-1]",
                                        medium: "before:content-[''] before:absolute before:inset-1 before:rounded-full before:bg-amber-500/20 before:z-[-1] after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-amber-500 after:rounded-full after:z-[-1]",
                                        low: "before:content-[''] before:absolute before:inset-1 before:rounded-full before:bg-emerald-500/20 before:z-[-1] after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-emerald-500 after:rounded-full after:z-[-1]",
                                        projected: "border-2 border-dashed border-zinc-300 dark:border-zinc-700 opacity-80",
                                        danger: "bg-red-500/20 text-red-600 font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-red-500/30",
                                        warning: "bg-amber-500/10 text-amber-600 font-bold border border-amber-500/30",
                                        streak: ""
                                    }}
                                    classNames={{
                                        day: cn(
                                            "h-10 w-10 p-0 font-normal aria-selected:opacity-100 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative z-10",
                                            "hover:bg-cyan-500/10 dark:hover:bg-cyan-400/10 hover:scale-110",
                                            "active:scale-75 active:transition-transform active:duration-100", // Jelly poke effect
                                            "focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-0",
                                            "data-[selected]:bg-cyan-500/20 data-[selected]:backdrop-blur-md data-[selected]:border data-[selected]:border-cyan-500/30"
                                        ),
                                        day_selected: "bg-cyan-500 text-white hover:bg-cyan-600 shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-110 border-transparent font-bold z-20",
                                        day_today: "bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 text-foreground font-semibold",
                                        head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
                                    }}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center gap-6 text-xs text-muted-foreground pt-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Low
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Medium
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span> High
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Right Side: Transaction List */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex-1 min-w-0"
            >
                <div className="h-full flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-semibold">
                                {date ? format(date, "EEEE, MMMM do") : "Select a date"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {selectedExpenses.length} transaction{selectedExpenses.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        {date && (
                            <Link href={`/expenses/new?date=${date.toISOString()}`}>
                                <Button className="rounded-full shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Expense
                                </Button>
                            </Link>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3">
                        <AnimatePresence mode="popLayout">
                            {selectedExpenses.length > 0 ? (
                                selectedExpenses.map((expense, index) => (
                                    <motion.div
                                        key={expense.id}
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 hover:border-zinc-200 dark:hover:border-zinc-700">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center text-xl font-bold text-zinc-700 dark:text-zinc-300 shadow-inner">
                                                    {expense.merchant.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-lg">{expense.merchant}</div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] font-medium opacity-80 group-hover:opacity-100">
                                                            {expense.category}
                                                        </Badge>
                                                        <span className="text-xs">{format(new Date(expense.date), "h:mm a")}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="font-bold text-lg tabular-nums tracking-tight">
                                                    {expense.currency === 'USD' ? '$' : expense.currency}{(expense.amount / 100).toFixed(2)}
                                                </div>
                                                <div className={cn("text-[10px] uppercase font-bold tracking-wider",
                                                    expense.status === 'APPROVED' ? "text-emerald-500" :
                                                        expense.status === 'REJECTED' ? "text-red-500" :
                                                            "text-zinc-400"
                                                )}>
                                                    {expense.status}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-zinc-50/50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800"
                                >
                                    <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4 animate-pulse">
                                        <CalendarIcon className="h-8 w-8 opacity-40" />
                                    </div>
                                    <p className="font-medium">No activity recorded</p>
                                    <p className="text-sm opacity-60">Enjoy your day!</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
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
