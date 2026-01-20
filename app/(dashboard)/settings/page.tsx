import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AppearanceSettings } from "@/components/appearance-settings"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, User, Mail, Shield } from "lucide-react"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { OrganizationSettings } from "@/components/settings/OrganizationSettings"

export default async function SettingsPage() {
    const session = await auth()
    const user = await prisma.user.findUnique({
        where: { email: session?.user?.email! },
        select: {
            name: true,
            email: true,
            image: true,
            role: true,
            organization: {
                select: {
                    name: true
                }
            }
        }
    })
    const userRole = user?.role || "MEMBER"

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>

            {/* Profile Section */}
            <div className="rounded-[24px] border border-border bg-card shadow-sm overflow-hidden relative group">
                {/* Decorative Blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none -z-10 group-hover:bg-primary/10 transition-colors duration-500"></div>

                <div className="p-8 border-b border-border">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Profile
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Update your personal information</p>
                </div>

                <div className="p-8 space-y-8">
                    <div className="flex items-start gap-8">
                        <div className="relative group/avatar cursor-pointer">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-indigo-500/20 border-4 border-card">
                                {user?.image ? (
                                    <img src={user.image} alt={user.name || "User"} className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    (user?.name?.[0] || "U").toUpperCase()
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-sm">
                                <Camera className="h-6 w-6 text-white" />
                            </div>
                        </div>

                        <div className="grid gap-6 flex-1 max-w-xl">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Display Name</Label>
                                <Input
                                    id="name"
                                    defaultValue={user?.name || ""}
                                    className="bg-background border-input focus:border-primary/50 h-12"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        defaultValue={user?.email || ""}
                                        disabled
                                        className="pl-10 bg-muted/50 border-input opacity-70 h-12"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border">
                        <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white font-bold h-11 px-8 rounded-xl">
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>

            {/* Organization Settings (Admin Only) */}
            {userRole === 'ADMIN' && (
                <OrganizationSettings initialName={user?.organization?.name || "Your Space"} />
            )}

            {/* Appearance Section */}
            <div className="rounded-[24px] border border-border bg-card shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-pink-500 shadow-[0_0_10px_var(--pink-500)] animate-pulse" />
                            Appearance
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">Customize the interface experience</p>
                    </div>
                    <ModeToggle />
                </div>
                <AppearanceSettings />
            </div>

            {/* Family Management (Admin Only) */}
            {userRole === 'ADMIN' && (
                <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/5 shadow-lg p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none -z-10"></div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Family Management
                            </h2>
                            <p className="text-sm text-muted-foreground">Manage family members, roles, and permissions.</p>
                        </div>
                        <Button variant="outline" asChild className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 font-bold h-11 px-6 rounded-xl">
                            <Link href="/settings/family">Manage Access</Link>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
