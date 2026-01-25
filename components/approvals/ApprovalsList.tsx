"use client"

import { useState } from "react"
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from "framer-motion"
import { approveExpense, rejectExpense } from "@/app/actions/expenses"
import { Button } from "@/components/ui/button"
import { Check, X, Trash2, CheckCircle2, XCircle } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ApprovalButtons } from "@/components/dashboard/ApprovalButtons"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Expense {
    id: string
    date: Date
    merchant: string
    category: string
    amount: number
    currency: string
    user: {
        name: string | null
        email: string | null
    }
}

function SwipeableCard({ expense, onApprove, onReject }: { expense: Expense, onApprove: (id: string) => void, onReject: (id: string) => void }) {
    const x = useMotionValue(0)
    const opacity = useTransform(x, [-100, -50, 0, 50, 100], [0, 1, 1, 1, 0])
    const background = useTransform(x, [-100, 0, 100], ["rgba(239, 68, 68, 0.2)", "rgba(255,255,255,0)", "rgba(34, 197, 94, 0.2)"])

    // Icons scale up when swiping
    const checkScale = useTransform(x, [50, 100], [0.5, 1.2])
    const xScale = useTransform(x, [-100, -50], [1.2, 0.5])

    const handleDragEnd = async (_: any, info: PanInfo) => {
        if (info.offset.x > 100) {
            onApprove(expense.id)
        } else if (info.offset.x < -100) {
            onReject(expense.id)
        }
    }

    return (
        <div className="relative mb-3 overflow-hidden rounded-lg border bg-background">
            {/* Background Actions */}
            <div className="absolute inset-0 flex items-center justify-between px-6">
                <motion.div style={{ scale: checkScale, opacity: x }}>
                    <div className="flex items-center gap-2 text-green-600 font-bold">
                        <CheckCircle2 className="h-8 w-8" />
                        Approve
                    </div>
                </motion.div>
                <div className="flex-1" />
                <motion.div style={{ scale: xScale, opacity: useTransform(x, (v) => -v) }}>
                    <div className="flex items-center gap-2 text-red-600 font-bold">
                        Reject
                        <XCircle className="h-8 w-8" />
                    </div>
                </motion.div>
            </div>

            {/* Foreground Card */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -100, right: 100 }}
                onDragEnd={handleDragEnd}
                style={{ x, background }}
                className="relative z-10 bg-card p-4 shadow-sm touch-pan-y"
                whileTap={{ cursor: "grabbing" }}
            >
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className="font-semibold text-lg">{expense.merchant}</h4>
                        <p className="text-sm text-muted-foreground">{expense.category}</p>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-lg">
                            {expense.currency === 'USD' ? '$' : expense.currency}
                            {(expense.amount / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {new Date(expense.date).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                        by {expense.user.name || expense.user.email}
                    </span>
                    <div className="text-xs text-muted-foreground italic">
                        Swipe to action
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export function ApprovalsList({ expenses }: { expenses: Expense[] }) {
    const router = useRouter()
    const [optimisticExpenses, setOptimisticExpenses] = useState(expenses)

    const handleApprove = async (id: string) => {
        const expense = optimisticExpenses.find(e => e.id === id)
        setOptimisticExpenses(prev => prev.filter(e => e.id !== id))
        toast.success(`Approved ${expense?.merchant}`)

        try {
            await approveExpense(id)
            router.refresh()
        } catch (e) {
            toast.error("Failed to approve")
            setOptimisticExpenses(prev => [...prev, expense!])
        }
    }

    const handleReject = async (id: string) => {
        const expense = optimisticExpenses.find(e => e.id === id)
        setOptimisticExpenses(prev => prev.filter(e => e.id !== id))
        toast.info(`Rejected ${expense?.merchant}`)

        try {
            await rejectExpense(id)
            router.refresh()
        } catch (e) {
            toast.error("Failed to reject")
            setOptimisticExpenses(prev => [...prev, expense!])
        }
    }

    if (optimisticExpenses.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground border rounded-lg bg-muted/10">
                No pending approvals.
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Mobile View: Swipeable Cards */}
            <div className="md:hidden space-y-4">
                <div className="text-sm text-center text-muted-foreground/70 tracking-widest uppercase text-[10px] font-bold">
                    Swipe Actions Enabled
                </div>
                <AnimatePresence mode="popLayout">
                    {optimisticExpenses.map(expense => (
                        <SwipeableCard
                            key={expense.id}
                            expense={expense}
                            onApprove={handleApprove}
                            onReject={handleReject}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Desktop View: Approval Command Deck */}
            <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {optimisticExpenses.map((expense) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5, filter: "blur(10px)", transition: { duration: 0.2 } }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            key={expense.id}
                            className="group relative overflow-hidden rounded-[24px] border border-border bg-card shadow-lg transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
                        >
                            {/* Card Decoration - Subtle Gradient Blob */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/5 to-orange-500/5 rounded-full blur-[60px] pointer-events-none -z-10 group-hover:from-primary/10 group-hover:to-orange-500/10 transition-colors duration-500"></div>

                            <div className="p-6 space-y-6">
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
                                            {expense.user.name ? expense.user.name.charAt(0).toUpperCase() : "U"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{expense.user.name || expense.user.email}</p>
                                            <p className="text-xs font-medium text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] uppercase font-bold tracking-wider text-amber-500">
                                        Pending
                                    </div>
                                </div>

                                {/* Main Content */}
                                <div>
                                    <h3 className="text-2xl font-bold tracking-tight text-foreground mb-1 group-hover:text-primary transition-colors">{expense.merchant}</h3>
                                    <p className="text-sm font-medium text-muted-foreground line-clamp-1">{expense.category}</p>
                                </div>

                                <div className="py-4 border-t border-white/5 flex justify-between items-end">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Amount</span>
                                    <span className="text-3xl font-mono font-bold text-foreground group-hover:scale-105 transition-transform origin-right">
                                        ${(expense.amount / 100).toFixed(2)}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className="border-red-500/20 bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all font-semibold"
                                        onClick={() => handleReject(expense.id)}
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Reject
                                    </Button>
                                    <Button
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all font-bold"
                                        onClick={() => handleApprove(expense.id)}
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Approve
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {optimisticExpenses.length === 0 && (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-3xl bg-white/5">
                        <CheckCircle2 className="h-12 w-12 text-green-500/50 mb-4" />
                        <h3 className="text-xl font-bold text-white/80">All Caught Up!</h3>
                        <p className="text-white/40">No pending approvals remaining.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
