"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNav } from "@/components/layout/BottomNav"
import { Header } from "@/components/layout/Header"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ExpenseForm } from "@/components/expenses/ExpenseForm"
import { PennyButton } from "@/components/penny/PennyButton"
import { PennyChat, PennySheet } from "@/components/penny/PennySidePanel"
import { usePenny } from "@/components/penny/PennyContext"

interface AppShellProps {
    children: React.ReactNode
    userRole?: string
    canReconcile?: boolean
    trips: Array<any> // Using any to avoid complex type matching for now, or import Trip type
    user: any // Header user prop
}

export function AppShell({ children, userRole, canReconcile, trips, user }: AppShellProps) {
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
    const { isOpen } = usePenny()
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

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

                {/* Main View Container (Flex Row for Desktop Panel) */}
                <div className="flex-1 flex overflow-hidden relative">
                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-[env(safe-area-inset-top)] pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-[env(safe-area-inset-bottom)]">
                        {children}
                    </main>

                    {/* Desktop Penny Panel (Slide-in) */}
                    <aside
                        className={`hidden md:block transition-all duration-300 ease-in-out border-l bg-background shadow-xl z-20 overflow-hidden ${isOpen ? 'w-[400px] opacity-100' : 'w-0 opacity-0 border-none'
                            }`}
                    >
                        <div className="w-[400px] h-full">
                            <PennyChat />
                        </div>
                    </aside>
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="md:hidden">
                    <BottomNav onAddExpense={() => setIsAddExpenseOpen(true)} />
                </div>
            </div>

            {/* Global Add Expense Dialog */}
            <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                <DialogContent className="max-w-md w-full max-h-[90vh] h-full md:h-auto overflow-hidden p-0 border-none bg-transparent shadow-none" aria-describedby={undefined}>
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

            {/* Penny Components */}
            <PennyButton />

            {/* Mobile Penny Sheet (Hidden on Desktop) */}
            {isMobile && (
                <div className="md:hidden">
                    <PennySheet />
                </div>
            )}
        </div>
    )
}
