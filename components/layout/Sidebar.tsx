"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Receipt, CheckSquare, CreditCard, Settings, Menu, PieChart, Calendar, MapPin, Scale, Plus, ListTodo, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SignOutButton } from "@/components/auth/SignOutButton"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useState, useEffect } from "react"

const sidebarNavItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        iconClass: "icon-dashboard",
        roles: ["ADMIN", "MEMBER", "SUBMITTER", "DELEGATE", "APPROVER", "AUDITOR"],
    },
    {
        title: "To-do",
        href: "/todo",
        icon: ListTodo,
        iconClass: "icon-todo",
        roles: ["ADMIN", "MEMBER", "SUBMITTER", "DELEGATE", "APPROVER", "AUDITOR"],
    },
    {
        title: "Calendar",
        href: "/calendar",
        icon: Calendar,
        iconClass: "icon-calendar",
        roles: ["ADMIN", "MEMBER", "SUBMITTER", "DELEGATE", "APPROVER", "AUDITOR"],
    },
    {
        title: "Trips",
        href: "/trips",
        icon: MapPin,
        iconClass: "icon-trips",
        roles: ["ADMIN", "MEMBER", "SUBMITTER", "DELEGATE", "APPROVER", "AUDITOR"],
    },
    {
        title: "Expense Transactions",
        href: "/expenses",
        icon: Receipt,
        iconClass: "icon-expenses",
        roles: ["ADMIN", "MEMBER", "SUBMITTER", "DELEGATE", "APPROVER", "AUDITOR"],
    },
    {
        title: "Approvals",
        href: "/approvals",
        icon: CheckSquare,
        iconClass: "icon-approvals",
        roles: ["ADMIN", "APPROVER", "AUDITOR"],
    },
    {
        title: "Reconciliation",
        href: "/reconciliation",
        icon: Scale,
        iconClass: "icon-reconciliation",
        roles: ["ADMIN", "APPROVER", "AUDITOR"],
    },
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onNavigate?: () => void
    onAddExpense?: () => void
    userRole?: string
    canReconcile?: boolean
    organizationName?: string
}

function SidebarContent({ className, onNavigate, onAddExpense, userRole = "MEMBER", canReconcile = false, organizationName }: SidebarProps & { onAddExpense?: () => void }) {
    const pathname = usePathname()

    // Filter nav items based on user role
    const normalizedRole = userRole === 'MEMBER' ? 'SUBMITTER' : userRole

    const filteredNavItems = sidebarNavItems.filter(item => {
        return item.roles.includes(normalizedRole) || item.roles.includes(userRole)
    })

    return (
        <div className={cn("pb-12 w-full h-full bg-sidebar flex flex-col", className)}>
            <div className="space-y-4 py-4 flex-1">
                <div className="px-4 py-2">
                    <Link href="/" className="mb-6 flex flex-col items-center gap-3 px-2 group">
                        {/* New Spendly Horizontal Logo */}
                        {/* Consistently Branded Sidebar Logo */}
                        <div className="flex items-center gap-3 py-1 scale-110 origin-left">
                            <div className="relative h-14 w-14 shrink-0">
                                <Image
                                    src="/sia-mascot.png"
                                    alt="Spendly"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                                spendly
                            </span>
                        </div>

                        {/* Dynamic Organization Name Pill */}
                        <div className="w-full max-w-[180px] px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20 text-center">
                            <span className="text-xs font-bold text-white tracking-wide truncate block">
                                {(organizationName || "YOUR SPACE").toUpperCase()}
                            </span>
                        </div>
                    </Link>
                    <div className="space-y-1">
                        {filteredNavItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                            return (
                                <Button
                                    key={item.href}
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start mb-1 rounded-xl h-11 transition-all duration-200 group relative overflow-hidden",
                                        isActive
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border shadow-sm"
                                            : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                                    )}
                                    asChild
                                    {...(onNavigate ? { onClick: onNavigate } : {})}
                                >
                                    <Link href={item.href}>
                                        {isActive && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                                        )}
                                        <item.icon className={cn("mr-3 h-5 w-5 transition-transform group-hover:scale-110", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-primary")} />
                                        <span className={cn("font-medium", isActive ? "text-sidebar-primary" : "")}>{item.title}</span>
                                    </Link>
                                </Button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {onAddExpense && (
                <div className="px-4 mb-6 mt-auto">
                    <Button
                        onClick={onAddExpense}
                        className="w-full bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/20 border-0 h-12 rounded-xl text-base font-semibold tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]"
                        size="lg"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Add Expense
                    </Button>
                </div>
            )}
        </div>
    )
}

export function Sidebar({ className, userRole = "MEMBER", canReconcile = false, onAddExpense, organizationName }: SidebarProps) {
    return (
        <div className={cn("hidden md:flex flex-col w-64 h-[calc(100vh-2rem)] m-4 rounded-2xl border shadow-xl bg-sidebar/80 backdrop-blur-xl sticky top-4 overflow-hidden", className)}>
            <SidebarContent userRole={userRole} canReconcile={canReconcile} onAddExpense={onAddExpense} organizationName={organizationName} />
        </div>
    )
}

export function MobileSidebar({ userRole = "MEMBER", canReconcile = false, organizationName }: { userRole?: string, canReconcile?: boolean, organizationName?: string }) {
    const [open, setOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
        return (
            <Button variant="ghost" size="icon" className="md:hidden w-11 h-11">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
            </Button>
        )
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden w-11 h-11">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r w-64">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SidebarContent onNavigate={() => setOpen(false)} userRole={userRole} canReconcile={canReconcile} organizationName={organizationName} />
            </SheetContent>
        </Sheet>
    )
}
