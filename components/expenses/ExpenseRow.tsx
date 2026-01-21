"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SafeMath } from "@/lib/math"
import { Checkbox } from "@/components/ui/checkbox"
import { MerchantLogo } from "@/components/expenses/MerchantLogo"
import { ExpenseActions } from "@/components/expenses/ExpenseActions"
import { Plane, Receipt, CreditCard } from "lucide-react"

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
    user: {
        name: string | null
        email: string | null
    }
    trip?: {
        name: string
    } | null
}

interface ExpenseRowProps {
    expense: Expense
    selected: boolean
    onSelect: (id: string) => void
    isSelectionMode: boolean
}

export function ExpenseRow({ expense, selected, onSelect, isSelectionMode }: ExpenseRowProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.002, x: 2 }}
            className={cn(
                "group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                "bg-card/40 backdrop-blur-sm hover:bg-card/60 hover:shadow-lg hover:shadow-indigo-500/5",
                selected
                    ? "border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_20px_-10px_rgba(99,102,241,0.3)]"
                    : "border-white/5 hover:border-white/10"
            )}
        >
            {/* Selection Checkbox (Visible on Hover or Selected) */}
            <div className={cn(
                "absolute left-4 z-10 transition-all duration-200",
                isSelectionMode || selected ? "opacity-100 scale-100" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
            )}>
                <Checkbox
                    checked={selected}
                    onCheckedChange={() => onSelect(expense.id)}
                    className="rounded-md border-white/20 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                />
            </div>

            {/* Main Clickable Area */}
            <Link href={`/expenses/${expense.id}`} className={cn(
                "flex-1 flex items-center gap-4 min-w-0 transition-all duration-300",
                (isSelectionMode || selected) ? "pl-8" : "pl-0"
            )}>
                {/* Logo */}
                <div className="shrink-0 relative">
                    <MerchantLogo
                        merchant={expense.merchant}
                        category={expense.category}
                        className="w-12 h-12 rounded-xl shadow-inner border border-white/10"
                    />
                    {expense.status !== 'APPROVED' && (
                        <div className={cn(
                            "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#020617]",
                            expense.status === 'PENDING' ? "bg-amber-500" : "bg-red-500"
                        )} />
                    )}
                </div>

                {/* Info Block */}
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Merchant & Context */}
                    <div className="flex flex-col justify-center gap-0.5">
                        <h3 className="text-base font-semibold text-white truncate leading-tight group-hover:text-indigo-400 transition-colors">
                            {expense.merchant}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="truncate">{expense.category}</span>
                            {expense.trip && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                                    <span className="flex items-center gap-1 text-indigo-400 truncate">
                                        <Plane className="w-3 h-3" />
                                        {expense.trip.name}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Metadata (Hidden on small screens) */}
                    <div className="hidden md:flex items-center justify-end gap-6 text-sm">
                        <span className="text-slate-500 text-xs">
                            {new Date(expense.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </span>
                        <div className="flex items-center gap-2 text-slate-400">
                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] font-bold">
                                {(expense.user.name || 'U').charAt(0)}
                            </div>
                            <span className="text-xs truncate max-w-[80px]">{expense.user.name?.split(' ')[0]}</span>
                        </div>
                    </div>
                </div>

                {/* Amount Block */}
                <div className="text-right shrink-0 min-w-[100px]">
                    <div className={cn(
                        "text-lg font-mono font-bold tracking-tight",
                        // Positive/Negative color logic could go here, treating expenses as neutral or styled
                        "text-emerald-400"
                    )}>
                        {SafeMath.format(expense.amount, expense.currency)}
                    </div>
                    {expense.receiptUrl && (
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500">
                            <Receipt className="w-3 h-3" />
                            <span>Attached</span>
                        </div>
                    )}
                </div>
            </Link>

            {/* Floating Actions (Right) */}
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-4 group-hover:translate-x-0 pl-2">
                <ExpenseActions expense={expense} />
            </div>
        </motion.div>
    )
}
