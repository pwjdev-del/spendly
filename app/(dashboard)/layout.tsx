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

        // 🔍 DEBUG: Identify which account is logged in
        console.log('[LAYOUT DEBUG] ============================================')
        console.log('[LAYOUT DEBUG] session.user.email:', session?.user?.email)
        console.log('[LAYOUT DEBUG] session.user.id:', session?.user.id)
        console.log('[LAYOUT DEBUG] dbUser.role:', dbUser?.role)
        console.log('[LAYOUT DEBUG] Expected: patelkathan134@gmail.com with ADMIN role')
        console.log('[LAYOUT DEBUG] ============================================')
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
