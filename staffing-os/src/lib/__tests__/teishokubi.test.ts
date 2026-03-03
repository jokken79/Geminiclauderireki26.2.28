import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateTeishokubi,
  getDaysUntilTeishokubi,
  getTeishokubiSeverity,
  getTeishokubiLabel,
} from '../teishokubi'

describe('calculateTeishokubi', () => {
  it('returns a date exactly 3 years from hire date', () => {
    const hireDate = new Date(2024, 3, 1) // April 1, 2024
    const result = calculateTeishokubi(hireDate)
    expect(result.getFullYear()).toBe(2027)
    expect(result.getMonth()).toBe(3)
    expect(result.getDate()).toBe(1)
  })

  it('handles leap year hire dates (Feb 29 rolls to Mar 1 in non-leap year)', () => {
    const hireDate = new Date(2024, 1, 29) // Feb 29, 2024 (leap year)
    const result = calculateTeishokubi(hireDate)
    expect(result.getFullYear()).toBe(2027)
    // JS Date: Feb 29, 2027 doesn't exist → rolls to Mar 1, 2027
    expect(result.getMonth()).toBe(2) // March (0-indexed)
    expect(result.getDate()).toBe(1)
  })

  it('does not mutate the input date', () => {
    const hireDate = new Date(2024, 3, 1)
    const original = hireDate.getTime()
    calculateTeishokubi(hireDate)
    expect(hireDate.getTime()).toBe(original)
  })
})

describe('getDaysUntilTeishokubi', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns positive days for future teishokubi', () => {
    vi.setSystemTime(new Date(2024, 0, 1)) // Jan 1, 2024
    const target = new Date(2024, 0, 11) // Jan 11, 2024
    expect(getDaysUntilTeishokubi(target)).toBe(10)
  })

  it('returns 0 for today', () => {
    vi.setSystemTime(new Date(2024, 5, 15)) // Jun 15, 2024
    const target = new Date(2024, 5, 15)
    expect(getDaysUntilTeishokubi(target)).toBe(0)
  })

  it('returns negative days for past teishokubi', () => {
    vi.setSystemTime(new Date(2024, 5, 15)) // Jun 15, 2024
    const target = new Date(2024, 5, 10) // Jun 10, 2024
    expect(getDaysUntilTeishokubi(target)).toBe(-5)
  })

  it('returns 1 for tomorrow', () => {
    vi.setSystemTime(new Date(2024, 0, 1))
    const target = new Date(2024, 0, 2)
    expect(getDaysUntilTeishokubi(target)).toBe(1)
  })
})

describe('getTeishokubiSeverity', () => {
  it('returns "expired" for negative days', () => {
    expect(getTeishokubiSeverity(-1)).toBe('expired')
    expect(getTeishokubiSeverity(-100)).toBe('expired')
  })

  it('returns "danger" for 0-90 days', () => {
    expect(getTeishokubiSeverity(0)).toBe('danger')
    expect(getTeishokubiSeverity(45)).toBe('danger')
    expect(getTeishokubiSeverity(90)).toBe('danger')
  })

  it('returns "warning" for 91-180 days', () => {
    expect(getTeishokubiSeverity(91)).toBe('warning')
    expect(getTeishokubiSeverity(150)).toBe('warning')
    expect(getTeishokubiSeverity(180)).toBe('warning')
  })

  it('returns "safe" for > 180 days', () => {
    expect(getTeishokubiSeverity(181)).toBe('safe')
    expect(getTeishokubiSeverity(365)).toBe('safe')
    expect(getTeishokubiSeverity(1000)).toBe('safe')
  })
})

describe('getTeishokubiLabel', () => {
  it('returns 超過 label for expired dates', () => {
    expect(getTeishokubiLabel(-5)).toBe('5日超過')
    expect(getTeishokubiLabel(-100)).toBe('100日超過')
  })

  it('returns 本日期限 for day 0', () => {
    expect(getTeishokubiLabel(0)).toBe('本日期限')
  })

  it('returns 残り label for future dates', () => {
    expect(getTeishokubiLabel(30)).toBe('残り30日')
    expect(getTeishokubiLabel(365)).toBe('残り365日')
  })
})
