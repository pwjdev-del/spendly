"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Trophy, TrendingUp, Sparkles, Coins } from "lucide-react"
import { DashboardData } from "@/components/dashboard/WidgetRegistry"
import { AnimatedCounter } from "@/components/ui/AnimatedCounter"

export function RewardsWidget({ data }: { data: DashboardData }) {
    // Mock data for "Total Saved" since we don't track it in DB yet, only points.
    // In reality, points = 50% of savings, so Savings = Points * 2 (in cents) / 100
    const points = data.rewardsBalance || 0;
    const estSavings = (points * 2) / 100;

    return (
        <Card className="h-full border border-border bg-card shadow-sm relative overflow-hidden group widget-interactive">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-300 pointer-events-none">
                <Trophy className="w-24 h-24" />
            </div>

            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                            Your Rewards
                        </h3>
                        <div className="mt-2 text-4xl font-bold text-foreground tracking-tight number-glow flex items-baseline gap-1">
                            <AnimatedCounter value={points} decimals={0} duration={1500} />
                            <span className="text-base font-medium text-muted-foreground">pts</span>
                        </div>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Coins className="w-6 h-6 text-yellow-500" />
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                        You've saved the company approximately <span className="text-emerald-500 font-bold">${estSavings.toFixed(2)}</span>
                    </p>
                    <div className="w-full bg-secondary/50 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 w-[60%]" />
                    </div>
                </div>
            </CardContent>

            {/* Background Glow */}
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none group-hover:bg-yellow-500/10 transition-colors duration-500" />
        </Card>
    )
}
