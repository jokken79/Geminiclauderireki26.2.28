import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple in-memory KV for rate limiting (works per-process in standalone Docker)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>()

interface RateLimitConfig {
    limit: number
    windowMs: number
}

export function rateLimit(req: NextRequest, config: RateLimitConfig) {
    // Extract identifier (IP address)
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1"
    const key = `ratelimit_${ip}`

    const now = Date.now()
    const record = rateLimitMap.get(key)

    if (!record || record.expiresAt < now) {
        // New or expired record
        rateLimitMap.set(key, { count: 1, expiresAt: now + config.windowMs })
        return { success: true, count: 1 }
    }

    // Active record
    const newCount = record.count + 1
    rateLimitMap.set(key, { ...record, count: newCount })

    if (newCount > config.limit) {
        return { success: false, count: newCount, retryAfter: Math.ceil((record.expiresAt - now) / 1000) }
    }

    return { success: true, count: newCount }
}

export function applyRateLimit(req: NextRequest, config: RateLimitConfig) {
    const result = rateLimit(req, config)

    if (!result.success) {
        return new NextResponse(
            JSON.stringify({ error: "Too many requests, please try again later." }),
            {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "Retry-After": result.retryAfter?.toString() || "60",
                },
            }
        )
    }

    return null
}
