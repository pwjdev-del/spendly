"use client"

import { approveExpense, rejectExpense } from "@/app/actions/expenses"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

export function ApprovalButtons({ id }: { id: string }) {
    return (
        <div className="flex items-center justify-end gap-2">
            <form action={async () => await approveExpense(id)}>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50">
                    <Check className="h-4 w-4" />
                </Button>
            </form>
            <form action={async () => await rejectExpense(id)}>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                    <X className="h-4 w-4" />
                </Button>
            </form>
        </div>
    )
}
