"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { updateUserPreferences } from "@/app/actions/settings"
import { Calendar, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function CalendarSettings({ initialEnabled = false }: { initialEnabled?: boolean }) {
    const [enabled, setEnabled] = useState(initialEnabled)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleToggle = async (checked: boolean) => {
        setEnabled(checked)
        setIsLoading(true)

        const result = await updateUserPreferences({ enableTimeTravel: checked })

        if (result.error) {
            toast.error(result.error)
            setEnabled(!checked) // Revert on error
        } else {
            toast.success(checked ? "Time Travel enabled" : "Time Travel disabled")
            router.refresh()
        }
        setIsLoading(false)
    }

    return (
        <div className="rounded-[24px] border border-border bg-card shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-indigo-500" />
                        Calendar Logic
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Configure how your calendar works</p>
                </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-900/10">
                <div className="space-y-1">
                    <Label htmlFor="time-travel" className="text-base font-semibold flex items-center gap-2">
                        Smart Forecasting (Time Travel)
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    </Label>
                    <p className="text-sm text-muted-foreground max-w-[500px]">
                        Project future balances based on your recurring expenses.
                        When enabled, the calendar will show <span className="text-red-500 font-bold">Danger Zones</span> if you are projected to go negative.
                    </p>
                </div>
                <Switch
                    id="time-travel"
                    checked={enabled}
                    onCheckedChange={handleToggle}
                    disabled={isLoading}
                    className="data-[state=checked]:bg-indigo-600"
                />
            </div>
        </div>
    )
}
