"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CategoryPieChartProps {
    data: {
        name: string
        value: number
    }[]
}

const COLORS = ['#6366F1', '#8B5CF6', '#D946EF', '#EC4899', '#F43F5E']; // Indigo, Violet, Fuchsia, Pink, Rose

export function CategoryPieChart({ data }: CategoryPieChartProps) {
    return (
        <Card className="h-full border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800/50">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    Spending by Category
                </CardTitle>
                <CardDescription className="hidden">
                    Breakdown of expenses by category.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--background)',
                                    borderColor: 'var(--border)',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    padding: '8px 12px'
                                }}
                                itemStyle={{ color: 'var(--foreground)', fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: '11px', color: '#71717a' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
