"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SafeMath } from "@/lib/math"
import { MerchantLogo } from "@/components/expenses/MerchantLogo"
import { ExpenseActions } from "@/components/expenses/ExpenseActions"
import { Plane, Receipt, User } from "lucide-react"

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

interface ExpenseCardProps {
    expense: Expense
}

export function ExpenseCard({ expense }: ExpenseCardProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="group relative aspect-[4/3] rounded-[2rem] overflow-hidden cursor-pointer"
        >
            {/* Background Mesh */}
            <div className="absolute inset-0 bg-gradient-to-br from-card/80 to-card/30 backdrop-blur-xl border border-white/10 transition-all duration-300 group-hover:border-indigo-500/30 group-hover:shadow-xl group-hover:shadow-indigo-500/10" />

            {/* Soft Glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 blur-[60px] rounded-full transition-opacity opacity-0 group-hover:opacity-100" />

            <Link href={`/expenses/${expense.id}`} className="absolute inset-0 p-6 flex flex-col z-10">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <MerchantLogo
                        merchant={expense.merchant}
                        category={expense.category}
                        className="w-14 h-14 rounded-2xl shadow-lg border border-white/10 group-hover:scale-105 transition-transform"
                    />

                    {/* Status Pill */}
                    <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm",
                        expense.status === 'APPROVED'
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : expense.status === 'REJECTED'
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-white/5 text-slate-400 border-white/10"
                    )}>
                        {expense.status}
                    </div>
                </div>

                {/* Content - Pushed to bottom */}
                <div className="mt-auto space-y-3">
                    <div>
                        <h3 className="text-xl font-bold text-white leading-tight line-clamp-1 group-hover:text-indigo-400 transition-colors">
                            {expense.merchant}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-medium">
                            <span className="truncate max-w-[50%]">{expense.category}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                            <span>{new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                    </div>

                    {/* Footer Row */}
                    <div className="pt-4 border-t border-white/5 flex items-end justify-between">
                        {/* User or Trip */}
                        <div className="flex items-center gap-2">
                            {expense.trip ? (
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                                    <Plane className="w-3 h-3" />
                                    <span className="truncate max-w-[80px]">{expense.trip.name}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-white border border-white/10">
                                        {(expense.user.name || 'U').charAt(0)}
                                    </div>
                                    <span className="truncate max-w-[80px]">{expense.user.name?.split(' ')[0]}</span>
                                </div>
                            )}
                        </div>

                        {/* Amount */}
                        <div className="font-mono text-2xl font-bold text-white tracking-tight tabular-nums group-hover:text-emerald-400 transition-colors">
                            {SafeMath.format(expense.amount, expense.currency)}
                        </div>
                    </div>
                </div>
            </Link>

            {/* Hover Actions Overlay */}
            <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <ExpenseActions expense={expense} />
            </div>
        </motion.div>
    )
}
