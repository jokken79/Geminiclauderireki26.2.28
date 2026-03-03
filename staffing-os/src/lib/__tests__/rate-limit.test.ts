import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rateLimit, applyRateLimit } from '../rate-limit'

function createMockRequest(ip?: string) {
  return {
    headers: {
      get: vi.fn((name: string) => {
        if (name === 'x-forwarded-for') return ip || null
        return null
      }),
    },
  } as unknown as import('next/server').NextRequest
}

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('allows first request', () => {
    const req = createMockRequest('192.168.1.1')
    const result = rateLimit(req, { limit: 10, windowMs: 60_000 })
    expect(result.success).toBe(true)
    expect(result.count).toBe(1)
    vi.useRealTimers()
  })

  it('allows requests within limit', () => {
    const req = createMockRequest('192.168.1.2')
    const config = { limit: 3, windowMs: 60_000 }

    expect(rateLimit(req, config).success).toBe(true)
    expect(rateLimit(req, config).success).toBe(true)
    expect(rateLimit(req, config).success).toBe(true)
    vi.useRealTimers()
  })

  it('blocks requests exceeding limit', () => {
    const req = createMockRequest('192.168.1.3')
    const config = { limit: 2, windowMs: 60_000 }

    rateLimit(req, config)
    rateLimit(req, config)
    const result = rateLimit(req, config)

    expect(result.success).toBe(false)
    expect(result.count).toBe(3)
    expect(result.retryAfter).toBeDefined()
    vi.useRealTimers()
  })

  it('resets after window expires', () => {
    const req = createMockRequest('192.168.1.4')
    const config = { limit: 1, windowMs: 60_000 }

    rateLimit(req, config)
    const blocked = rateLimit(req, config)
    expect(blocked.success).toBe(false)

    // Advance past the window
    vi.advanceTimersByTime(61_000)

    const result = rateLimit(req, config)
    expect(result.success).toBe(true)
    expect(result.count).toBe(1)
    vi.useRealTimers()
  })

  it('tracks different IPs independently', () => {
    const req1 = createMockRequest('10.0.0.1')
    const req2 = createMockRequest('10.0.0.2')
    const config = { limit: 1, windowMs: 60_000 }

    rateLimit(req1, config)
    const r1 = rateLimit(req1, config)
    expect(r1.success).toBe(false)

    const r2 = rateLimit(req2, config)
    expect(r2.success).toBe(true)
    vi.useRealTimers()
  })

  it('uses 127.0.0.1 as fallback when no IP header', () => {
    const req = createMockRequest()
    const config = { limit: 10, windowMs: 60_000 }
    const result = rateLimit(req, config)
    expect(result.success).toBe(true)
    vi.useRealTimers()
  })
})

describe('applyRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('returns null when request is allowed', () => {
    const req = createMockRequest('172.16.0.1')
    const result = applyRateLimit(req, { limit: 10, windowMs: 60_000 })
    expect(result).toBeNull()
    vi.useRealTimers()
  })

  it('returns 429 response when rate limited', () => {
    const req = createMockRequest('172.16.0.2')
    const config = { limit: 1, windowMs: 60_000 }

    applyRateLimit(req, config)
    const response = applyRateLimit(req, config)

    expect(response).not.toBeNull()
    expect(response!.status).toBe(429)
    vi.useRealTimers()
  })
})
