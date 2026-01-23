/**
 * Quick Fix: Promote current user to ADMIN
 * This script updates the user role to ADMIN for whichever account is logged in
 */

import prisma from "../lib/prisma"

async function promoteToAdmin() {
    console.log('🔧 Promoting user to ADMIN...')

    // Find all users with MEMBER role and update to ADMIN
    const result = await prisma.user.updateMany({
        where: {
            email: {
                contains: 'patel' // Target your email
            }
        },
        data: {
            role: 'ADMIN',
            canReconcile: true // Also enable reconciliation permission
        }
    })

    console.log(`✅ Updated ${result.count} user(s) to ADMIN role`)

    // Verify the update
    const users = await prisma.user.findMany({
        where: {
            email: {
                contains: 'patel'
            }
        },
        select: {
            email: true,
            role: true,
            canReconcile: true
        }
    })

    console.log('📋 Updated user(s):')
    console.table(users)
}

promoteToAdmin()
    .then(() => {
        console.log('✅ Done! Now log out and log back in to refresh your session.')
        process.exit(0)
    })
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
