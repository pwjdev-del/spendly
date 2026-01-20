"use client"

import { useState } from "react"
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
import { ChevronDown, ChevronUp, ChevronsUpDown, MapPin, Loader2, LayoutList, LayoutGrid, Receipt, Plane, ArrowUpRight, Calendar, CreditCard } from "lucide-react"
import { ExpenseActions } from "@/components/expenses/ExpenseActions"
import { sendReceiptRequest, sendTripReportRequest } from "@/app/actions/email-actions"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { getExpenseIcon } from "@/lib/category-icons"


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

function SortIcon({ column, sortKey, sortDirection }: { column: SortKey, sortKey: SortKey, sortDirection: 'asc' | 'desc' }) {
    if (sortKey !== column) return <ChevronsUpDown className="ml-2 h-3 w-3 opacity-30" />
    return sortDirection === 'asc'
        ? <ChevronUp className="ml-2 h-3 w-3 text-zinc-900 dark:text-zinc-100" />
        : <ChevronDown className="ml-2 h-3 w-3 text-zinc-900 dark:text-zinc-100" />
}

export function ExpensesTable({ expenses: initialExpenses, userRole = "MEMBER" }: ExpensesTableProps) {
    const [view, setView] = useState<'list' | 'block'>('list')
    const [sortKey, setSortKey] = useState<SortKey>('date')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isEmailing, setIsEmailing] = useState(false)

    const sortedExpenses = [...initialExpenses].sort((a, b) => {
        let aValue: any = a[sortKey]
        let bValue: any = b[sortKey]

        if (sortKey === 'trip') {
            aValue = a.trip?.name || ''
            bValue = b.trip?.name || ''
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
    })

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDirection('asc')
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
            alert(`Sent receipt requests for ${result.count} expenses.`)
            setSelectedIds(new Set())
        } else {
            alert("Failed to send emails.")
        }
    }

    const handleTripRequest = async () => {
        setIsEmailing(true)
        const result = await sendTripReportRequest(Array.from(selectedIds))
        setIsEmailing(false)
        if (result.success) {
            alert(`Sent trip report requests for ${result.count} expenses.`)
            setSelectedIds(new Set())
        } else {
            alert("Failed to send emails.")
        }
    }

    const isAdmin = userRole === 'ADMIN'

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center mb-6">
                {selectedIds.size > 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 flex-1 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 px-3 py-1.5 rounded-md shadow-md"
                    >
                        <span className="font-semibold text-xs ml-2">{selectedIds.size} selected</span>
                        <div className="h-4 w-px bg-white/20 dark:bg-black/10" />
                        <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-2 hover:bg-white/10 dark:hover:bg-black/5 text-zinc-100 dark:text-zinc-900" onClick={handleReceiptRequest} disabled={isEmailing}>
                                {isEmailing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Receipt className="mr-1.5 h-3.5 w-3.5" />}
                                Get Receipts
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-2 hover:bg-white/10 dark:hover:bg-black/5 text-zinc-100 dark:text-zinc-900" onClick={handleTripRequest} disabled={isEmailing}>
                                {isEmailing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plane className="mr-1.5 h-3.5 w-3.5" />}
                                Get Report
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex-1"></div>
                )}

                <div className="flex justify-end gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md">
                    <Button
                        variant={view === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setView('list')}
                        title="List View"
                        className={cn(
                            "h-7 w-7 rounded-sm transition-all duration-200",
                            view === 'list' ? "bg-white dark:bg-black shadow-sm text-black dark:text-white" : "text-muted-foreground hover:bg-white/50"
                        )}
                    >
                        <LayoutList className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant={view === 'block' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setView('block')}
                        title="Block View"
                        className={cn(
                            "h-7 w-7 rounded-sm transition-all duration-200",
                            view === 'block' ? "bg-white dark:bg-black shadow-sm text-black dark:text-white" : "text-muted-foreground hover:bg-white/50"
                        )}
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {view === 'list' ? (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table className="min-w-[1000px] text-sm table-fixed">
                            <TableHeader>
                                <TableRow className="bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                                    <TableHead className="w-[50px] p-2 pl-4"><Checkbox checked={selectedIds.size === initialExpenses.length && initialExpenses.length > 0} onCheckedChange={toggleSelectAll} className="rounded-[4px] border-zinc-300" /></TableHead>
                                    <TableHead className="w-[120px] h-10 text-xs font-medium text-zinc-500">Date</TableHead>
                                    <TableHead className="w-[200px] h-10 text-xs font-medium text-zinc-500">Merchant</TableHead>
                                    <TableHead className="w-[150px] h-10 text-xs font-medium text-zinc-500">Category</TableHead>
                                    <TableHead className="w-[150px] h-10 text-xs font-medium text-zinc-500">Trip</TableHead>
                                    <TableHead className="w-[120px] h-10 text-xs font-medium text-zinc-500">Status</TableHead>
                                    <TableHead className="w-[140px] h-10 text-xs font-medium text-zinc-500">Submitted By</TableHead>
                                    <TableHead className="w-[120px] h-10 text-right text-xs font-medium text-zinc-500">Amount</TableHead>
                                    <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedExpenses.map((expense) => (
                                    <TableRow key={expense.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/50 transition-colors group">
                                        <TableCell className="p-2 pl-4"><Checkbox checked={selectedIds.has(expense.id)} onCheckedChange={() => toggleSelect(expense.id)} className="rounded-[4px] border-zinc-300" /></TableCell>
                                        <TableCell className="text-sm text-zinc-600 dark:text-zinc-400 font-mono py-3 truncate">
                                            <Link href={`/expenses/${expense.id}`} className="block hover:underline">
                                                {new Date(expense.date).toLocaleDateString()}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Link href={`/expenses/${expense.id}`} className="block group-hover:text-primary transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0", getExpenseIcon(expense.category, expense.merchant).bg, getExpenseIcon(expense.category, expense.merchant).color)}>
                                                        {(() => {
                                                            const Icon = getExpenseIcon(expense.category, expense.merchant).icon;
                                                            return <Icon className="h-4 w-4" />
                                                        })()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-zinc-900 dark:text-zinc-200 truncate pr-2">{expense.merchant}</span>
                                                        {expense.locationName && <div className="flex items-center text-[10px] text-zinc-400 mt-0.5"><MapPin className="h-2.5 w-2.5 mr-0.5" /> <span className="truncate max-w-[150px]">{expense.locationName}</span></div>}
                                                    </div>
                                                </div>
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-zinc-500 py-3 text-sm truncate">
                                            <Link href={`/expenses/${expense.id}`} className="block">
                                                {expense.category}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            {expense.trip ? (
                                                <Link href={`/trips/${expense.trip.name ? expense.trip.name : ''}`} className="flex items-center gap-1.5 text-xs text-primary dark:text-primary bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-full w-fit max-w-[140px] truncate hover:underline">
                                                    <Plane className="h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate">{expense.trip.name}</span>
                                                </Link>
                                            ) : <span className="text-zinc-300 text-sm">-</span>}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Link href={`/expenses/${expense.id}`} className="block">
                                                <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border w-fit",
                                                    expense.status === 'APPROVED' ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800/30" :
                                                        expense.status === 'REJECTED' ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-800/30" :
                                                            "bg-zinc-50 text-zinc-600 border-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                                                )}>
                                                    {expense.status}
                                                </div>
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-zinc-600 dark:text-zinc-400 py-3 text-sm truncate">
                                            <Link href={`/expenses/${expense.id}`} className="block">
                                                {expense.user?.name || expense.user?.email || 'Unknown'}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-zinc-900 dark:text-zinc-100 py-3 tabular-nums">
                                            <Link href={`/expenses/${expense.id}`} className="block">
                                                {SafeMath.format(expense.amount, expense.currency)}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedExpenses.length === 0 ? (
                        <div className="col-span-full h-40 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-zinc-200 rounded-lg bg-zinc-50/50">
                            <span className="font-medium text-sm">No expenses found</span>
                        </div>
                    ) : (
                        sortedExpenses.map((expense) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={expense.id}
                                className="group relative bg-card rounded-[24px] border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-200 flex flex-col cursor-pointer overflow-hidden"
                            >
                                <Link href={`/expenses/${expense.id}`} className="block flex-1">
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                                                expense.status === 'APPROVED' ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800/30" :
                                                    expense.status === 'REJECTED' ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-800/30" :
                                                        "bg-zinc-50 text-zinc-600 border-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                                            )}>
                                                {expense.status}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="font-bold text-lg text-zinc-900 dark:text-white line-clamp-1 mb-0.5">{expense.merchant}</div>
                                            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                                                <span>{expense.category}</span>
                                                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                                <span>{new Date(expense.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-xs text-zinc-400 mt-1">
                                                by {expense.user?.name || expense.user?.email || 'Unknown'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 pt-0 mt-auto border-t border-zinc-50 dark:border-zinc-800/50">
                                        <div className="flex justify-between items-end pt-3">
                                            <div className="flex flex-col gap-1 text-xs text-zinc-500">
                                                {expense.trip ? (
                                                    <div className="flex items-center gap-1 text-primary dark:text-primary font-medium">
                                                        <Plane className="h-3 w-3" />
                                                        <span className="truncate max-w-[100px]">{expense.trip.name}</span>
                                                    </div>
                                                ) : <span className="opacity-50">No Trip</span>}
                                            </div>

                                            <div className="font-mono font-semibold text-lg text-zinc-900 dark:text-white tabular-nums">
                                                {SafeMath.format(expense.amount, expense.currency)}
                                            </div>
                                        </div>
                                    </div>
                                </Link>

                                {/* Checkbox - positioned outside Link */}
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all data-[state=checked]:opacity-100">
                                    <Checkbox checked={selectedIds.has(expense.id)} onCheckedChange={() => toggleSelect(expense.id)} className="w-4 h-4 rounded-[4px] border-zinc-300" />
                                </div>

                                {/* Action Overlay Button */}
                                <div className="absolute top-12 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ExpenseActions expense={expense} />
                                </div>

                            </motion.div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
