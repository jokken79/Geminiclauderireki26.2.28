import { describe, it, expect } from 'vitest'
import { companySchema } from '../company'

describe('companySchema', () => {
  it('accepts valid minimal data', () => {
    const result = companySchema.safeParse({ name: 'トヨタ自動車' })
    expect(result.success).toBe(true)
  })

  it('accepts full company data', () => {
    const data = {
      name: 'トヨタ自動車株式会社',
      nameKana: 'トヨタジドウシャカブシキガイシャ',
      industry: '自動車製造',
      postalCode: '471-8571',
      prefecture: '愛知県',
      city: '豊田市',
      address: 'トヨタ町1番地',
      phone: '0565-28-2121',
      fax: '0565-28-2200',
      contactName: '山田太郎',
      contactEmail: 'yamada@toyota.co.jp',
      notes: 'メイン取引先',
    }
    const result = companySchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('requires name', () => {
    expect(companySchema.safeParse({ name: '' }).success).toBe(false)
    expect(companySchema.safeParse({}).success).toBe(false)
  })

  it('rejects name exceeding 100 characters', () => {
    expect(companySchema.safeParse({ name: 'A'.repeat(101) }).success).toBe(false)
  })

  it('validates postal code format when provided', () => {
    expect(companySchema.safeParse({ name: 'Test', postalCode: 'invalid' }).success).toBe(false)
    expect(companySchema.safeParse({ name: 'Test', postalCode: '123-4567' }).success).toBe(true)
  })

  it('validates phone format when provided', () => {
    expect(companySchema.safeParse({ name: 'Test', phone: 'abc' }).success).toBe(false)
    expect(companySchema.safeParse({ name: 'Test', phone: '03-1234-5678' }).success).toBe(true)
  })

  it('validates email format when provided', () => {
    expect(companySchema.safeParse({ name: 'Test', contactEmail: 'invalid' }).success).toBe(false)
    expect(companySchema.safeParse({ name: 'Test', contactEmail: 'test@example.com' }).success).toBe(true)
  })
})
