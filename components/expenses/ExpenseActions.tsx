"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Trash, Trash2 } from "lucide-react"
import Link from "next/link"
import { deleteExpense } from "@/app/actions/expenses"
import { useTransition } from "react"
import { useRouter } from "next/navigation"

interface ExpenseActionsProps {
    expense: {
        id: string
        status: string
    }
}

export function ExpenseActions({ expense }: ExpenseActionsProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const isLocked = expense.status === "APPROVED"

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this expense?")) {
            startTransition(async () => {
                try {
                    await deleteExpense(expense.id)
                } catch (error) {
                    alert(error instanceof Error ? error.message : "Failed to delete")
                }
            })
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem disabled={isLocked} asChild>
                    {isLocked ? (
                        <span className="flex items-center text-muted-foreground cursor-not-allowed">
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </span>
                    ) : (
                        <Link href={`/expenses/${expense.id}/edit`} className="flex items-center">
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                    )}
                </DropdownMenuItem>

                <DropdownMenuItem
                    disabled={isLocked || isPending}
                    onClick={(e) => {
                        e.preventDefault()
                        if (!isLocked) handleDelete()
                    }}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isPending ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
