"use client"

import { handleSignOut } from "@/app/actions/signout"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function SignOutButton() {
    return (
        <form action={handleSignOut} suppressHydrationWarning>
            <Button variant="ghost" className="w-full justify-start gap-2">
                <LogOut className="h-4 w-4" />
                Log out
            </Button>
        </form>
    )
}
