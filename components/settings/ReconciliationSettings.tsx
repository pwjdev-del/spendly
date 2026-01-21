"use client"

import { useState } from "react"
import { Sparkles, Check, Loader2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { updateReconciliationPreferences } from "@/app/actions/user" // We need to create this
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ReconciliationSettingsProps {
    initialEnabled: boolean
}

export function ReconciliationSettings({ initialEnabled }: ReconciliationSettingsProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [enabled, setEnabled] = useState(initialEnabled)
    const router = useRouter()

    async function onSave() {
        setIsLoading(true)

        // Assuming we will create a general user preferences update action
        // or a specific one for this.
        const result = await updateReconciliationPreferences(enabled)

        if (result.error) {
            toast.error(result.error)
            // Revert on error
            setEnabled(initialEnabled)
        } else {
            toast.success(enabled ? "Smart Reconciliation Enabled" : "Smart Reconciliation Disabled")
            router.refresh()
        }

        setIsLoading(false)
    }

    return (
        <div className="rounded-[24px] border border-border bg-card shadow-sm overflow-hidden relative group p-8 mb-8">
            {/* Decorative Background */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none -z-10 group-hover:bg-purple-500/10 transition-colors duration-500"></div>

            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        Smart Reconciliation
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Use AI and fuzzy matching to automatically link bank transactions to expenses, even if dates or names don't match exactly.
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    <Switch
                        id="smart-recon"
                        checked={enabled}
                        onCheckedChange={setEnabled}
                    />
                    <Label htmlFor="smart-recon" className="sr-only">Enable Smart Reconciliation</Label>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex justify-end">
                <Button
                    onClick={onSave}
                    disabled={isLoading || enabled === initialEnabled}
                    className="bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/20 text-white font-bold h-10 px-6 rounded-xl"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Check className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
