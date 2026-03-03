import { describe, it, expect } from 'vitest'
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step5Schema,
  step6Schema,
  step7Schema,
  step8Schema,
  educationHistorySchema,
  workHistorySchema,
  qualificationSchema,
  familyMemberSchema,
  candidateSchema,
} from '../candidate'

describe('step1Schema (基本情報)', () => {
  const validData = {
    lastNameKanji: '田中',
    birthDate: '1990-01-15',
    nationality: '日本',
  }

  it('accepts valid minimal data', () => {
    expect(step1Schema.safeParse(validData).success).toBe(true)
  })

  it('accepts full data', () => {
    const fullData = {
      ...validData,
      firstNameKanji: '太郎',
      lastNameFurigana: 'たなか',
      firstNameFurigana: 'たろう',
      lastNameRomaji: 'Tanaka',
      firstNameRomaji: 'Taro',
      gender: 'MALE',
    }
    expect(step1Schema.safeParse(fullData).success).toBe(true)
  })

  it('requires lastNameKanji', () => {
    const data = { ...validData, lastNameKanji: '' }
    expect(step1Schema.safeParse(data).success).toBe(false)
  })

  it('requires birthDate', () => {
    const data = { ...validData, birthDate: '' }
    expect(step1Schema.safeParse(data).success).toBe(false)
  })

  it('requires nationality', () => {
    const data = { ...validData, nationality: '' }
    expect(step1Schema.safeParse(data).success).toBe(false)
  })

  it('accepts valid gender values', () => {
    for (const g of ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']) {
      const r = step1Schema.safeParse({ ...validData, gender: g })
      expect(r.success).toBe(true)
    }
  })

  it('rejects invalid gender', () => {
    const r = step1Schema.safeParse({ ...validData, gender: 'INVALID' })
    expect(r.success).toBe(false)
  })
})

describe('step2Schema (連絡先)', () => {
  it('accepts empty object (all optional)', () => {
    expect(step2Schema.safeParse({}).success).toBe(true)
  })

  it('accepts valid postal code and phone', () => {
    const data = {
      postalCode: '123-4567',
      phone: '090-1234-5678',
      email: 'test@example.com',
    }
    expect(step2Schema.safeParse(data).success).toBe(true)
  })
})

describe('step3Schema (在留情報)', () => {
  it('accepts empty object (all optional)', () => {
    expect(step3Schema.safeParse({}).success).toBe(true)
  })

  it('accepts valid visa statuses', () => {
    for (const vs of ['PERMANENT_RESIDENT', 'STUDENT', 'SPECIFIED_SKILLED_1']) {
      expect(step3Schema.safeParse({ visaStatus: vs }).success).toBe(true)
    }
  })

  it('rejects invalid visa status', () => {
    expect(step3Schema.safeParse({ visaStatus: 'INVALID' }).success).toBe(false)
  })
})

describe('step5Schema (職歴)', () => {
  it('defaults to empty array', () => {
    const r = step5Schema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.workHistory).toEqual([])
  })
})

describe('step6Schema (資格・経験)', () => {
  it('accepts experience flags', () => {
    const data = {
      expWelding: true,
      expForklift: false,
      hasDriverLicense: true,
    }
    const r = step6Schema.safeParse(data)
    expect(r.success).toBe(true)
  })
})

describe('step7Schema (家族)', () => {
  it('defaults to empty array', () => {
    const r = step7Schema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.familyMembers).toEqual([])
  })
})

describe('step8Schema (その他)', () => {
  it('defaults jlptLevel to NONE', () => {
    const r = step8Schema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.jlptLevel).toBe('NONE')
  })

  it('accepts valid JLPT levels', () => {
    for (const level of ['N1', 'N2', 'N3', 'N4', 'N5', 'NONE']) {
      expect(step8Schema.safeParse({ jlptLevel: level }).success).toBe(true)
    }
  })

  it('rejects invalid JLPT level', () => {
    expect(step8Schema.safeParse({ jlptLevel: 'N6' }).success).toBe(false)
  })
})

