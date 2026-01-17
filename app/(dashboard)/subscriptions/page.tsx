import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SubscriptionsList } from "@/components/subscriptions/SubscriptionsList"
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm"

export default async function SubscriptionsPage() {
    const session = await auth()
    if (!session?.user) redirect("/login") // Only redirect if not logged in

    // Allow personal subscriptions (no organizationId) or organization subscriptions
    const whereClause: any = {
        OR: [
            { userId: session.user.id },
            ...(session.user.organizationId ? [{ organizationId: session.user.organizationId }] : [])
        ]
    }

    const subscriptions = await prisma.recurringExpense.findMany({
        where: whereClause,
        orderBy: { nextDueDate: 'asc' }
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
                    <p className="text-muted-foreground">Manage your recurring expenses and bills.</p>
                </div>
                <SubscriptionForm />
            </div>

            <SubscriptionsList subscriptions={subscriptions} />
        </div>
    )
}
