import { describe, it, expect } from 'vitest'
import { ukeoiSchema } from '../ukeoi'

describe('ukeoiSchema', () => {
  const validData = {
    candidateId: 'cand-123',
    companyId: 'company-456',
    hireDate: '2024-04-01',
    monthlySalary: 250000,
    internalSupervisor: '鈴木一郎',
  }

  it('accepts valid minimal data', () => {
    expect(ukeoiSchema.safeParse(validData).success).toBe(true)
  })

  it('accepts full data', () => {
    const fullData = {
      ...validData,
      contractEndDate: '2025-03-31',
      position: 'エンジニア',
      projectName: '新工場建設プロジェクト',
      bankName: 'みずほ銀行',
      bankBranch: '名古屋支店',
      bankAccountType: '普通',
      bankAccountNumber: '7654321',
      emergencyName: '鈴木花子',
      emergencyPhone: '090-1234-5678',
      emergencyRelation: '妻',
      notes: '現場注意事項あり',
    }
    expect(ukeoiSchema.safeParse(fullData).success).toBe(true)
  })

  it('requires candidateId', () => {
    expect(ukeoiSchema.safeParse({ ...validData, candidateId: '' }).success).toBe(false)
  })

  it('requires companyId', () => {
    expect(ukeoiSchema.safeParse({ ...validData, companyId: '' }).success).toBe(false)
  })

  it('requires internalSupervisor (偽装請負防止)', () => {
    expect(ukeoiSchema.safeParse({ ...validData, internalSupervisor: '' }).success).toBe(false)
  })

  it('requires monthlySalary to be at least 1', () => {
    expect(ukeoiSchema.safeParse({ ...validData, monthlySalary: 0 }).success).toBe(false)
    expect(ukeoiSchema.safeParse({ ...validData, monthlySalary: -10000 }).success).toBe(false)
  })

  it('requires hireDate in correct format', () => {
    expect(ukeoiSchema.safeParse({ ...validData, hireDate: '' }).success).toBe(false)
    expect(ukeoiSchema.safeParse({ ...validData, hireDate: '2024/04/01' }).success).toBe(false)
  })

  it('validates bank account type when provided', () => {
    expect(ukeoiSchema.safeParse({ ...validData, bankAccountType: '普通' }).success).toBe(true)
    expect(ukeoiSchema.safeParse({ ...validData, bankAccountType: '当座' }).success).toBe(true)
    expect(ukeoiSchema.safeParse({ ...validData, bankAccountType: 'savings' }).success).toBe(false)
  })
})
