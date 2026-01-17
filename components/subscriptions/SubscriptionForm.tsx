"use client"

import { useTransition } from "react"
import { createRecurringExpense } from "@/app/actions/subscriptions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

export function SubscriptionForm() {
    const [isPending, startTransition] = useTransition()

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subscription
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Recurring Expense</DialogTitle>
                </DialogHeader>
                <form action={(formData) => {
                    startTransition(async () => {
                        const res = await createRecurringExpense(null, formData)
                        if (res.message === "success") {
                            toast.success("Subscription added")
                            // Close dialog by simulating escape or using state (simplification: toast & refresh happens via action)
                        } else {
                            toast.error(res.message)
                        }
                    })
                }} className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Merchant</Label>
                        <Input name="merchant" placeholder="Netflix, AWS, etc." required />
                    </div>

                    <div className="flex gap-4">
                        <div className="grid gap-2 flex-1">
                            <Label>Amount</Label>
                            <Input name="amount" type="number" step="0.01" placeholder="0.00" required />
                        </div>
                        <div className="grid gap-2 flex-1">
                            <Label>Currency</Label>
                            <Select name="currency" defaultValue="USD">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="GBP">GBP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Category</Label>
                        <Input name="category" placeholder="Software, Utilities..." required />
                    </div>

                    <div className="grid gap-2">
                        <Label>Frequency</Label>
                        <Select name="frequency" defaultValue="MONTHLY">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="WEEKLY">Weekly</SelectItem>
                                <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                                <SelectItem value="YEARLY">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Next Due Date</Label>
                        <Input name="nextDueDate" type="date" required />
                    </div>

                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? "Adding..." : "Create Subscription"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
