"use client"

import { toggleStatus, deleteRecurringExpense } from "@/app/actions/subscriptions"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Trash2, CalendarClock, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Subscription {
    id: string
    merchant: string
    category: string
    amount: number
    currency: string
    frequency: string
    status: string
    nextDueDate: Date
}

export function SubscriptionsList({ subscriptions }: { subscriptions: Subscription[] }) {
    const router = useRouter()

    const handleToggle = async (id: string, currentStatus: string) => {
        try {
            await toggleStatus(id, currentStatus)
            toast.success("Status updated")
            router.refresh()
        } catch {
            toast.error("Failed to update status")
        }
    }

    const handleDelete = async (id: string, merchant: string) => {
        if (!confirm(`Stop subscription for ${merchant}? This cannot be undone.`)) return

        try {
            await deleteRecurringExpense(id)
            toast.success("Subscription removed")
            router.refresh()
        } catch {
            toast.error("Failed to remove subscription")
        }
    }

    if (subscriptions.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No active subscriptions</h3>
                <p className="text-muted-foreground">Add your recurring software, rent, or utilities here.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subscriptions.map((sub) => (
                <div key={sub.id} className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-semibold text-lg">{sub.merchant}</h3>
                                <p className="text-sm text-muted-foreground">{sub.category}</p>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-xl">
                                    {sub.currency === 'USD' ? '$' : sub.currency}
                                    {sub.amount.toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground uppercase">{sub.frequency}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 mb-6">
                            <CalendarClock className="h-4 w-4" />
                            Next due: {new Date(sub.nextDueDate).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={sub.status === 'ACTIVE'}
                                onCheckedChange={() => handleToggle(sub.id, sub.status)}
                            />
                            <span className={`text-sm font-medium ${sub.status === 'ACTIVE' ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {sub.status}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(sub.id, sub.merchant)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}
