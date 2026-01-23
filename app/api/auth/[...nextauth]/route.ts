import { handlers } from "@/auth"
import { rateLimit } from "@/lib/rate-limit"
import { NextResponse, NextRequest } from "next/server"

const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
})

async function checkRateLimit(req: Request) {
    const ip = req.headers.get("x-forwarded-for") || "unknown-ip"
    try {
        // Limit: 20 requests per minute per IP to avoid blocking legitimate assets/redirect loops
        // Auth flows can be chatty (csrf, session, providers)
        await limiter.check(20, ip)
    } catch {
        return new NextResponse("Too Many Requests", { status: 429 })
    }
}

export const GET = async (req: NextRequest) => {
    const res = await checkRateLimit(req)
    if (res) return res
    return handlers.GET(req)
}

export const POST = async (req: NextRequest) => {
    // POST (Sign in/out) should be stricter? 
    // Keeping same for simplicity, but could be separate limiter.
    const res = await checkRateLimit(req)
    if (res) return res
    return handlers.POST(req)
}
