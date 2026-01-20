import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { AppShell } from "@/components/layout/AppShell"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()
    let userRole = "MEMBER" // Default to most restrictive
    let canReconcile = false

    // Fetch user role and specific fields from database
    let dbUser = null
    if (session?.user?.id) {
        dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                role: true,
                canReconcile: true,
                avatarUrl: true,
                name: true,
                organizationId: true,
                organization: {
                    select: {
                        name: true
                    }
                }
            }
        })
        if (dbUser?.role) {
            userRole = dbUser.role
        }
        if (dbUser?.canReconcile) {
            canReconcile = dbUser.canReconcile
        }
    }

    // Construct a composite user object with latest DB data
    const headerUser = {
        ...session?.user,
        name: dbUser?.name || session?.user?.name,
        image: dbUser?.avatarUrl || session?.user?.image,
    }

    // Fetch active trips for the Add Expense modal
    const trips = await prisma.trip.findMany({
        where: {
            organizationId: dbUser?.organizationId, // Ensure they belong to the same org
            status: { not: "COMPLETED" },
            OR: [
                { userId: session?.user?.id }, // Created by user
                { organizationId: dbUser?.organizationId } // Or visible to org (simplified for now, ideally strictly user's active trips or org active trips)
            ]
        },
        select: {
            id: true,
            name: true,
            tripNumber: true,
            status: true
        },
        orderBy: { startDate: 'desc' }
    })

    return (
        <AppShell
            user={headerUser}
            userRole={userRole}
            canReconcile={canReconcile}
            trips={trips}
            organizationName={dbUser?.organization?.name}
        >
            {children}
        </AppShell>
    )
}
