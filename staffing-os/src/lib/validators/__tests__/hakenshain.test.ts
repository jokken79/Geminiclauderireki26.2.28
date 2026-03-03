import { describe, it, expect } from 'vitest'
import { nyushaEmploymentSchema, nyushaSchema } from '../hakenshain'

describe('nyushaEmploymentSchema', () => {
  const validData = {
    companyId: 'company-123',
    hireDate: '2024-04-01',
    jikyu: 1200,
  }

  it('accepts valid minimal data', () => {
    expect(nyushaEmploymentSchema.safeParse(validData).success).toBe(true)
  })

  it('accepts full employment data', () => {
    const fullData = {
      ...validData,
      contractEndDate: '2025-03-31',
      position: 'ライン作業',
      productionLine: 'A棟3ライン',
      shift: '日勤',
      dispatchSupervisor: '鈴木一郎',
      clientSupervisor: '佐藤次郎',
      bankName: '三菱UFJ銀行',
      bankBranch: '豊田支店',
      bankAccountType: '普通',
      bankAccountNumber: '1234567',
      emergencyName: '田中花子',
      emergencyPhone: '090-9876-5432',
      emergencyRelation: '妻',
      notes: '初日はA棟に集合',
    }
    expect(nyushaEmploymentSchema.safeParse(fullData).success).toBe(true)
  })

  it('requires companyId', () => {
    const data = { ...validData, companyId: '' }
    expect(nyushaEmploymentSchema.safeParse(data).success).toBe(false)
  })

  it('requires hireDate in YYYY-MM-DD format', () => {
    expect(nyushaEmploymentSchema.safeParse({ ...validData, hireDate: '' }).success).toBe(false)
    expect(nyushaEmploymentSchema.safeParse({ ...validData, hireDate: '04/01/2024' }).success).toBe(false)
  })

  it('requires jikyu to be at least 1', () => {
    expect(nyushaEmploymentSchema.safeParse({ ...validData, jikyu: 0 }).success).toBe(false)
    expect(nyushaEmploymentSchema.safeParse({ ...validData, jikyu: -100 }).success).toBe(false)
  })

  it('validates bank account type', () => {
    expect(nyushaEmploymentSchema.safeParse({ ...validData, bankAccountType: '普通' }).success).toBe(true)
    expect(nyushaEmploymentSchema.safeParse({ ...validData, bankAccountType: '当座' }).success).toBe(true)
    expect(nyushaEmploymentSchema.safeParse({ ...validData, bankAccountType: 'invalid' }).success).toBe(false)
  })
})

describe('nyushaSchema', () => {
  it('extends employment schema with candidateId', () => {
    const data = {
      candidateId: 'cand-456',
      companyId: 'company-123',
      hireDate: '2024-04-01',
      jikyu: 1200,
    }
    expect(nyushaSchema.safeParse(data).success).toBe(true)
  })

  it('requires candidateId', () => {
    const data = {
      candidateId: '',
      companyId: 'company-123',
      hireDate: '2024-04-01',
      jikyu: 1200,
    }
    expect(nyushaSchema.safeParse(data).success).toBe(false)
  })
})
