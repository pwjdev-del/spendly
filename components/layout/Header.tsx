"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, User } from "lucide-react"
import { handleSignOut } from "@/app/actions/signout"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LayoutDashboard } from "lucide-react"
import { MobileSidebar } from "@/components/layout/Sidebar"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import Image from "next/image"

interface HeaderProps {
    user?: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
    userRole?: string
    canReconcile?: boolean
    organizationName?: string
}

import { useState, useEffect } from "react"

export function Header({ user, userRole = "MEMBER", canReconcile = false, organizationName }: HeaderProps) {
    const [isMounted, setIsMounted] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const userInitials = user?.name
        ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
        : "U"

    // Helper to get title
    const getPageTitle = () => {
        if (!pathname) return "Dashboard"
        if (pathname === '/') return "Dashboard"
        if (pathname.startsWith('/expenses/new')) return "New Expense"
        if (pathname.startsWith('/expenses')) return "Expense Transactions"
        if (pathname.startsWith('/trips')) return "Trips"
        if (pathname.startsWith('/calendar')) return "Calendar"
        if (pathname.startsWith('/approvals')) return "Approvals"
        if (pathname.startsWith('/reconciliation')) return "Reconciliation"
        if (pathname.startsWith('/settings')) return "Settings"
        return "Dashboard"
    }

    const title = getPageTitle()

    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-[env(safe-area-inset-top)] transition-all">
            <div className="flex h-16 md:h-14 items-center px-6 gap-4">
                <MobileSidebar userRole={userRole} canReconcile={canReconcile} organizationName={organizationName} />
                <div className="flex items-center gap-2 md:hidden">
                    <Image
                        src="/sia-mascot.png"
                        alt="Spendly"
                        width={44}
                        height={44}
                        className="h-11 w-11 object-contain"
                        unoptimized
                    />
                </div>
                <div className="hidden md:flex items-center gap-2 font-semibold">
                    {/* Icon could be dynamic too, but for now just showing title or generic icon */}
                    <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                    <span className="capitalize">{title}</span>
                </div>

                <div className="ml-auto w-full flex-1 md:w-auto md:flex-none">
                    {/* Add search later */}
                </div>
                {isMounted && <NotificationBell />}
                {isMounted ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.image || undefined} alt="@user" />
                                    <AvatarFallback>{userInitials}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email || "user@example.com"}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem asChild>
                                <Link href="/settings/billing" className="cursor-pointer">
                                    Billing
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/settings" className="cursor-pointer">
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSignOut()}>
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.image || undefined} alt="@user" />
                            <AvatarFallback>{userInitials}</AvatarFallback>
                        </Avatar>
                    </Button>
                )}
            </div>
        </header>
    )
}
