import { describe, it, expect } from 'vitest'
import { toWareki, toWarekiFull, calculateAge, getAgeRange, getInitials } from '../wareki'

describe('toWareki', () => {
  // --- Reiwa era (2019-present) ---
  it('converts Reiwa dates correctly', () => {
    expect(toWareki(new Date(2024, 0, 1))).toBe('令和6年')
    expect(toWareki(new Date(2026, 2, 4))).toBe('令和8年')
  })

  it('converts Reiwa first year as 元年', () => {
    expect(toWareki(new Date(2019, 4, 1))).toBe('令和元年')
  })

  it('converts the start of Reiwa year 2', () => {
    expect(toWareki(new Date(2020, 0, 1))).toBe('令和2年')
  })

  // --- Heisei era (1989-2018) ---
  it('converts Heisei dates correctly', () => {
    expect(toWareki(new Date(2015, 5, 1))).toBe('平成27年')
    expect(toWareki(new Date(2000, 0, 1))).toBe('平成12年')
    expect(toWareki(new Date(2018, 11, 31))).toBe('平成30年')
  })

  it('converts Heisei first year as 元年', () => {
    expect(toWareki(new Date(1989, 0, 8))).toBe('平成元年')
  })

  // --- Showa era (1926-1988) ---
  it('converts Showa dates correctly', () => {
    expect(toWareki(new Date(1985, 2, 20))).toBe('昭和60年')
    expect(toWareki(new Date(1945, 7, 15))).toBe('昭和20年')
    expect(toWareki(new Date(1988, 11, 31))).toBe('昭和63年')
  })

  it('converts Showa first year as 元年', () => {
    expect(toWareki(new Date(1926, 11, 25))).toBe('昭和元年')
  })

  // --- Taisho era (1912-1925) ---
  it('converts Taisho dates correctly', () => {
    expect(toWareki(new Date(1920, 0, 1))).toBe('大正9年')
    expect(toWareki(new Date(1925, 5, 1))).toBe('大正14年')
  })

  it('converts Taisho first year as 元年', () => {
    expect(toWareki(new Date(1912, 6, 30))).toBe('大正元年')
  })

  // --- Meiji era (1868-1911) ---
  it('converts Meiji dates correctly', () => {
    expect(toWareki(new Date(1900, 0, 1))).toBe('明治33年')
    expect(toWareki(new Date(1868, 0, 1))).toBe('明治元年')
    expect(toWareki(new Date(1911, 11, 31))).toBe('明治44年')
  })

  // --- Pre-Meiji fallback ---
  it('falls back to Western year for dates before Meiji', () => {
    expect(toWareki(new Date(1850, 0, 1))).toBe('1850年')
    expect(toWareki(new Date(1867, 11, 31))).toBe('1867年')
  })

  // --- Era boundary transitions ---
  it('handles year at Reiwa/Heisei boundary (2019 is Reiwa)', () => {
    // The function checks year >= startYear, so any date in 2019 is Reiwa
    expect(toWareki(new Date(2019, 0, 1))).toBe('令和元年')
  })

  it('handles year at Heisei/Showa boundary (1989 is Heisei)', () => {
    expect(toWareki(new Date(1989, 0, 1))).toBe('平成元年')
  })
})

describe('toWarekiFull', () => {
  it('includes month and day for a standard date', () => {
    expect(toWarekiFull(new Date(2024, 5, 15))).toBe('令和6年6月15日')
  })

  it('handles January 1st correctly', () => {
    expect(toWarekiFull(new Date(2020, 0, 1))).toBe('令和2年1月1日')
  })

  it('handles December 31st correctly', () => {
    expect(toWarekiFull(new Date(2023, 11, 31))).toBe('令和5年12月31日')
  })

  it('handles Reiwa 元年 with full date', () => {
    expect(toWarekiFull(new Date(2019, 4, 1))).toBe('令和元年5月1日')
  })

  it('handles Heisei era with full date', () => {
    expect(toWarekiFull(new Date(2000, 2, 15))).toBe('平成12年3月15日')
  })

  it('handles single-digit months and days', () => {
    expect(toWarekiFull(new Date(2024, 0, 5))).toBe('令和6年1月5日')
  })

  it('handles end of month dates', () => {
    expect(toWarekiFull(new Date(2024, 0, 31))).toBe('令和6年1月31日')
    expect(toWarekiFull(new Date(2024, 1, 29))).toBe('令和6年2月29日') // leap year
  })
})

