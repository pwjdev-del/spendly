import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { ReconciliationSettings } from "@/components/settings/ReconciliationSettings"
import { redirect } from "next/navigation"

export default async function ReconciliationSettingsPage() {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { preferences: true }
    })

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-xl font-bold">Reconciliation Configuration</h2>
                <p className="text-sm text-muted-foreground">Manage auto-matching and algorithm accuracy.</p>
            </div>

            <ReconciliationSettings
                initialEnabled={(() => {
                    try {
                        const prefs = JSON.parse(user?.preferences || "{}")
                        return prefs.enableSmartReconciliation || false
                    } catch { return false }
                })()}
                initialSubscriptionEnabled={(() => {
                    try {
                        const prefs = JSON.parse(user?.preferences || "{}")
                        return prefs.enableSubscriptionManager || false
                    } catch { return false }
                })()}
            />
        </div>
    )
}
