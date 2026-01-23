/**
 * Force Logout Script - Clears all sessions and cookies
 */

import prisma from "../lib/prisma"

async function forceLogout() {
    console.log('🔓 Force logging out all users...')

    // Delete all sessions from database
    try {
        const result = await (prisma as any).session.deleteMany({})
        console.log(`✅ Deleted ${result.count} session(s) from database`)
    } catch (e) {
        console.log('⚠️  Session table might not exist, skipping...')
    }

    console.log('\n📋 Next steps:')
    console.log('1. Close your browser tab at localhost:3001')
    console.log('2. Clear browser cookies for localhost (Cmd+Shift+Delete on Mac)')
    console.log('3. Reopen http://localhost:3001')
    console.log('4. Sign in with patelkathan134@gmail.com')
    console.log('5. Approvals and Reconciliation will now appear in sidebar!')
}

forceLogout()
    .then(() => {
        console.log('\n✅ Session cleared!')
        process.exit(0)
    })
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
