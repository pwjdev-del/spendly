import { getNotifications } from "@/app/actions/notifications"
import { NotificationsList } from "@/components/notifications/NotificationsList"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
    const notifications = await getNotifications({ limit: 50 })

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                <p className="text-muted-foreground text-sm">
                    View and manage your alerts and updates
                </p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <NotificationsList initialNotifications={notifications as any[]} />
                </CardContent>
            </Card>
        </div>
    )
}
