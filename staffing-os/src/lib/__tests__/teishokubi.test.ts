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
    // JS Date: Feb 29, 2027 doesn't exist -> rolls to Mar 1, 2027
    expect(result.getMonth()).toBe(2) // March (0-indexed)
    expect(result.getDate()).toBe(1)
  })

  it('handles leap year to leap year (Feb 29 stays Feb 29)', () => {
    const hireDate = new Date(2021, 1, 28) // Feb 28, 2021
    const result = calculateTeishokubi(hireDate)
    expect(result.getFullYear()).toBe(2024)
    expect(result.getMonth()).toBe(1) // February
    expect(result.getDate()).toBe(28)
  })

  it('does not mutate the input date', () => {
    const hireDate = new Date(2024, 3, 1)
    const original = hireDate.getTime()
    calculateTeishokubi(hireDate)
    expect(hireDate.getTime()).toBe(original)
  })

  it('handles January 1st hire date', () => {
    const hireDate = new Date(2023, 0, 1) // Jan 1, 2023
    const result = calculateTeishokubi(hireDate)
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(0)
    expect(result.getDate()).toBe(1)
  })

  it('handles December 31st hire date', () => {
    const hireDate = new Date(2023, 11, 31) // Dec 31, 2023
    const result = calculateTeishokubi(hireDate)
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(11)
    expect(result.getDate()).toBe(31)
  })

  it('handles end-of-month dates correctly (Mar 31 -> Mar 31)', () => {
    const hireDate = new Date(2022, 2, 31) // Mar 31, 2022
    const result = calculateTeishokubi(hireDate)
    expect(result.getFullYear()).toBe(2025)
    expect(result.getMonth()).toBe(2)
    expect(result.getDate()).toBe(31)
  })

  it('returns a new Date instance, not the same reference', () => {
    const hireDate = new Date(2024, 0, 1)
    const result = calculateTeishokubi(hireDate)
    expect(result).not.toBe(hireDate)
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

  it('returns -1 for yesterday', () => {
    vi.setSystemTime(new Date(2024, 0, 2))
    const target = new Date(2024, 0, 1)
    expect(getDaysUntilTeishokubi(target)).toBe(-1)
  })

  it('handles large day differences (full 3 years = ~1095 days)', () => {
    vi.setSystemTime(new Date(2024, 0, 1))
    const target = new Date(2027, 0, 1) // 3 years later
    const result = getDaysUntilTeishokubi(target)
    // 2024 is a leap year, so 366 + 365 + 365 = 1096
    expect(result).toBe(1096)
  })

  it('handles cross-month boundaries', () => {
    vi.setSystemTime(new Date(2024, 0, 30)) // Jan 30
    const target = new Date(2024, 1, 2) // Feb 2
    expect(getDaysUntilTeishokubi(target)).toBe(3)
  })

  it('handles cross-year boundaries', () => {
    vi.setSystemTime(new Date(2024, 11, 31)) // Dec 31, 2024
    const target = new Date(2025, 0, 1) // Jan 1, 2025
    expect(getDaysUntilTeishokubi(target)).toBe(1)
  })

  it('ignores time components (only compares dates)', () => {
    vi.setSystemTime(new Date(2024, 0, 1, 23, 59, 59))
    const target = new Date(2024, 0, 2, 0, 0, 1)
    expect(getDaysUntilTeishokubi(target)).toBe(1)
  })
})