describe('educationHistorySchema', () => {
  it('accepts valid education entry', () => {
    const data = {
      year: 2020,
      month: 4,
      schoolName: '東京大学',
      eventType: '入学',
    }
    expect(educationHistorySchema.safeParse(data).success).toBe(true)
  })

  it('requires schoolName', () => {
    const data = { year: 2020, month: 4, schoolName: '', eventType: '入学' }
    expect(educationHistorySchema.safeParse(data).success).toBe(false)
  })

  it('requires eventType', () => {
    const data = { year: 2020, month: 4, schoolName: '大学', eventType: '' }
    expect(educationHistorySchema.safeParse(data).success).toBe(false)
  })

  it('validates year range', () => {
    expect(educationHistorySchema.safeParse({ year: 1949, month: 4, schoolName: 'A', eventType: 'B' }).success).toBe(false)
    expect(educationHistorySchema.safeParse({ year: 2101, month: 4, schoolName: 'A', eventType: 'B' }).success).toBe(false)
  })

  it('validates month range', () => {
    expect(educationHistorySchema.safeParse({ year: 2020, month: 0, schoolName: 'A', eventType: 'B' }).success).toBe(false)
    expect(educationHistorySchema.safeParse({ year: 2020, month: 13, schoolName: 'A', eventType: 'B' }).success).toBe(false)
  })
})

describe('workHistorySchema', () => {
  it('accepts valid work entry', () => {
    const data = {
      startYear: 2020,
      startMonth: 4,
      companyName: 'トヨタ自動車',
      eventType: '入社',
    }
    expect(workHistorySchema.safeParse(data).success).toBe(true)
  })

  it('accepts entry with end date and optional fields', () => {
    const data = {
      startYear: 2020,
      startMonth: 4,
      endYear: 2022,
      endMonth: 3,
      companyName: 'トヨタ自動車',
      position: 'エンジニア',
      jobContent: '組立作業',
      eventType: '退社',
      hakenmoto: '派遣元会社',
      hakensaki: '派遣先工場',
      workLocation: '愛知県豊田市',
    }
    expect(workHistorySchema.safeParse(data).success).toBe(true)
  })

  it('requires companyName', () => {
    expect(workHistorySchema.safeParse({
      startYear: 2020, startMonth: 4, companyName: '', eventType: '入社',
    }).success).toBe(false)
  })
})

describe('qualificationSchema', () => {
  it('accepts valid qualification', () => {
    const data = { year: 2020, month: 6, name: 'フォークリフト免許' }
    expect(qualificationSchema.safeParse(data).success).toBe(true)
  })

  it('requires name', () => {
    expect(qualificationSchema.safeParse({ year: 2020, month: 6, name: '' }).success).toBe(false)
  })
})

describe('familyMemberSchema', () => {
  it('accepts valid family member', () => {
    const data = {
      name: '田中花子',
      relationship: '妻',
      liveTogether: true,
    }
    expect(familyMemberSchema.safeParse(data).success).toBe(true)
  })

  it('requires name', () => {
    expect(familyMemberSchema.safeParse({ name: '', relationship: '妻' }).success).toBe(false)
  })

  it('requires relationship', () => {
    expect(familyMemberSchema.safeParse({ name: '花子', relationship: '' }).success).toBe(false)
  })

  it('validates age range', () => {
    expect(familyMemberSchema.safeParse({ name: 'A', relationship: 'B', age: 151 }).success).toBe(false)
  })
})

describe('candidateSchema (full merge)', () => {
  it('accepts valid full candidate data', () => {
    const data = {
      lastNameKanji: '田中',
      birthDate: '1990-01-15',
      nationality: '日本',
    }
    const r = candidateSchema.safeParse(data)
    expect(r.success).toBe(true)
  })

  it('rejects if step1 required fields are missing', () => {
    const r = candidateSchema.safeParse({})
    expect(r.success).toBe(false)
  })
})
