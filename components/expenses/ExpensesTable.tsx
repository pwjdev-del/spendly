"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { SafeMath } from "@/lib/math"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronUp, ChevronsUpDown, LayoutList, LayoutGrid, Receipt, Loader2, ArrowUpRight, TableProperties, Plane } from "lucide-react"
import { sendReceiptRequest, sendTripReportRequest } from "@/app/actions/email-actions"
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ExpenseRow } from "./ExpenseRow"
import { ExpenseCard } from "./ExpenseCard"
import { MerchantLogo } from "./MerchantLogo"
import { ExpenseActions } from "@/components/expenses/ExpenseActions"


interface Expense {
    id: string
    date: Date
    merchant: string
    category: string
    amount: number
    currency: string
    status: string
    reconciliationStatus: string
    receiptUrl?: string | null
    latitude?: number | null
    longitude?: number | null
    locationName?: string | null
    user: {
        name: string | null
        email: string | null
    }
    trip?: {
        name: string
    } | null
}

interface ExpensesTableProps {
    expenses: Expense[]
    userRole?: string
}

type SortKey = 'date' | 'merchant' | 'category' | 'amount' | 'status' | 'trip' | 'reconciliationStatus'

export function ExpensesTable({ expenses: initialExpenses, userRole = "MEMBER" }: ExpensesTableProps) {
    const [view, setView] = useState<'list' | 'block' | 'table'>('list')
    const [sortKey, setSortKey] = useState<SortKey>('date')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isEmailing, setIsEmailing] = useState(false)
    const [groupByDate, setGroupByDate] = useState(true) // Default to true for the feed look

    // Sorting Logic
    const sortedExpenses = [...initialExpenses].sort((a, b) => {
        let aValue: any = a[sortKey]
        let bValue: any = b[sortKey]

        if (sortKey === 'trip') {
            aValue = a.trip?.name || ''
            bValue = b.trip?.name || ''
        }

        // Date sort should be numerical
        if (sortKey === 'date') {
            aValue = new Date(a.date).getTime()
            bValue = new Date(b.date).getTime()
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
    })

    // Grouping Logic (Only valid if groupByDate is true AND we are sorting by date)
    const groupedExpenses = useMemo(() => {
        if (!groupByDate || sortKey !== 'date' || view === 'table') return null;

        const groups: Record<string, Expense[]> = {}

        sortedExpenses.forEach(expense => {
            const date = new Date(expense.date)
            const today = new Date()
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)

            let key = date.toLocaleDateString()

            if (date.toDateString() === today.toDateString()) key = "Today"
            else if (date.toDateString() === yesterday.toDateString()) key = "Yesterday"
            else {
                // Format: "Mon, Dec 10"
                key = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            }

            if (!groups[key]) groups[key] = []
            groups[key].push(expense)
        })

        return groups
    }, [sortedExpenses, sortKey, groupByDate, view])

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDirection('asc')
            if (key === 'date' || key === 'amount') setSortDirection('desc')
        }
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === initialExpenses.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(initialExpenses.map(e => e.id)))
        }
    }

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedIds(newSet)
    }

    const handleReceiptRequest = async () => {
        setIsEmailing(true)
        const result = await sendReceiptRequest(Array.from(selectedIds))
        setIsEmailing(false)
        if (result.success) {
            // Toast would be better here, using alert for now
            alert(`Sent receipt requests for ${result.count} expenses.`)
            setSelectedIds(new Set())
        } else {
            alert("Failed to send emails.")
        }
    }

    const isSelectionMode = selectedIds.size > 0

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center sticky top-0 z-30 py-4 bg-background/80 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0">

                {/* Left Side: Selection Actions */}
                <div className="flex items-center gap-4 flex-1 h-10">
                    <AnimatePresence>
                        {selectedIds.size > 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                className="flex items-center gap-3 bg-indigo-500 text-white px-1 py-1 pl-4 rounded-full shadow-lg shadow-indigo-500/20"
                            >
                                <span className="font-bold text-sm">{selectedIds.size} selected</span>
                                <div className="h-4 w-px bg-white/20" />
                                <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-7 text-xs px-3 hover:bg-white/20 rounded-full text-white" onClick={() => setSelectedIds(new Set())}>
                                        Cancel
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs px-3 hover:bg-white/20 rounded-full text-white" onClick={handleReceiptRequest} disabled={isEmailing}>
                                        {isEmailing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Receipt className="mr-1.5 h-3.5 w-3.5" />}
                                        Request Receipts
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Side: View Toggles & Sort */}
                <div className="flex items-center gap-3">
                    {/* Sort by Date Toggle (Hidden in Table View) */}
                    {view !== 'table' && (
                        <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-white/5 px-4 py-2 rounded-full transition-all hover:border-white/10 hover:bg-card/80">
                            <span className="text-xs font-medium text-slate-400">Timeline View</span>
                            <Switch
                                checked={groupByDate}
                                onCheckedChange={setGroupByDate}
                                className="scale-75 data-[state=checked]:bg-indigo-500"
                            />
                        </div>
                    )}

                    {/* View Switcher */}
                    <div className="flex bg-card/50 backdrop-blur-sm border border-white/5 p-1 rounded-full">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setView('list')}
                            className={cn(
                                "h-8 w-8 rounded-full transition-all duration-200",
                                view === 'list' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25" : "text-slate-400 hover:text-white"
                            )}
                            title="List View"
                        >
                            <LayoutList className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setView('block')}
                            className={cn(
                                "h-8 w-8 rounded-full transition-all duration-200",
                                view === 'block' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25" : "text-slate-400 hover:text-white"
                            )}
                            title="Grid View"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setView('table')}
                            className={cn(
                                "h-8 w-8 rounded-full transition-all duration-200",
                                view === 'table' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25" : "text-slate-400 hover:text-white"
                            )}
                            title="Table View (Excel)"
                        >
                            <TableProperties className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {view === 'list' ? (
                <div className="space-y-8 pb-20">
                    {groupedExpenses ? (
                        /* Grouped Timeline View */
                        (Object.entries(groupedExpenses) as [string, Expense[]][]).map(([dateLabel, expensesInGroup], index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={dateLabel}
                                className="relative"
                            >
                                {/* Timeline Line */}
                                <div className="absolute left-6 top-10 bottom-0 w-px bg-gradient-to-b from-white/10 to-transparent hidden md:block" />

                                <div className="sticky top-20 z-10 flex cursor-default mb-4">
                                    <div className="bg-card/90 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full shadow-lg flex items-center gap-3">
                                        <div className="text-xs font-bold text-white uppercase tracking-wider">{dateLabel}</div>
                                        <div className="w-px h-3 bg-white/20" />
                                        <div className="text-[10px] font-mono text-emerald-400 font-bold">
                                            {SafeMath.format(expensesInGroup.reduce((sum, e) => sum + e.amount, 0), expensesInGroup[0].currency)}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pl-0 md:pl-0">
                                    {expensesInGroup.map(expense => (
                                        <ExpenseRow
                                            key={expense.id}
                                            expense={expense}
                                            selected={selectedIds.has(expense.id)}
                                            onSelect={toggleSelect}
                                            isSelectionMode={isSelectionMode}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        /* Flat List View */
                        <div className="space-y-3">
                            <AnimatePresence>
                                {sortedExpenses.map((expense) => (
                                    <ExpenseRow
                                        key={expense.id}
                                        expense={expense}
                                        selected={selectedIds.has(expense.id)}
                                        onSelect={toggleSelect}
                                        isSelectionMode={isSelectionMode}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            ) : view === 'table' ? (
                /* Classic Excel-Style Table View */
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-card/30 backdrop-blur-md shadow-xl pb-20">
                    <div className="overflow-x-auto scrollbar-hide">
                        <Table className="min-w-[1000px] text-sm table-fixed">
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/60 border-b border-border">
                                    <TableHead className="w-[50px] p-2 pl-4"><Checkbox checked={selectedIds.size === initialExpenses.length && initialExpenses.length > 0} onCheckedChange={toggleSelectAll} className="rounded-[4px] border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" /></TableHead>
                                    <TableHead className="w-[120px] h-12 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>Date <ChevronsUpDown className="w-3 h-3 inline opacity-50" /></TableHead>
                                    <TableHead className="w-[240px] h-12 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer" onClick={() => handleSort('merchant')}>Merchant <ChevronsUpDown className="w-3 h-3 inline opacity-50" /></TableHead>
                                    <TableHead className="w-[150px] h-12 text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</TableHead>
                                    <TableHead className="w-[150px] h-12 text-xs font-bold text-muted-foreground uppercase tracking-wider">Trip</TableHead>
                                    <TableHead className="w-[120px] h-12 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</TableHead>
                                    <TableHead className="w-[140px] h-12 text-xs font-bold text-muted-foreground uppercase tracking-wider">Submitted By</TableHead>
                                    <TableHead className="w-[120px] h-12 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer" onClick={() => handleSort('amount')}>Amount <ChevronsUpDown className="w-3 h-3 inline opacity-50" /></TableHead>
                                    <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedExpenses.map((expense) => (
                                    <TableRow key={expense.id} className="border-b border-border hover:bg-muted/50 transition-colors group">
                                        <TableCell className="p-2 pl-4"><Checkbox checked={selectedIds.has(expense.id)} onCheckedChange={() => toggleSelect(expense.id)} className="rounded-[4px] border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" /></TableCell>
                                        <TableCell className="text-sm text-foreground font-mono py-3 truncate">
                                            <Link href={`/expenses/${expense.id}`} className="block hover:text-primary transition-colors">
                                                {new Date(expense.date).toLocaleDateString()}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Link href={`/expenses/${expense.id}`} className="block group-hover:text-primary transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <MerchantLogo merchant={expense.merchant} category={expense.category} className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity border border-border rounded-full" />
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground truncate pr-2 max-w-[160px]">{expense.merchant}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground py-3 text-sm truncate">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-1 bg-muted border border-border rounded-md text-[11px] font-medium tracking-wide">{expense.category}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            {expense.trip ? (
                                                <Link href={`/trips/${expense.trip.name ? expense.trip.name : ''}`} className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full w-fit max-w-[140px] truncate hover:bg-primary/20 transition-colors">
                                                    <Plane className="h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate">{expense.trip.name}</span>
                                                </Link>
                                            ) : <span className="text-muted-foreground text-sm">-</span>}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border w-fit shadow-sm",
                                                expense.status === 'APPROVED' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                                                    expense.status === 'REJECTED' ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" :
                                                        "bg-muted text-muted-foreground border-border"
                                            )}>
                                                {expense.status}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground py-3 text-sm truncate">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                                    {(expense.user?.name || 'U').charAt(0)}
                                                </div>
                                                <span className="truncate max-w-[100px] text-xs">{expense.user?.name || expense.user?.email || 'Unknown'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400 py-3 tabular-nums font-mono text-base">
                                            <Link href={`/expenses/${expense.id}`} className="block">
                                                {SafeMath.format(expense.amount, expense.currency)}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                                <ExpenseActions expense={expense} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ) : (
                /* Grid / Block View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    <AnimatePresence>
                        {sortedExpenses.map((expense) => (
                            <ExpenseCard key={expense.id} expense={expense} />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
