import { describe, it, expect, vi } from 'vitest'
import { generateSkillSheet } from '../skill-sheet-service'

const baseCandidateData = {
  lastNameRomaji: 'Tanaka',
  firstNameRomaji: 'Taro',
  lastNameKanji: '田中',
  firstNameKanji: '太郎',
  birthDate: new Date(1990, 5, 15),
  prefecture: '愛知県',
  gender: 'MALE',
  nationality: '日本',
  jlptLevel: 'N2',
  expWelding: true,
  expForklift: false,
  expLineWork: true,
  expAssembly: false,
  expPacking: true,
  expInspection: false,
  expPainting: false,
  expMachining: false,
  expCleaning: false,
  expCooking: false,
  height: 175,
  weight: 70,
  dominantHand: '右',
  bloodType: 'A',
  visionLeft: 1.0,
  visionRight: 1.2,
  qualifications: [
    { name: 'フォークリフト免許', year: 2018, month: 6 },
  ],
  workHistory: [
    {
      startYear: 2015,
      startMonth: 4,
      endYear: 2020,
      endMonth: 3,
      companyName: 'トヨタ自動車',
      position: '組立作業',
      jobContent: '自動車組立',
    },
    {
      startYear: 2020,
      startMonth: 4,
      endYear: null,
      endMonth: null,
      companyName: 'デンソー',
      position: null,
      jobContent: null,
    },
  ],
}

describe('generateSkillSheet', () => {
  it('anonymizes name to initials', () => {
    const result = generateSkillSheet(baseCandidateData)
    expect(result.initials).toBe('T.T.')
  })

  it('falls back to kanji initials when romaji is missing', () => {
    const data = { ...baseCandidateData, lastNameRomaji: null, firstNameRomaji: null }
    const result = generateSkillSheet(data)
    expect(result.initials).toBe('田.太.')
  })

  it('provides age range instead of exact age', () => {
    // Person born 1990-06-15, so depending on reference date, 30代前半 or 30代後半
    const result = generateSkillSheet(baseCandidateData)
    expect(result.ageRange).toMatch(/^\d+代(前半|後半)$/)
  })

  it('only includes prefecture, no detailed address', () => {
    const result = generateSkillSheet(baseCandidateData)
    expect(result.prefecture).toBe('愛知県')
  })

  it('maps experience flags correctly', () => {
    const result = generateSkillSheet(baseCandidateData)
    const welding = result.experience.find(e => e.label === '溶接')
    expect(welding?.has).toBe(true)
    const forklift = result.experience.find(e => e.label === 'フォークリフト')
    expect(forklift?.has).toBe(false)
    const lineWork = result.experience.find(e => e.label === 'ライン作業')
    expect(lineWork?.has).toBe(true)
    expect(result.experience).toHaveLength(10)
  })

  it('includes qualifications', () => {
    const result = generateSkillSheet(baseCandidateData)
    expect(result.qualifications).toHaveLength(1)
    expect(result.qualifications[0].name).toBe('フォークリフト免許')
  })

  it('anonymizes work history - no company names', () => {
    const result = generateSkillSheet(baseCandidateData)
    expect(result.workHistory).toHaveLength(2)
    // Should NOT contain company names
    result.workHistory.forEach(wh => {
      expect(wh).not.toHaveProperty('companyName')
    })
  })

  it('formats work history periods correctly', () => {
    const result = generateSkillSheet(baseCandidateData)
    expect(result.workHistory[0].period).toBe('2015/4 - 2020/3')
    expect(result.workHistory[1].period).toBe('2020/4 - 現在')
  })

  it('defaults industry to 製造業 and role to 一般作業 when not provided', () => {
    const result = generateSkillSheet(baseCandidateData)
    expect(result.workHistory[1].industry).toBe('製造業')
    expect(result.workHistory[1].role).toBe('一般作業')
  })

  it('includes physical data', () => {
    const result = generateSkillSheet(baseCandidateData)
    expect(result.physicalData.height).toBe(175)
    expect(result.physicalData.weight).toBe(70)
    expect(result.physicalData.dominantHand).toBe('右')
    expect(result.physicalData.bloodType).toBe('A')
  })

  it('includes basic candidate info', () => {
    const result = generateSkillSheet(baseCandidateData)
    expect(result.gender).toBe('MALE')
    expect(result.nationality).toBe('日本')
    expect(result.jlptLevel).toBe('N2')
  })
})
