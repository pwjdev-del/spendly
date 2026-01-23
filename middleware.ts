import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';

export default NextAuth(authConfig).auth((req) => {
    const response = NextResponse.next();

    // Security Headers
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    // HSTS: 2 years, include subdomains, preload
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');
    // Referrer Policy: Strict Origin When Cross-Origin is safer than Origin When Cross-Origin
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy
    // We allow 'unsafe-eval' and 'unsafe-inline' for scripts due to Next.js requirements in many environments.
    // Ideally, we would use a nonce-based approach, but that requires significant config changes.
    // specific allowed domains can be added to connect-src or img-src as needed.
    const csp = [
        "default-src 'self'",
        "img-src 'self' data: blob: https:",
        // script-src: 'unsafe-eval' is often needed for dev mode or certain libs. 'unsafe-inline' for Next.js scripts.
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://accounts.google.com https://www.google.com https://www.gstatic.com",
        "worker-src 'self' blob:",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data:",
        "connect-src 'self' https: wss:", // wss: for HMR in dev
        "frame-src 'self' https://accounts.google.com", // For Google Auth
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self' https://accounts.google.com", // For Auth actions
        "upgrade-insecure-requests"
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);

    // Permissions Policy
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=*, browsing-topics=(), payment=()');

    // Cross Domain Policies
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

    // WAF: Blocked IP Check (Simplified)
    /*
    const ip = req.ip || "127.0.0.1";
    // Place block check here if needed.
    */

    return response;
});

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
