import { describe, it, expect } from 'vitest'
import { toWareki, toWarekiFull, calculateAge, getAgeRange, getInitials } from '../wareki'

describe('toWareki', () => {
  it('converts Reiwa dates correctly', () => {
    expect(toWareki(new Date(2024, 0, 1))).toBe('令和6年')
  })

  it('converts Reiwa first year as 元年', () => {
    expect(toWareki(new Date(2019, 4, 1))).toBe('令和元年')
  })

  it('converts Heisei dates correctly', () => {
    expect(toWareki(new Date(2015, 5, 1))).toBe('平成27年')
  })

  it('converts Heisei first year as 元年', () => {
    expect(toWareki(new Date(1989, 0, 8))).toBe('平成元年')
  })

  it('converts Showa dates correctly', () => {
    expect(toWareki(new Date(1985, 2, 20))).toBe('昭和60年')
  })

  it('converts Taisho dates correctly', () => {
    expect(toWareki(new Date(1920, 0, 1))).toBe('大正9年')
  })

  it('converts Meiji dates correctly', () => {
    expect(toWareki(new Date(1900, 0, 1))).toBe('明治33年')
  })

  it('falls back to Western year for dates before Meiji', () => {
    expect(toWareki(new Date(1850, 0, 1))).toBe('1850年')
  })
})

describe('toWarekiFull', () => {
  it('includes month and day', () => {
    expect(toWarekiFull(new Date(2024, 5, 15))).toBe('令和6年6月15日')
  })

  it('handles January 1st correctly', () => {
    expect(toWarekiFull(new Date(2020, 0, 1))).toBe('令和2年1月1日')
  })

  it('handles December 31st correctly', () => {
    expect(toWarekiFull(new Date(2023, 11, 31))).toBe('令和5年12月31日')
  })
})

describe('calculateAge', () => {
  it('calculates age correctly when birthday has passed', () => {
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

  it('handles same year correctly', () => {
    const birthDate = new Date(2024, 0, 1)
    const refDate = new Date(2024, 6, 1)
    expect(calculateAge(birthDate, refDate)).toBe(0)
  })
})

describe('getAgeRange', () => {
  it('returns 20代前半 for age 22', () => {
    expect(getAgeRange(22)).toBe('20代前半')
  })

  it('returns 30代前半 for age 33', () => {
    expect(getAgeRange(33)).toBe('30代前半')
  })

  it('returns 30代後半 for age 37', () => {
    expect(getAgeRange(37)).toBe('30代後半')
  })

  it('returns 40代前半 for age 40', () => {
    expect(getAgeRange(40)).toBe('40代前半')
  })

  it('returns 40代後半 for age 45', () => {
    expect(getAgeRange(45)).toBe('40代後半')
  })

  it('returns 50代後半 for age 59', () => {
    expect(getAgeRange(59)).toBe('50代後半')
  })

  it('handles boundary at 5 (前半/後半)', () => {
    expect(getAgeRange(24)).toBe('20代前半')
    expect(getAgeRange(25)).toBe('20代後半')
  })
})

describe('getInitials', () => {
  it('returns initials from romaji names', () => {
    expect(getInitials('Tanaka', 'Taro')).toBe('T.T.')
  })

  it('returns uppercase initials', () => {
    expect(getInitials('suzuki', 'hanako')).toBe('S.H.')
  })

  it('returns X.X. for null/undefined names', () => {
    expect(getInitials(null, null)).toBe('X.X.')
    expect(getInitials(undefined, undefined)).toBe('X.X.')
  })

  it('returns X for missing individual names', () => {
    expect(getInitials('Tanaka', null)).toBe('T.X.')
    expect(getInitials(null, 'Taro')).toBe('X.T.')
  })

  it('handles empty strings', () => {
    expect(getInitials('', '')).toBe('X.X.')
  })
})
