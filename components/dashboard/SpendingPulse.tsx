"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, TrendingUp, TrendingDown } from "lucide-react"
import { motion } from "framer-motion"
import { SafeMath } from "@/lib/math"

interface SpendingPulseProps {
    dailyTotal: number
    weeklyAverage: number // Could be passed in or calculated
}

export function SpendingPulse({ dailyTotal, weeklyAverage = 5000 }: SpendingPulseProps) {
    // 5000 cents ($50) as arbitrary daily average placeholder if not provided
    const percentage = Math.min((dailyTotal / weeklyAverage) * 100, 100)
    const isHigh = dailyTotal > weeklyAverage

    return (
        <Card className="h-full border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <CardHeader className="pb-2 border-b border-zinc-100 dark:border-zinc-800/50 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Daily Pulse
                </CardTitle>
                <div className="text-xs font-medium text-zinc-400">Today</div>
            </CardHeader>
            <CardContent className="pt-6 relative">
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                            {SafeMath.format(dailyTotal, 'USD')}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                            {isHigh ? (
                                <span className="text-red-500 flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" /> Above Avg</span>
                            ) : (
                                <span className="text-emerald-500 flex items-center"><TrendingDown className="w-3 h-3 mr-0.5" /> Normal</span>
                            )}
                        </div>
                    </div>

                    {/* Visual Pulse Circle */}
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            {/* Background Circle */}
                            <path
                                className="text-zinc-100 dark:text-zinc-800"
                                d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            {/* Progress Circle */}
                            <motion.path
                                className="text-primary"
                                d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeDasharray={`${percentage}, 100`}
                                initial={{ strokeDasharray: "0, 100" }}
                                animate={{ strokeDasharray: `${percentage}, 100` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                            {Math.round(percentage)}%
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1 }}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
