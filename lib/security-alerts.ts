import prisma from "@/lib/prisma";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const THRESHOLD_EVENTS = 5;
const THRESHOLD_WINDOW_SECONDS = 60;
const BLOCK_DURATION_HOURS = 1;

export async function sendSecurityAlert(type: string, details: string) {
    if (!SLACK_WEBHOOK_URL) return;

    try {
        await fetch(SLACK_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: `🚨 *Security Alert: ${type}*\n${details}`
            })
        });
    } catch (e) {
        console.error("Failed to send slack alert", e);
    }
}

export async function trackSecurityEvent(ipAddress: string, type: string, details?: string) {
    // 1. Log the event
    await prisma.securityEvent.create({
        data: {
            ipAddress,
            type,
            details
        }
    });

    // 2. Alert immediately for Critical types
    if (type === "SQLI_ATTEMPT" || type === "INTEGER_OVERFLOW") {
        await sendSecurityAlert(type, `IP: ${ipAddress}\nDetails: ${details}`);
    }

    // 3. Check for Rate Limit / Blocking condition
    // Count events from this IP in the last window
    const windowStart = new Date(Date.now() - THRESHOLD_WINDOW_SECONDS * 1000);
    const count = await prisma.securityEvent.count({
        where: {
            ipAddress,
            createdAt: { gte: windowStart }
        }
    });

    if (count >= THRESHOLD_EVENTS) {
        // Block the IP
        await blockIp(ipAddress, `Excessive security events (${count} in ${THRESHOLD_WINDOW_SECONDS}s)`);
    }
}

async function blockIp(ipAddress: string, reason: string) {
    const expiresAt = new Date(Date.now() + BLOCK_DURATION_HOURS * 60 * 60 * 1000);

    // Idempotent upsert
    await prisma.blockedIp.upsert({
        where: { ipAddress },
        update: { expiresAt, reason }, // Extend ban if already banned?
        create: {
            ipAddress,
            reason,
            expiresAt
        }
    });

    await sendSecurityAlert("IP_BLOCKED", `IP: ${ipAddress}\nReason: ${reason}\nExpires: ${expiresAt.toISOString()}`);
}
