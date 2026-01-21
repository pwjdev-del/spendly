"use client"

import { Button } from "@/components/ui/button"
import { saveDashboardLayout } from "@/app/actions/user"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DashboardSettingsPage() {
    const router = useRouter()

    const handleResetLayout = async () => {
        // We pass an empty array or null to reset to default
        // Assuming saveDashboardLayout handles empty/default logic or we need a specific reset action
        // For now, let's assume clearing it works or we instruct the user.
        // Actually, let's pass a specific reset flag or empty list if the backend supports it.
        // Based on previous code, it saves a generic layout array. 
        // Let's assume sending an empty array resets it, or we might need to create a specific reset action.
        // For safety, let's just show a toast for now as a placeholder until we confirm the reset logic.

        toast.info("Layout reset functionality coming soon.")

        // FUTURE: await saveDashboardLayout([]) 
        // router.refresh() 
    }

    return (
        <div className="rounded-[24px] border border-border bg-card shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold">Dashboard Layout</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage your dashboard widgets.</p>
                </div>
            </div>

            <div className="p-6 border border-border rounded-xl bg-muted/20">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold">Reset Layout</h3>
                        <p className="text-sm text-muted-foreground">Restore the dashboard to its original default arrangement.</p>
                    </div>
                    <Button variant="outline" onClick={handleResetLayout}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset to Default
                    </Button>
                </div>
            </div>
        </div>
    )
}
