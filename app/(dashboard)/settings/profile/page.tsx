import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProfileStats } from "@/components/profile/ProfileStats"
import { AvatarSelector } from "@/components/profile/AvatarSelector"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileForm } from "./form" // Local import since we correspond to the same dir
import { decrypt } from "@/lib/encryption"

export default async function ProfilePage() {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            expenses: {
                select: { amount: true, createdAt: true }
            }
        }
    })

    if (!user) redirect("/login")

    // Decrypt phone number for display
    let plainPhone = user.phoneNumber
    if (plainPhone && plainPhone.includes(':')) {
        try {
            plainPhone = decrypt(plainPhone)
        } catch (e) {
            console.error("Failed to decrypt phone number", e)
        }
    }

    // Calculate Stats
    const totalSpend = user.expenses.reduce((acc, curr) => acc + curr.amount, 0)

    // Calculate Streak (consecutive days with an expense)
    const sortedDates = user.expenses
        .map(e => new Date(e.createdAt).toDateString())
        .filter((value, index, self) => self.indexOf(value) === index) // Unique days
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Descending

    let streak = 0
    if (sortedDates.length > 0) {
        const today = new Date().toDateString()
        const lastEntry = sortedDates[0]

        // If last entry is today or yesterday, streak is valid
        const dayDiff = (new Date(today).getTime() - new Date(lastEntry).getTime()) / (1000 * 3600 * 24)
        if (dayDiff <= 1) {
            streak = 1
            for (let i = 0; i < sortedDates.length - 1; i++) {
                const curr = new Date(sortedDates[i])
                const next = new Date(sortedDates[i + 1])
                const diff = (curr.getTime() - next.getTime()) / (1000 * 3600 * 24)
                if (diff === 1) {
                    streak++
                } else {
                    break
                }
            }
        }
    }

    const stats = {
        totalSpend,
        goalsMet: 12, // Placeholder for now
        streakDays: streak,
        joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header Section */}
            <div className="relative rounded-[24px] overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 h-48 md:h-64 shadow-lg">
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute bottom-0 left-0 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
                    <div className="relative z-10">
                        <AvatarSelector
                            currentAvatar={user.avatarUrl}
                            userName={user.name || "User"}
                        // Server action handling is internal to AvatarSelector
                        />
                    </div>

                    <div className="text-white text-center md:text-left flex-1">
                        <h1 className="text-3xl font-bold">{user.name}</h1>
                        <p className="text-blue-100 dark:text-gray-300">@{user.email?.split('@')[0]}</p>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <ProfileStats stats={stats} />

            {/* Main Content Tabs */}
            <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="edit">Edit Profile</TabsTrigger>
                    <TabsTrigger value="overview">About</TabsTrigger>
                    <TabsTrigger value="achievements">Badges</TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="mt-6">
                    <Card className="border-border shadow-sm">
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your profile details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProfileForm user={{
                                ...user,
                                image: user.avatarUrl,
                                phoneNumber: plainPhone
                            }} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="overview" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>About Me</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground leading-relaxed">
                                {user.bio || "No bio yet. Tell us about your financial journey!"}
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="achievements" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Badges & Achievements</CardTitle>
                            <CardDescription>Earn badges as you hit your financial goals.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                {/* Placeholders for badges */}
                                <div className="p-4 border rounded-xl bg-muted/20 opacity-50 grayscale transition-all hover:scale-105">
                                    <div className="text-4xl mb-2">🚀</div>
                                    <h4 className="font-bold text-sm">Early Bird</h4>
                                    <p className="text-xs text-muted-foreground">Joined in Beta</p>
                                </div>
                                <div className={`p-4 border rounded-xl transition-all hover:scale-105 ${totalSpend > 1000 ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-muted/20 opacity-50 grayscale'}`}>
                                    <div className="text-4xl mb-2">💸</div>
                                    <h4 className="font-bold text-sm">Savvy Spender</h4>
                                    <p className="text-xs text-muted-foreground">Tracked $1k+</p>
                                </div>
                                <div className={`p-4 border rounded-xl transition-all hover:scale-105 ${streak > 7 ? 'bg-amber-500/10 border-amber-500/50' : 'bg-muted/20 opacity-50 grayscale'}`}>
                                    <div className="text-4xl mb-2">🔥</div>
                                    <h4 className="font-bold text-sm">Week Streak</h4>
                                    <p className="text-xs text-muted-foreground">7 Days Active</p>
                                </div>
                                <div className="p-4 border rounded-xl bg-muted/20 opacity-50 grayscale transition-all hover:scale-105">
                                    <div className="text-4xl mb-2">🎯</div>
                                    <h4 className="font-bold text-sm">Goal Crusher</h4>
                                    <p className="text-xs text-muted-foreground">Hit 5 Budgets</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
