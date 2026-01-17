import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/expenses') ||
                nextUrl.pathname.startsWith('/approvals') ||
                nextUrl.pathname.startsWith('/cards') ||
                nextUrl.pathname === '/';

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                // Redirect authenticated users to dashboard if they visit login/register
                // REMOVED: This causes a loop if the DB is reset but cookie remains.
                // if (nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')) {
                //     return Response.redirect(new URL('/', nextUrl));
                // }
            }
            return true;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
