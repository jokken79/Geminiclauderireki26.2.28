/**
 * Skill Sheet Anonymization Service
 *
 * Per 労働者派遣法26条7項 (Worker Dispatch Act Article 26-7),
 * skill sheets sent to client companies must be anonymized:
 * - Name → Initials only (e.g., "T.H.")
 * - Birth date → Age range (e.g., "30代前半")
 * - Address → Prefecture/city only (no detailed address)
 * - Photo → Excluded
 */

import { getInitials, getAgeRange, calculateAge } from "@/lib/wareki"

export interface SkillSheetData {
  initials: string
  ageRange: string
  prefecture: string | null
  gender: string | null
  nationality: string
  jlptLevel: string
  experience: {
    label: string
    has: boolean
  }[]
  qualifications: {
    name: string
    year: number
    month: number
  }[]
  workHistory: {
    period: string
    industry: string
    role: string
  }[]
  physicalData: {
    height: number | null
    weight: number | null
    dominantHand: string | null
    bloodType: string | null
    visionLeft: number | null
    visionRight: number | null
  }
}

export function generateSkillSheet(candidate: {
  lastNameRomaji: string | null
  firstNameRomaji: string | null
  lastNameKanji: string
  firstNameKanji: string
  birthDate: Date
  prefecture: string | null
  gender: string | null
  nationality: string
  jlptLevel: string
  // Experience flags
  expWelding: boolean
  expForklift: boolean
  expLineWork: boolean
  expAssembly: boolean
  expPacking: boolean
  expInspection: boolean
  expPainting: boolean
  expMachining: boolean
  expCleaning: boolean
  expCooking: boolean
  // Physical
  height: number | null
  weight: number | null
  dominantHand: string | null
  bloodType: string | null
  visionLeft: number | null
  visionRight: number | null
  // Related records
  qualifications: { name: string; year: number; month: number }[]
  workHistory: {
    startYear: number
    startMonth: number
    endYear: number | null
    endMonth: number | null
    companyName: string
    position: string | null
    jobContent: string | null
  }[]
}): SkillSheetData {
  const birthDate = new Date(candidate.birthDate)

  return {
    // Anonymized name → Initials only
    initials: candidate.lastNameRomaji && candidate.firstNameRomaji
      ? getInitials(candidate.lastNameRomaji, candidate.firstNameRomaji)
      : `${candidate.lastNameKanji.charAt(0)}.${candidate.firstNameKanji.charAt(0)}.`,

    // Anonymized age → Range
    ageRange: getAgeRange(calculateAge(birthDate)),

    // Anonymized address → Prefecture only
    prefecture: candidate.prefecture,

    gender: candidate.gender,
    nationality: candidate.nationality,
    jlptLevel: candidate.jlptLevel,

    experience: [
      { label: "溶接", has: candidate.expWelding },
      { label: "フォークリフト", has: candidate.expForklift },
      { label: "ライン作業", has: candidate.expLineWork },
      { label: "組立", has: candidate.expAssembly },
      { label: "梱包", has: candidate.expPacking },
      { label: "検査", has: candidate.expInspection },
      { label: "塗装", has: candidate.expPainting },
      { label: "機械加工", has: candidate.expMachining },
      { label: "清掃", has: candidate.expCleaning },
      { label: "調理", has: candidate.expCooking },
    ],

    qualifications: candidate.qualifications.map((q) => ({
      name: q.name,
      year: q.year,
      month: q.month,
    })),

    // Anonymized work history — NO company names, only industry/role
    workHistory: candidate.workHistory.map((wh) => ({
      period: `${wh.startYear}/${wh.startMonth} - ${wh.endYear ? `${wh.endYear}/${wh.endMonth}` : "現在"}`,
      industry: wh.jobContent || "製造業",
      role: wh.position || "一般作業",
    })),

    physicalData: {
      height: candidate.height,
      weight: candidate.weight,
      dominantHand: candidate.dominantHand,
      bloodType: candidate.bloodType,
      visionLeft: candidate.visionLeft,
      visionRight: candidate.visionRight,
    },
  }
}
