"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, Loader2, CheckCircle2, Tag, Calendar, DollarSign } from "lucide-react"
import { createExpense } from "@/app/actions/expenses"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ParsedExpense {
    merchant: string
    amount: string
    category: string
    date: Date
}

export function MagicInput() {
    const [input, setInput] = useState("")
    const [parsed, setParsed] = useState<ParsedExpense | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Simple Regex Parser
    useEffect(() => {
        if (!input.trim()) {
            setParsed(null)
            return
        }

        const parseCommand = (text: string): ParsedExpense => {
            let merchant = ""
            let amount = ""
            let category = "General"
            let date = new Date()

            // 1. Extract Amount ($X.XX or just X.XX)
            const amountMatch = text.match(/\$?(\d+(\.\d{1,2})?)/)
            if (amountMatch) {
                amount = amountMatch[1]
            }

            // 2. Extract Category (word starting with # or usually "for X")
            const catMatch = text.match(/#(\w+)/) || text.match(/for (\w+)/i)
            if (catMatch) {
                category = catMatch[1]
                // Capitalize
                category = category.charAt(0).toUpperCase() + category.slice(1)
            }

            // 3. Extract Merchant (Everything else, roughly)
            // Remove amount and category from string to parse merchant
            let remaining = text
                .replace(/\$?(\d+(\.\d{1,2})?)/, "") // remove amount
                .replace(/#(\w+)/, "") // remove #category
                .replace(/for (\w+)/i, "") // remove "for category"
                .trim()

            // Clean up common prepositions if they appear at start (like "at Starbucks")
            remaining = remaining.replace(/^(at|to|from)\s+/i, "")

            merchant = remaining || "Unknown Merchant"

            // Capitalize Merchant
            merchant = merchant.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

            return { merchant, amount, category, date }
        }

        const result = parseCommand(input)
        // Only show parsed state if we at least have an amount or a merchant
        if (result.amount || (result.merchant && result.merchant !== "Unknown Merchant")) {
            setParsed(result)
        } else {
            setParsed(null)
        }

    }, [input])

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!parsed || !parsed.amount || isSubmitting) return

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("merchant", parsed.merchant)
            formData.append("amount", parsed.amount)
            formData.append("categorySelect", parsed.category)
            formData.append("date", parsed.date.toISOString())
            formData.append("currency", "USD") // Default for now

            // Hack: We need to pass a "force" flag sometimes, but for magic input we assume user wants it
            // We might hit duplicate detection.

            const result = await createExpense(null, formData)

            if ((result as any)?.error) {
                toast.error((result as any).error)
            } else if ((result as any)?.status === "DUPLICATE") {
                toast.warning("Duplicate detected. Please use the full form to resolve.")
                // Ideally we'd show a dialog here, but for MVP we might just clear or redirect
            } else {
                toast.success(`Saved expense at ${parsed.merchant}!`)
                setInput("")
                setParsed(null)
            }
        } catch (err) {
            toast.error("Failed to save expense")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto mb-8 relative z-10">
            <div
                className={cn(
                    "relative group rounded-2xl transition-all duration-300",
                    isFocused ? "bg-white dark:bg-zinc-900 shadow-xl scale-[1.02]" : "bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900"
                )}
            >
                {/* Input Container */}
                <form onSubmit={handleSubmit} className="relative flex items-center p-2">
                    <div className="pl-4 pr-3 text-primary">
                        <Sparkles className={cn("w-5 h-5", isFocused ? "text-primary animate-pulse" : "text-muted-foreground")} />
                    </div>

                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => {
                            // Small delay to allow clicking the button
                            setTimeout(() => setIsFocused(false), 200)
                        }}
                        placeholder="Type 'Starbucks $5.50 for Coffee'..."
                        className="border-none shadow-none focus-visible:ring-0 bg-transparent text-lg h-12 flex-1 placeholder:text-muted-foreground/50"
                    />

                    <AnimatePresence>
                        {input.trim().length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                <Button
                                    size="icon"
                                    className="rounded-xl h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                                    disabled={isSubmitting || !parsed?.amount}
                                    type="submit"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                {/* Live Preview / Parsed Data Cards */}
                <AnimatePresence>
                    {isFocused && parsed && parsed.amount && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            className="overflow-hidden border-t border-dashed border-zinc-200 dark:border-zinc-800"
                        >
                            <div className="p-3 flex gap-4 overflow-x-auto text-sm">
                                {/* Merchant */}
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full shrink-0">
                                    <span className="font-bold text-zinc-700 dark:text-zinc-300">{parsed.merchant}</span>
                                </div>

                                {/* Amount */}
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full shrink-0">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    <span className="font-bold">{parsed.amount}</span>
                                </div>

                                {/* Category */}
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full shrink-0">
                                    <Tag className="w-3.5 h-3.5" />
                                    <span className="font-medium">{parsed.category}</span>
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full shrink-0">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="font-medium">Today</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Helper Text */}
            <AnimatePresence>
                {isFocused && !input && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-4 top-full mt-2 text-xs text-muted-foreground font-medium ml-12"
                    >
                        Try "Uber $24.50" or "Lunch $15 at Burger King"
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    )
}