describe('calculateAge', () => {
  it('calculates age correctly when birthday has passed this year', () => {
    const birthDate = new Date(1990, 0, 1) // Jan 1, 1990
    const refDate = new Date(2024, 5, 15)  // Jun 15, 2024
    expect(calculateAge(birthDate, refDate)).toBe(34)
  })

  it('calculates age correctly when birthday has not passed yet', () => {
    const birthDate = new Date(1990, 11, 25) // Dec 25, 1990
    const refDate = new Date(2024, 5, 15)    // Jun 15, 2024
    expect(calculateAge(birthDate, refDate)).toBe(33)
  })

  it('calculates age correctly on the birthday itself', () => {
    const birthDate = new Date(1990, 5, 15) // Jun 15, 1990
    const refDate = new Date(2024, 5, 15)   // Jun 15, 2024
    expect(calculateAge(birthDate, refDate)).toBe(34)
  })

  it('calculates age correctly the day before birthday', () => {
    const birthDate = new Date(1990, 5, 15) // Jun 15, 1990
    const refDate = new Date(2024, 5, 14)   // Jun 14, 2024
    expect(calculateAge(birthDate, refDate)).toBe(33)
  })

  it('calculates age correctly the day after birthday', () => {
    const birthDate = new Date(1990, 5, 15) // Jun 15, 1990
    const refDate = new Date(2024, 5, 16)   // Jun 16, 2024
    expect(calculateAge(birthDate, refDate)).toBe(34)
  })

  it('handles same year correctly (baby born this year)', () => {
    const birthDate = new Date(2024, 0, 1)
    const refDate = new Date(2024, 6, 1)
    expect(calculateAge(birthDate, refDate)).toBe(0)
  })

  it('handles birth month same as reference month, day not yet reached', () => {
    const birthDate = new Date(2000, 5, 20) // Jun 20
    const refDate = new Date(2024, 5, 10)   // Jun 10
    expect(calculateAge(birthDate, refDate)).toBe(23)
  })

  it('handles Feb 29 birthday on a non-leap reference year', () => {
    const birthDate = new Date(2000, 1, 29) // Feb 29, 2000
    // In 2023 (non-leap), Feb 28 is before the birthday
    const refDate = new Date(2023, 1, 28)
    expect(calculateAge(birthDate, refDate)).toBe(22)
    // March 1 is after
    const refDate2 = new Date(2023, 2, 1)
    expect(calculateAge(birthDate, refDate2)).toBe(23)
  })

  it('returns 0 for newborn (same day)', () => {
    const date = new Date(2024, 3, 15)
    expect(calculateAge(date, date)).toBe(0)
  })

  it('handles very old age', () => {
    const birthDate = new Date(1920, 0, 1)
    const refDate = new Date(2024, 6, 1)
    expect(calculateAge(birthDate, refDate)).toBe(104)
  })
})

describe('getAgeRange', () => {
  it('returns correct range for ages in the 20s', () => {
    expect(getAgeRange(20)).toBe('20代前半')
    expect(getAgeRange(22)).toBe('20代前半')
    expect(getAgeRange(24)).toBe('20代前半')
    expect(getAgeRange(25)).toBe('20代後半')
    expect(getAgeRange(29)).toBe('20代後半')
  })

  it('returns correct range for ages in the 30s', () => {
    expect(getAgeRange(30)).toBe('30代前半')
    expect(getAgeRange(33)).toBe('30代前半')
    expect(getAgeRange(34)).toBe('30代前半')
    expect(getAgeRange(35)).toBe('30代後半')
    expect(getAgeRange(37)).toBe('30代後半')
    expect(getAgeRange(39)).toBe('30代後半')
  })

  it('returns correct range for ages in the 40s', () => {
    expect(getAgeRange(40)).toBe('40代前半')
    expect(getAgeRange(45)).toBe('40代後半')
  })

  it('returns correct range for ages in the 50s', () => {
    expect(getAgeRange(50)).toBe('50代前半')
    expect(getAgeRange(59)).toBe('50代後半')
  })

  it('handles exact boundary at 5 (前半/後半 split)', () => {
    // 0-4 => 前半, 5-9 => 後半
    expect(getAgeRange(24)).toBe('20代前半')
    expect(getAgeRange(25)).toBe('20代後半')
    expect(getAgeRange(34)).toBe('30代前半')
    expect(getAgeRange(35)).toBe('30代後半')
  })

  it('handles decade boundary values', () => {
    expect(getAgeRange(19)).toBe('10代後半')
    expect(getAgeRange(20)).toBe('20代前半')
    expect(getAgeRange(29)).toBe('20代後半')
    expect(getAgeRange(30)).toBe('30代前半')
  })

  it('handles teens', () => {
    expect(getAgeRange(18)).toBe('10代後半')
    expect(getAgeRange(13)).toBe('10代前半')
  })

  it('handles ages 60+', () => {
    expect(getAgeRange(60)).toBe('60代前半')
    expect(getAgeRange(65)).toBe('60代後半')
    expect(getAgeRange(70)).toBe('70代前半')
  })
})

describe('getInitials', () => {
  it('returns initials from romaji names', () => {
    expect(getInitials('Tanaka', 'Taro')).toBe('T.T.')
    expect(getInitials('Yamada', 'Hanako')).toBe('Y.H.')
  })

  it('returns uppercase initials for lowercase input', () => {
    expect(getInitials('suzuki', 'hanako')).toBe('S.H.')
    expect(getInitials('yamamoto', 'kenji')).toBe('Y.K.')
  })

  it('returns X.X. for null/undefined names', () => {
    expect(getInitials(null, null)).toBe('X.X.')
    expect(getInitials(undefined, undefined)).toBe('X.X.')
  })

  it('returns X for missing individual names', () => {
    expect(getInitials('Tanaka', null)).toBe('T.X.')
    expect(getInitials(null, 'Taro')).toBe('X.T.')
    expect(getInitials('Sato', undefined)).toBe('S.X.')
    expect(getInitials(undefined, 'Jiro')).toBe('X.J.')
  })

  it('handles empty strings', () => {
    expect(getInitials('', '')).toBe('X.X.')
    expect(getInitials('', 'Taro')).toBe('X.T.')
    expect(getInitials('Tanaka', '')).toBe('T.X.')
  })

  it('handles single-character names', () => {
    expect(getInitials('A', 'B')).toBe('A.B.')
  })

  it('handles mixed null and undefined', () => {
    expect(getInitials(null, undefined)).toBe('X.X.')
    expect(getInitials(undefined, null)).toBe('X.X.')
  })

  it('correctly takes only the first character', () => {
    expect(getInitials('Watanabe', 'Satoshi')).toBe('W.S.')
    // Verify it does not include more than one character per name
    const result = getInitials('Kobayashi', 'Midori')
    expect(result).toBe('K.M.')
    expect(result).toHaveLength(4) // K.M.
  })
})
