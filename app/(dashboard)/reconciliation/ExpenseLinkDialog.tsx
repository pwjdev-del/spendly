"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, CheckCircle2 } from "lucide-react"
import { searchExpenses, manualMatchTransaction } from "@/app/actions/reconcile"
import { cn } from "@/lib/utils"

interface Transaction {
    date: string
    merchant: string
    amount: number
}

interface ExpenseLinkDialogProps {
    transaction: Transaction
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onLinkSuccess: (txId: string) => void
}

export function ExpenseLinkDialog({ transaction, isOpen, onOpenChange, onLinkSuccess }: ExpenseLinkDialogProps) {
    const [query, setQuery] = useState("")
    const [expenses, setExpenses] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isLinking, setIsLinking] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)

    // Initial load
    useEffect(() => {
        if (isOpen) {
            handleSearch("")
            setSelectedId(null)
            setQuery("")
        }
    }, [isOpen])

    const handleSearch = async (q: string) => {
        setIsLoading(true)
        try {
            const results = await searchExpenses(q)
            setExpenses(results)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLink = async () => {
        if (!selectedId) return

        setIsLinking(true)
        try {
            const result = await manualMatchTransaction(
                {
                    ...transaction,
                    // Parse date string to Date object if needed, but action expects Transaction interface 
                    // which usually comes from reconcile.ts as string dates in JSON? 
                    // Let's assume date string is ISO/compatible.
                    date: new Date(transaction.date),
                    description: transaction.merchant,
                    status: 'MATCHED',
                    source: 'BANK',
                    // These are not used for creation logic but needed for type matching if strict
                } as any,
                selectedId
            )

            if (result.success) {
                onLinkSuccess(result.transactionId!)
                onOpenChange(false)
            } else {
                alert("Failed to link")
            }
        } catch (e) {
            console.error(e)
            alert("Error linking transaction")
        } finally {
            setIsLinking(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Link to Expense</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Match <strong className="text-white">{transaction.merchant}</strong> (${transaction.amount.toFixed(2)}) to an existing ledger expense.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search merchant, category, or amount..."
                            className="pl-9 bg-muted/50 focus-visible:ring-primary/50 text-foreground placeholder:text-muted-foreground/50"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSearch(query)
                            }}
                        />
                    </div>

                    <ScrollArea className="h-[200px] border border-border rounded-xl bg-card p-2">
                        {isLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : expenses.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8 text-sm">
                                No pending expenses found.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {expenses.map((expense) => (
                                    <div
                                        key={expense.id}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 text-sm group",
                                            selectedId === expense.id
                                                ? "bg-primary/20 border border-primary/30"
                                                : "hover:bg-accent border border-transparent"
                                        )}
                                        onClick={() => setSelectedId(expense.id)}
                                    >
                                        <div>
                                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{expense.merchant}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(expense.date).toLocaleDateString()} • {expense.category}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono font-bold">${expense.amount.toFixed(2)}</p>
                                            {selectedId === expense.id && <CheckCircle2 className="h-3 w-3 text-primary ml-auto mt-1" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleLink} disabled={!selectedId || isLinking} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                        {isLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Link & Reconcile
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
