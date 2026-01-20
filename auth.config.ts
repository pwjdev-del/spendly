import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/expenses') ||
                nextUrl.pathname.startsWith('/approvals') ||
                nextUrl.pathname.startsWith('/cards');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                // Determine if we are on a public page that logged-in users shouldn't necessarily see?
                // For now, we allow them to see Landing Page if they explicitly go there, 
                // BUT app/page.tsx redirects them to /dashboard anyway.
                // So no extra logic needed here unless we want to block /login strictly.

                if (nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')) {
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
            }
            return true;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
