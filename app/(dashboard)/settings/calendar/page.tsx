import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { CalendarSettings } from "@/components/settings/CalendarSettings"
import { redirect } from "next/navigation"

export default async function CalendarSettingsPage() {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { preferences: true }
    })

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-xl font-bold">Calendar Configuration</h2>
                <p className="text-sm text-muted-foreground">Manage time travel and view settings.</p>
            </div>

            <CalendarSettings initialEnabled={(() => {
                try {
                    const prefs = JSON.parse(user?.preferences || "{}")
                    return prefs.enableTimeTravel || false
                } catch { return false }
            })()} />
        </div>
    )
}
