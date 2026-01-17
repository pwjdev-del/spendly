"use client"

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SpendingChartProps {
    data: {
        name: string
        total: number
    }[]
}

export function SpendingChart({ data }: SpendingChartProps) {
    return (
        <Card className="h-full border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800/50">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    Spending Over Time
                </CardTitle>
                <CardDescription className="hidden">
                    Your total expenses for the last 30 days.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-0 pt-4">
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            stroke="#A1A1AA"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#A1A1AA"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                            dx={-10}
                        />
                        <Tooltip
                            cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }}
                            contentStyle={{
                                backgroundColor: 'var(--background)',
                                borderColor: 'var(--border)',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.1)'
                            }}
                            itemStyle={{ color: '#8b5cf6', fontSize: '12px', fontWeight: 'bold' }}
                            labelStyle={{ color: 'var(--muted-foreground)', fontSize: '11px', marginBottom: '4px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
