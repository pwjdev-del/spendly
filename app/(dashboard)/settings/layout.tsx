"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { User, Palette, LayoutDashboard, CheckSquare, Calendar, MapPin, Receipt, CheckCircle, Scale, Building2, Users } from "lucide-react"

const tabs = [
    // General
    { name: "Profile", href: "/settings/profile", icon: User },
    { name: "Appearance", href: "/settings/appearance", icon: Palette },
    { name: "Family & Org", href: "/settings/family", icon: Users },
    // Modules
    { name: "Dashboard", href: "/settings/dashboard", icon: LayoutDashboard },
    { name: "To-do", href: "/settings/todo", icon: CheckSquare },
    { name: "Calendar", href: "/settings/calendar", icon: Calendar },
    { name: "Trips", href: "/settings/trips", icon: MapPin },
    { name: "Transactions", href: "/settings/transactions", icon: Receipt },
    { name: "Approvals", href: "/settings/approvals", icon: CheckCircle },
    { name: "Reconciliation", href: "/settings/reconciliation", icon: Scale },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-border">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
                    const Icon = tab.icon

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap",
                                isActive
                                    ? "bg-primary/10 text-primary shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                            {tab.name}
                        </Link>
                    )
                })}
            </div>

            <div className="min-h-[400px]">
                {children}
            </div>
        </div>
    )
}
