"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Receipt, MapPin, CheckSquare, Camera } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface BottomNavProps {
    onAddExpense: () => void
}

export function BottomNav({ onAddExpense }: BottomNavProps) {
    const pathname = usePathname()

    const navItems = [
        {
            title: "Home",
            href: "/",
            icon: Home,
        },
        {
            title: "Trips",
            href: "/trips",
            icon: MapPin,
        },
        {
            title: "Expenses",
            href: "/expenses",
            icon: Receipt,
        },
        {
            title: "Approvals",
            href: "/approvals",
            icon: CheckSquare,
        },
    ]

    // Split items to place FAB in middle
    const firstHalf = navItems.slice(0, 2)
    const secondHalf = navItems.slice(2)

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-4 h-16">
                {firstHalf.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
                            pathname === item.href
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="text-[10px] font-medium">{item.title}</span>
                    </Link>
                ))}

                <div className="relative -top-6">
                    <Button
                        onClick={onAddExpense}
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white border-4 border-background"
                    >
                        <Camera className="h-7 w-7" />
                        <span className="sr-only">Scan Expense</span>
                    </Button>
                </div>

                {secondHalf.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
                            pathname === item.href
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="text-[10px] font-medium">{item.title}</span>
                    </Link>
                ))}
            </div>
        </div>
    )
}