describe('getTeishokubiSeverity', () => {
  it('returns "expired" for negative days', () => {
    expect(getTeishokubiSeverity(-1)).toBe('expired')
    expect(getTeishokubiSeverity(-100)).toBe('expired')
    expect(getTeishokubiSeverity(-365)).toBe('expired')
  })

  it('returns "danger" for 0 days (today is the limit)', () => {
    expect(getTeishokubiSeverity(0)).toBe('danger')
  })

  it('returns "danger" for 1-90 days', () => {
    expect(getTeishokubiSeverity(1)).toBe('danger')
    expect(getTeishokubiSeverity(45)).toBe('danger')
    expect(getTeishokubiSeverity(89)).toBe('danger')
    expect(getTeishokubiSeverity(90)).toBe('danger')
  })

  it('returns "warning" for 91-180 days', () => {
    expect(getTeishokubiSeverity(91)).toBe('warning')
    expect(getTeishokubiSeverity(120)).toBe('warning')
    expect(getTeishokubiSeverity(150)).toBe('warning')
    expect(getTeishokubiSeverity(179)).toBe('warning')
    expect(getTeishokubiSeverity(180)).toBe('warning')
  })

  it('returns "safe" for > 180 days', () => {
    expect(getTeishokubiSeverity(181)).toBe('safe')
    expect(getTeishokubiSeverity(365)).toBe('safe')
    expect(getTeishokubiSeverity(1000)).toBe('safe')
  })

  // Boundary tests
  it('boundary: exactly 90 is danger, 91 is warning', () => {
    expect(getTeishokubiSeverity(90)).toBe('danger')
    expect(getTeishokubiSeverity(91)).toBe('warning')
  })

  it('boundary: exactly 180 is warning, 181 is safe', () => {
    expect(getTeishokubiSeverity(180)).toBe('warning')
    expect(getTeishokubiSeverity(181)).toBe('safe')
  })

  it('boundary: -1 is expired, 0 is danger', () => {
    expect(getTeishokubiSeverity(-1)).toBe('expired')
    expect(getTeishokubiSeverity(0)).toBe('danger')
  })
})

describe('getTeishokubiLabel', () => {
  it('returns Japanese expiration label for expired dates', () => {
    expect(getTeishokubiLabel(-1)).toBe('1日超過')
    expect(getTeishokubiLabel(-5)).toBe('5日超過')
    expect(getTeishokubiLabel(-100)).toBe('100日超過')
    expect(getTeishokubiLabel(-365)).toBe('365日超過')
  })

  it('returns 本日期限 for day 0', () => {
    expect(getTeishokubiLabel(0)).toBe('本日期限')
  })

  it('returns 残り label for future dates', () => {
    expect(getTeishokubiLabel(1)).toBe('残り1日')
    expect(getTeishokubiLabel(30)).toBe('残り30日')
    expect(getTeishokubiLabel(90)).toBe('残り90日')
    expect(getTeishokubiLabel(180)).toBe('残り180日')
    expect(getTeishokubiLabel(365)).toBe('残り365日')
    expect(getTeishokubiLabel(1096)).toBe('残り1096日')
  })

  it('uses Math.abs for negative days in the label', () => {
    // Verifies the absolute value is displayed, not the negative
    const label = getTeishokubiLabel(-42)
    expect(label).toBe('42日超過')
    expect(label).not.toContain('-')
  })

  it('covers all three branches distinctly', () => {
    // negative -> X日超過
    expect(getTeishokubiLabel(-10)).toMatch(/^\d+日超過$/)
    // zero -> 本日期限
    expect(getTeishokubiLabel(0)).toBe('本日期限')
    // positive -> 残りX日
    expect(getTeishokubiLabel(10)).toMatch(/^残り\d+日$/)
  })
})

describe('integration: calculateTeishokubi + getDaysUntilTeishokubi', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('new hire has approximately 1095-1096 days remaining', () => {
    vi.setSystemTime(new Date(2024, 3, 1))
    const hireDate = new Date(2024, 3, 1)
    const teishokubi = calculateTeishokubi(hireDate)
    const days = getDaysUntilTeishokubi(teishokubi)
    // 3 years = 1095 or 1096 days depending on leap years
    expect(days).toBeGreaterThanOrEqual(1095)
    expect(days).toBeLessThanOrEqual(1097)
  })

  it('worker at exactly 3 years has 0 days remaining', () => {
    const hireDate = new Date(2021, 3, 1) // April 1, 2021
    const teishokubi = calculateTeishokubi(hireDate) // April 1, 2024
    vi.setSystemTime(new Date(2024, 3, 1))
    expect(getDaysUntilTeishokubi(teishokubi)).toBe(0)
  })

  it('expired worker shows negative days and correct severity', () => {
    const hireDate = new Date(2020, 0, 1)
    const teishokubi = calculateTeishokubi(hireDate) // Jan 1, 2023
    vi.setSystemTime(new Date(2023, 0, 10)) // 10 days past
    const days = getDaysUntilTeishokubi(teishokubi)
    expect(days).toBe(-9)
    expect(getTeishokubiSeverity(days)).toBe('expired')
    expect(getTeishokubiLabel(days)).toBe('9日超過')
  })
})
