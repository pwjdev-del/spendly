"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNav } from "@/components/layout/BottomNav"
import { Header } from "@/components/layout/Header"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ExpenseForm } from "@/components/expenses/ExpenseForm"
import { PennyButton } from "@/components/penny/PennyButton"
import { PennySidePanel } from "@/components/penny/PennySidePanel"

interface AppShellProps {
    children: React.ReactNode
    userRole?: string
    canReconcile?: boolean
    trips: Array<any> // Using any to avoid complex type matching for now, or import Trip type
    user: any // Header user prop
}

export function AppShell({ children, userRole, canReconcile, trips, user }: AppShellProps) {
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <Sidebar
                userRole={userRole}
                canReconcile={canReconcile}
                className="hidden md:flex h-full border-r bg-sidebar shrink-0"
                onAddExpense={() => setIsAddExpenseOpen(true)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <Header user={user} userRole={userRole} canReconcile={canReconcile} />

                {/* Main View - Added padding-bottom for BottomNav on mobile */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-[env(safe-area-inset-top)] pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-[env(safe-area-inset-bottom)]">
                    {children}
                </main>

                {/* Mobile Bottom Navigation */}
                <div className="md:hidden">
                    <BottomNav onAddExpense={() => setIsAddExpenseOpen(true)} />
                </div>
            </div>

            {/* Global Add Expense Dialog */}
            <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                <DialogContent className="max-w-md w-full max-h-[90vh] h-full md:h-auto overflow-y-auto p-0 border-none bg-[#FBF7F2] shadow-2xl rounded-[32px] sm:rounded-[32px]" aria-describedby={undefined}>
                    <DialogTitle className="sr-only">Add New Expense</DialogTitle>
                    <div className="w-full h-full">
                        <ExpenseForm
                            trips={trips}
                            onCancel={() => setIsAddExpenseOpen(false)}
                            onSuccess={() => setIsAddExpenseOpen(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Penny AI Assistant */}
            <PennyButton />
            <PennySidePanel />
        </div>
    )
}
