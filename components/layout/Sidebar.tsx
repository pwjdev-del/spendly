"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Receipt, CheckSquare, CreditCard, Settings, Menu, PieChart, Calendar, MapPin, Scale, Plus, ListTodo } from "lucide-react"
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
        roles: ["ADMIN", "MEMBER", "SUBMITTER", "DELEGATE", "APPROVER", "AUDITOR"],
    },
    {
        title: "To-do",
        href: "/todo",
        icon: ListTodo,
        roles: ["ADMIN", "MEMBER", "SUBMITTER", "DELEGATE", "APPROVER", "AUDITOR"],
    },
    {
        title: "Calendar",
        href: "/calendar",
        icon: Calendar,
        roles: ["ADMIN", "MEMBER", "SUBMITTER", "DELEGATE", "APPROVER", "AUDITOR"],
    },
    {
        title: "Trips",
        href: "/trips",
        icon: MapPin,
        roles: ["ADMIN", "MEMBER", "SUBMITTER", "DELEGATE", "APPROVER", "AUDITOR"],
    },
    {
        title: "Expense Transactions",
        href: "/expenses",
        icon: Receipt,
        roles: ["ADMIN", "MEMBER", "SUBMITTER", "DELEGATE", "APPROVER", "AUDITOR"],
    },
    {
        title: "Approvals",
        href: "/approvals",
        icon: CheckSquare,
        roles: ["ADMIN", "APPROVER", "AUDITOR"],
    },
    {
        title: "Reconciliation",
        href: "/reconciliation",
        icon: Scale,
        roles: ["ADMIN", "APPROVER", "AUDITOR"],
    },
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onNavigate?: () => void
    onAddExpense?: () => void
    userRole?: string
    canReconcile?: boolean
}

function SidebarContent({ className, onNavigate, onAddExpense, userRole = "MEMBER", canReconcile = false }: SidebarProps & { onAddExpense?: () => void }) {
    const pathname = usePathname()

    // Filter nav items based on user role
    const normalizedRole = userRole === 'MEMBER' ? 'SUBMITTER' : userRole

    const filteredNavItems = sidebarNavItems.filter(item => {
        return item.roles.includes(normalizedRole) || item.roles.includes(userRole)
    })

    return (
        <div className={cn("pb-12 w-full h-full bg-sidebar flex flex-col", className)}>
            <div className="space-y-4 py-4 flex-1">
                <div className="px-3 py-2">
                    <Link href="/" className="mb-6 flex justify-center px-4">
                        <Image
                            src="/logo-icon-transparent.png"
                            alt="Kharcho"
                            width={200}
                            height={200}
                            className="object-contain w-full h-auto"
                            unoptimized
                            priority
                        />
                    </Link>
                    <div className="space-y-1">
                        {filteredNavItems.map((item) => (
                            <Button
                                key={item.href}
                                variant={(pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))) ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start transition-all duration-300 mb-1",
                                    (pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)))
                                        ? "bg-primary/10 text-primary shadow-[0_0_20px_-5px_var(--primary)] backdrop-blur-md border border-primary/10 hover:bg-primary/15 font-medium translate-x-1"
                                        : "hover:bg-white/5 hover:translate-x-1"
                                )}
                                asChild
                                {...(onNavigate ? { onClick: onNavigate } : {})}
                            >
                                <Link href={item.href}>
                                    <item.icon className={cn("mr-2 h-4 w-4", (pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))) ? "text-primary animate-pulse" : "text-muted-foreground")} />
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {onAddExpense && (
                <div className="px-4 mb-4 mt-auto">
                    <Button
                        onClick={onAddExpense}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
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

export function Sidebar({ className, userRole = "MEMBER", canReconcile = false, onAddExpense }: SidebarProps) {
    return (
        <div className={cn("hidden md:flex flex-col w-64 h-[calc(100vh-2rem)] m-4 rounded-2xl border shadow-xl bg-sidebar/80 backdrop-blur-xl sticky top-4 overflow-hidden", className)}>
            <SidebarContent userRole={userRole} canReconcile={canReconcile} onAddExpense={onAddExpense} />
        </div>
    )
}

export function MobileSidebar({ userRole = "MEMBER", canReconcile = false }: { userRole?: string, canReconcile?: boolean }) {
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
                <SidebarContent onNavigate={() => setOpen(false)} userRole={userRole} canReconcile={canReconcile} />
            </SheetContent>
        </Sheet>
    )
}
