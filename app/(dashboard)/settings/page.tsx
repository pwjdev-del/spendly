import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AppearanceSettings } from "@/components/appearance-settings"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export default async function SettingsPage() {
    const session = await auth()
    const user = await prisma.user.findUnique({
        where: { email: session?.user?.email! },
        select: { role: true }
    })
    const userRole = user?.role || "MEMBER"

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Appearance</h2>
                <div className="flex items-center justify-between mb-6">
                    <div className="space-y-0.5">
                        <div className="text-base font-medium text-foreground">Theme</div>
                        <div className="text-sm text-muted-foreground">Customize the look of the application.</div>
                    </div>
                    <ModeToggle />
                </div>
                <AppearanceSettings />
            </div>

            {userRole === 'ADMIN' && (
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Family Management</h2>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="text-sm font-medium">Family Members</div>
                            <div className="text-sm text-muted-foreground">Manage your family group and invite members.</div>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/settings/family">Manage Family</Link>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
