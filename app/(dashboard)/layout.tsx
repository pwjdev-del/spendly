import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { AppShell } from "@/components/layout/AppShell"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    try {
        const session = await auth()
        let userRole = "MEMBER" // Default to most restrictive
        let canReconcile = false

        // Fetch user role and specific fields from database
        let dbUser = null
        if (session?.user?.email) {
            dbUser = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: {
                    id: true, // Need ID for trips fetch
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

            // If session exists but DB user is gone (deleted/reset), force logout/redirect
            // This prevents the "broken shell" state
            // We can't use redirect() in a try-catch block easily without it being caught.
            // But if dbUser is null, we shouldn't render the AppShell with missing data.
        }
        if (dbUser?.role) {
            userRole = dbUser.role
        }
        if (dbUser?.canReconcile) {
            canReconcile = dbUser.canReconcile
            console.log('[LAYOUT DEBUG] dbUser.role:', dbUser?.role)
            console.log('[LAYOUT DEBUG] ============================================')
        }

        // Force Login if DB User is completely missing (Stale Session)
        if (session?.user && !dbUser) {
            console.log('[LAYOUT DEBUG] Session valid but DB User missing. Forcing logout/redirect to prevent glitchy state.');
            // We can trigger a signout in client, but here in server layout, we redirect to login
            // Ideally we should sign them out, but redirecting to login is safer than a broken dashboard
            // The middleware should handle this, but if we are here, middleware passed it.
            // We'll trust the flow or use a "force-logout" page if needed.
            // For now, let's treat it as unauthenticated to AppShell safe mode? 
            // No, user wants it FIXED. 
            // The glitch is because User is null.
            // Let's rely on the AppShell handling "Guest" gracefully OR redirect.
            // User complains "Not able to see anything". 
            // Let's redirect to a repair page or login.
            // Using simple redirect for now.
            // actually, we must import redirect from next/navigation
            const { redirect } = require("next/navigation");
            redirect("/api/auth/signout"); // Force a cycle clearing
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
            ...session?.user,
                name:dbUser?.name || session?.user?.name,
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
} catch (e: any) {
    // If it's a redirect (from our logic), let it pass through
    if (e?.digest?.startsWith('NEXT_REDIRECT')) {
        throw e;
    }
    console.error("Dashboard Layout Error:", e);
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900 text-white">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Dashboard Critical Error</h1>
            <div className="bg-gray-800 p-6 rounded-lg max-w-2xl overflow-auto w-full border border-gray-700">
                <p className="font-mono text-sm text-yellow-300 mb-2">Error Message:</p>
                <pre className="text-red-300 mb-4 whitespace-pre-wrap">{e?.message || "Unknown error"}</pre>

                <p className="font-mono text-sm text-yellow-300 mb-2">Stack Trace:</p>
                <pre className="text-xs text-gray-400 whitespace-pre-wrap">{e?.stack || "No stack trace available"}</pre>
            </div>
        </div>
    )
}
}
