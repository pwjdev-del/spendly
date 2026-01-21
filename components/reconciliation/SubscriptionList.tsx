"use client"

import { format } from "date-fns"
import { MoreHorizontal, Calendar, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface Subscription {
    id: string
    merchant: string
    amount: number
    currency: string
    frequency: string
    nextDueDate: Date
    status: string
    category: string
}

export function SubscriptionList({ subscriptions }: { subscriptions: Subscription[] }) {
    if (subscriptions.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-card/30 rounded-3xl border border-dashed border-border/50">
                No subscriptions found. Try the Scanner or Wizard above!
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg ml-2">Active Subscriptions ({subscriptions.length})</h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {subscriptions.map((sub) => (
                    <div key={sub.id} className="group relative bg-card/40 hover:bg-card/60 border border-border/50 hover:border-primary/20 p-5 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg backdrop-blur-sm">

                        <div className="flex justify-between items-start mb-4">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-bold text-lg text-primary shadow-inner">
                                {sub.merchant[0]}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-500">Cancel Subscription</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between items-baseline">
                                <h4 className="font-bold text-foreground truncate">{sub.merchant}</h4>
                                <span className="font-mono font-bold text-lg">${sub.amount.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground capitalize flex items-center gap-1.5">
                                <CreditCard className="h-3 w-3" /> {sub.frequency.toLowerCase()}
                            </p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Due {format(new Date(sub.nextDueDate), "MMM d")}</span>
                            </div>
                            <Badge variant={sub.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] h-5">
                                {sub.status}
                            </Badge>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
