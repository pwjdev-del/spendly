"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowRight, XCircle, CheckCircle } from "lucide-react"
import { DashboardData } from "@/components/dashboard/WidgetRegistry"
import { Button } from "@/components/ui/button"

export function SubscriptionAlertWidget({ data }: { data: DashboardData }) {
    if (!data.subscriptionAnomalies || data.subscriptionAnomalies.length === 0) {
        return (
            <Card className="h-full border border-border bg-card shadow-sm flex items-center justify-center p-6 text-muted-foreground border-dashed">
                <div className="text-center opacity-50">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">No subscription issues detected</p>
                </div>
            </Card>
        )
    }

    return (
        <Card className="h-full border border-destructive/20 bg-destructive/5 shadow-sm relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Subscription Alerts
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="space-y-3">
                    {data.subscriptionAnomalies.map((anomaly: any, i: number) => (
                        <div key={i} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between shadow-sm">
                            <div>
                                <p className="text-sm font-bold text-foreground">{anomaly.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    Price hiked by <span className="text-destructive font-bold">{anomaly.percentChange}%</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    ${(anomaly.oldAmount / 100).toFixed(2)} → ${(anomaly.newAmount / 100).toFixed(2)}
                                </p>
                            </div>
                            <Button size="sm" variant="destructive" className="h-7 text-xs px-2">
                                Review
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
