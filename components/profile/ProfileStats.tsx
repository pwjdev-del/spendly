import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, TrendingUp, Target, CalendarDays } from "lucide-react"

interface ProfileStatsProps {
    stats: {
        totalSpend: number;
        goalsMet: number;
        streakDays: number;
        joinDate: string;
    }
}

export function ProfileStats({ stats }: ProfileStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tracked</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${stats.totalSpend.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        Lifetime expenses
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Goals Met</CardTitle>
                    <Target className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.goalsMet}</div>
                    <p className="text-xs text-muted-foreground">
                        Budgets adhered to
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Streak</CardTitle>
                    <Trophy className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.streakDays} Days</div>
                    <Progress value={stats.streakDays % 30 * 3.3} className="h-2 mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                        Keep it up!
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Member Since</CardTitle>
                    <CalendarDays className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.joinDate}</div>
                    <p className="text-xs text-muted-foreground">
                        Spendly Family
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
