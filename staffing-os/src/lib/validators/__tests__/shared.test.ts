import { describe, it, expect } from 'vitest'
import {
  postalCodeSchema,
  phoneSchema,
  emailSchema,
  dateStringSchema,
  optionalDateSchema,
  positiveIntSchema,
  optionalPositiveNumberSchema,
} from '../shared'

describe('postalCodeSchema', () => {
  it('accepts valid format with hyphen (123-4567)', () => {
    const result = postalCodeSchema.safeParse('123-4567')
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe('123-4567')
  })

  it('accepts and normalizes format without hyphen (1234567)', () => {
    const result = postalCodeSchema.safeParse('1234567')
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe('123-4567')
  })

  it('accepts empty string (optional)', () => {
    const result = postalCodeSchema.safeParse('')
    expect(result.success).toBe(true)
  })

  it('accepts undefined (optional)', () => {
    const result = postalCodeSchema.safeParse(undefined)
    expect(result.success).toBe(true)
  })

  it('rejects invalid format', () => {
    expect(postalCodeSchema.safeParse('12345').success).toBe(false)
    expect(postalCodeSchema.safeParse('1234-567').success).toBe(false)
    expect(postalCodeSchema.safeParse('abc-defg').success).toBe(false)
  })
})

describe('phoneSchema', () => {
  it('accepts Japanese mobile numbers', () => {
    expect(phoneSchema.safeParse('090-1234-5678').success).toBe(true)
  })

  it('accepts landline numbers', () => {
    expect(phoneSchema.safeParse('03-1234-5678').success).toBe(true)
  })

  it('accepts international format within length limit', () => {
    expect(phoneSchema.safeParse('+81901234567').success).toBe(true)
  })

  it('rejects international format exceeding 15 chars', () => {
    expect(phoneSchema.safeParse('+81-90-1234-5678').success).toBe(false)
  })

  it('accepts empty string (optional)', () => {
    expect(phoneSchema.safeParse('').success).toBe(true)
  })

  it('rejects too short numbers', () => {
    expect(phoneSchema.safeParse('1234567').success).toBe(false)
  })

  it('rejects non-numeric characters', () => {
    expect(phoneSchema.safeParse('abc-defg-hijk').success).toBe(false)
  })
})

describe('emailSchema', () => {
  it('accepts valid email', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true)
  })

  it('accepts empty string (optional)', () => {
    expect(emailSchema.safeParse('').success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false)
    expect(emailSchema.safeParse('user@').success).toBe(false)
  })
})

describe('dateStringSchema', () => {
  it('accepts valid YYYY-MM-DD format', () => {
    expect(dateStringSchema.safeParse('2024-01-15').success).toBe(true)
    expect(dateStringSchema.safeParse('1990-12-31').success).toBe(true)
  })

  it('rejects invalid formats', () => {
    expect(dateStringSchema.safeParse('2024/01/15').success).toBe(false)
    expect(dateStringSchema.safeParse('01-15-2024').success).toBe(false)
    expect(dateStringSchema.safeParse('2024-1-5').success).toBe(false)
    expect(dateStringSchema.safeParse('').success).toBe(false)
  })
})

describe('optionalDateSchema', () => {
  it('accepts valid YYYY-MM-DD format', () => {
    expect(optionalDateSchema.safeParse('2024-01-15').success).toBe(true)
  })

  it('accepts empty string', () => {
    expect(optionalDateSchema.safeParse('').success).toBe(true)
  })

  it('accepts undefined', () => {
    expect(optionalDateSchema.safeParse(undefined).success).toBe(true)
  })

  it('rejects invalid date formats', () => {
    expect(optionalDateSchema.safeParse('2024/01/15').success).toBe(false)
  })
})

describe('positiveIntSchema', () => {
  it('accepts positive integers', () => {
    const r = positiveIntSchema.safeParse(5)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBe(5)
  })

  it('coerces string to number', () => {
    const r = positiveIntSchema.safeParse('10')
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBe(10)
  })

  it('rejects zero', () => {
    expect(positiveIntSchema.safeParse(0).success).toBe(false)
  })

  it('rejects negative numbers', () => {
    expect(positiveIntSchema.safeParse(-1).success).toBe(false)
  })

  it('rejects floats', () => {
    expect(positiveIntSchema.safeParse(3.5).success).toBe(false)
  })
})

describe('optionalPositiveNumberSchema', () => {
  it('accepts positive numbers', () => {
    const r = optionalPositiveNumberSchema.safeParse(170.5)
    expect(r.success).toBe(true)
  })

  it('transforms empty string to undefined', () => {
    const r = optionalPositiveNumberSchema.safeParse('')
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBeUndefined()
  })

  it('rejects negative numbers', () => {
    expect(optionalPositiveNumberSchema.safeParse(-5).success).toBe(false)
  })
})
