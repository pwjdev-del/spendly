"use client"

import { updateMonthlyLimit, resetMonthlyLimit } from "@/app/actions/budgets"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useFormStatus } from "react-dom"

function SaveButton() {
    const { pending } = useFormStatus()
    return (
        <Button disabled={pending}>
            {pending ? "Saving..." : "Update Limit"}
        </Button>
    )
}

interface BudgetsPageProps {
    spent: number
    limit: number
}

export default function BudgetsPageClient({ spent, limit }: BudgetsPageProps) {
    const percent = Math.min((spent / limit) * 100, 100)
    const radius = 85
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percent / 100) * circumference

    // Determine color based on usage
    const getColor = (p: number) => {
        if (p < 75) return "text-emerald-500 shadow-emerald-500/50"
        if (p < 90) return "text-amber-500 shadow-amber-500/50"
        return "text-red-500 shadow-red-500/50"
    }

    const colorClass = getColor(percent)
    const remaining = limit - spent

    return (
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Left Column: Visualizer */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-orange-500/10 rounded-[32px] blur-xl -z-10 group-hover:blur-2xl transition-all"></div>

                <Card className="h-full bg-white/40 dark:bg-zinc-900/50 backdrop-blur-3xl border-zinc-200/50 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden relative">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>

                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            Budget Protocol
                        </CardTitle>
                        <CardDescription>Live spending telemetry</CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col items-center justify-center py-8 relative z-10">
                        {/* Gauge Container */}
                        <div className="relative h-64 w-64">
                            {/* Inner Glow */}
                            <div className={`absolute inset-0 rounded-full blur-[80px] opacity-20 ${colorClass.replace('text-', 'bg-')}`}></div>

                            <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl" viewBox="0 0 200 200">
                                {/* Track */}
                                <circle
                                    cx="100"
                                    cy="100"
                                    r={radius}
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    className="text-zinc-100 dark:text-zinc-800"
                                />
                                {/* Progress Arc */}
                                <circle
                                    cx="100"
                                    cy="100"
                                    r={radius}
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    className={`${colorClass.split(" ")[0]} transition-all duration-1000 ease-out`}
                                    style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
                                />
                            </svg>

                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold font-mono tracking-tighter">
                                    {percent.toFixed(0)}<span className="text-lg text-muted-foreground">%</span>
                                </span>
                                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Used</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 w-full mt-8">
                            <div className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-black/5 dark:border-white/5 backdrop-blur-sm">
                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Spent</div>
                                <div className="text-2xl font-bold text-zinc-900 dark:text-white">${spent.toFixed(2)}</div>
                            </div>
                            <div className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-black/5 dark:border-white/5 backdrop-blur-sm">
                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Remaining</div>
                                <div className={`text-2xl font-bold ${remaining < 0 ? 'text-red-500' : 'text-zinc-900 dark:text-white'}`}>
                                    ${remaining.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Controls */}
            <div className="flex flex-col gap-6">
                <Card className="bg-white/40 dark:bg-zinc-900/50 backdrop-blur-3xl border-zinc-200/50 dark:border-white/10 rounded-[32px] shadow-xl">
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>Adjust financial parameters</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={updateMonthlyLimit} className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="limit" className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Monthly Limit ($)</Label>
                                <div className="relative">
                                    <Input
                                        id="limit"
                                        name="limit"
                                        type="number"
                                        placeholder={limit.toFixed(2)}
                                        step="1"
                                        required
                                        className="h-14 text-2xl font-mono bg-white/50 dark:bg-black/20 border-zinc-200 dark:border-white/10 rounded-xl px-4 focus:ring-2 focus:ring-primary/50 transition-all font-bold"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">USD</div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Set a realistic ceiling to trigger alerts and visual warnings.
                                </p>
                            </div>
                            <SaveButton />
                        </form>

                        <div className="relative flex py-6 items-center">
                            <div className="flex-grow border-t border-black/5 dark:border-white/5" />
                            <span className="flex-shrink-0 mx-4 text-muted-foreground text-[10px] uppercase tracking-widest font-bold">Presets</span>
                            <div className="flex-grow border-t border-black/5 dark:border-white/5" />
                        </div>

                        <form action={resetMonthlyLimit}>
                            <Button variant="outline" type="submit" className="w-full h-12 rounded-xl bg-transparent border-dashed border-2 hover:bg-zinc-100 dark:hover:bg-white/5 hover:border-solid transition-all text-muted-foreground hover:text-foreground">
                                Reset to Default ($5,000)
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
