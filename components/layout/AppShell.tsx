"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNav } from "@/components/layout/BottomNav"
import { Header } from "@/components/layout/Header"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { ExpenseForm } from "@/components/expenses/ExpenseForm"
import { PennyButton } from "@/components/penny/PennyButton"
import { PennyChat, PennySheet } from "@/components/penny/PennySidePanel"
import { usePenny } from "@/components/penny/PennyContext"
import { useExpensePanel } from "@/components/expenses/ExpensePanelContext"
import { WhaleMascotBackground } from "@/components/ui/WhaleMascotBackground"

interface AppShellProps {
    children: React.ReactNode
    userRole?: string
    canReconcile?: boolean
    trips: Array<any> // Using any to avoid complex type matching for now, or import Trip type
    user: any // Header user prop
    organizationName?: string
}

export function AppShell({ children, userRole, canReconcile, trips, user, organizationName }: AppShellProps) {
    const { isOpen: isPennyOpen } = usePenny()
    const { isOpen: isExpenseOpen, open: openExpensePanel, close: closeExpensePanel, toggle: toggleExpensePanel, file: expenseFile } = useExpensePanel()
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background relative">
            {/* Artistic Background with Whale Mascot */}
            <WhaleMascotBackground />
            {/* Desktop Sidebar */}
            <Sidebar
                userRole={userRole}
                canReconcile={canReconcile}
                className="hidden md:flex h-full border-r bg-sidebar shrink-0"
                onAddExpense={() => toggleExpensePanel()}
                organizationName={organizationName}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <Header user={user} userRole={userRole} canReconcile={canReconcile} />

                {/* Main View Container (Flex Row for Desktop Panel) */}
                <div className="flex-1 flex overflow-hidden relative">
                    {/* Page Content */}
                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-[env(safe-area-inset-top)] pb-32 md:pb-[env(safe-area-inset-bottom)] scrollbar-hide overscroll-contain">
                        {children}
                    </main>

                    {/* Desktop Expense Panel (Slide-in / Push) */}
                    <aside
                        className={`hidden md:block transition-all duration-300 ease-in-out border-l bg-background shadow-xl z-20 overflow-hidden ${isExpenseOpen ? 'w-[400px] opacity-100' : 'w-0 opacity-0 border-none'}`}
                    >
                        <div className="w-[400px] h-full flex flex-col">
                            {/* We can just render ExpenseForm directly here, full height */}
                            <div className="flex-1 overflow-y-auto">
                                <ExpenseForm
                                    trips={trips}
                                    initialFile={expenseFile}
                                    onCancel={closeExpensePanel}
                                    onSuccess={() => {
                                        closeExpensePanel()
                                        // Ideally we don't assume page refresh is needed if we use SWR or React Query,
                                        // but for now let's keep it simple or let the form handle it.
                                        // The form calls router.refresh() on success usually.
                                    }}
                                    isSlideOver={true}
                                />
                            </div>
                        </div>
                    </aside>

                    {/* Desktop Penny Panel (Slide-in) */}
                    <aside
                        className={`hidden md:block transition-all duration-300 ease-in-out border-l bg-background shadow-xl z-20 overflow-hidden ${isPennyOpen ? 'w-[400px] opacity-100' : 'w-0 opacity-0 border-none'
                            }`}
                    >
                        <div className="w-[400px] h-full">
                            <PennyChat />
                        </div>
                    </aside>
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="md:hidden">
                    <BottomNav onAddExpense={() => openExpensePanel()} />
                </div>
            </div>

            {/* Mobile Expense Sheet (Still use Sheet for mobile) */}
            {isMobile && (
                <Sheet open={isExpenseOpen} onOpenChange={(open) => !open && closeExpensePanel()}>
                    <SheetContent
                        side="right"
                        className="w-full sm:max-w-md p-0 flex flex-col bg-background dark:bg-[#0A1628] shadow-2xl border-l"
                    >
                        <SheetTitle className="sr-only">Add New Expense</SheetTitle>
                        <div className="w-full h-full flex flex-col">
                            <ExpenseForm
                                trips={trips}
                                initialFile={expenseFile}
                                onCancel={closeExpensePanel}
                                onSuccess={closeExpensePanel}
                                isSlideOver={true}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            )}

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
