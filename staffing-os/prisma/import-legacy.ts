/**
 * Import Legacy Candidates from Access DB → PostgreSQL
 *
 * Usage:
 *   1. First run: python prisma/export-access.py
 *   2. Then run:  npx tsx prisma/import-legacy.ts
 *
 * Reads prisma/legacy-import/candidates.json and inserts into PostgreSQL via Prisma.
 */

import { PrismaClient, VisaStatus, Gender, JlptLevel, CandidateStatus } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const JSON_PATH = path.join(__dirname, 'legacy-import', 'candidates.json')

// ─── Type for imported data ─────────────────────────────────────────────

interface LegacyCandidate {
  lastNameKanji: string
  firstNameKanji?: string | null
  lastNameFurigana?: string | null
  firstNameFurigana?: string | null
  lastNameRomaji?: string | null
  firstNameRomaji?: string | null
  birthDate?: string | null
  gender?: string | null
  nationality?: string | null
  bloodType?: string | null
  height?: string | null
  weight?: string | null
  shoeSize?: string | null
  dominantHand?: string | null
  postalCode?: string | null
  prefecture?: string | null
  city?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  phone?: string | null
  mobile?: string | null
  email?: string | null
  passportNumber?: string | null
  passportExpiry?: string | null
  residenceCardNumber?: string | null
  residenceCardExpiry?: string | null
  visaStatus?: string | null
  visaStatusOther?: string | null
  visaExpiry?: string | null
  photoDataUrl?: string | null
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
  expLineLeader: boolean
  expOther?: string | null
  hasDriverLicense: boolean
  driverLicenseType?: string | null
  hasForkliftLicense: boolean
  hasCraneLicense: boolean
  hasWeldingCert: boolean
  hasTamakake: boolean
  jlptLevel?: string | null
  japaneseConversation?: string | null
  speakLevel?: string | null
  listenLevel?: string | null
  kanjiReadLevel?: string | null
  kanjiWriteLevel?: string | null
  hiraganaReadLevel?: string | null
  hiraganaWriteLevel?: string | null
  katakanaReadLevel?: string | null
  katakanaWriteLevel?: string | null
  bentoPreference?: string | null
  lunchPref?: string | null
  allergies?: string | null
  covidVaccineStatus?: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  emergencyContactRelation?: string | null
  receptionDate?: string | null
  timeInJapan?: string | null
  uniformSize?: string | null
  waist?: string | null
  safetyShoes?: string | null
  glasses?: string | null
  carOwner?: string | null
  insurance?: string | null
  licenseExpiry?: string | null
  education?: string | null
  major?: string | null
  commuteMethod?: string | null
  commuteTimeMin?: number | null
  registeredAddress?: string | null
  otherLanguages?: string | null
  spouse?: string | null
  interviewResult?: string | null
  antigenTestResult?: string | null
  antigenTestDate?: string | null
  jlptExamTaken?: boolean
  jlptExamDate?: string | null
  jlptExamScore?: string | null
  jlptExamPlanned?: string | null
  qualificationsText?: string[]
  familyMembers: LegacyFamilyMember[]
  workHistory: LegacyWorkHistory[]
  legacyId?: number
  _legacyId: number
  status: string
}

interface LegacyFamilyMember {
  name: string
  relationship: string
  age?: string | null
  liveTogether: boolean
  residence?: string | null
  dependent?: string | null
  sortOrder: number
}

interface LegacyWorkHistory {
  startYear?: number | null
  startMonth?: number | null
  endYear?: number | null
  endMonth?: number | null
  companyName: string
  position?: string | null
  jobContent?: string | null
  eventType: string
  hakenmoto?: string | null
  hakensaki?: string | null
  workLocation?: string | null
  sortOrder: number
}

// ─── Helpers ────────────────────────────────────────────────────────────

function toDate(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? undefined : d
}

/** Truncate string to max length for VarChar fields */
function trunc(val: string | null | undefined, max: number): string | undefined {
  if (!val) return undefined
  return val.length > max ? val.slice(0, max) : val
}

function toFloat(val: string | number | null | undefined): number | undefined {
  if (val === null || val === undefined || val === '') return undefined
  const n = typeof val === 'number' ? val : parseFloat(String(val))
  return isNaN(n) ? undefined : n
}

function toGender(val: string | null | undefined): Gender | undefined {
  if (!val) return undefined
  const map: Record<string, Gender> = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER',
    PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
  }
  return map[val] || undefined
}

function toVisaStatus(val: string | null | undefined): VisaStatus | undefined {
  if (!val) return undefined
  const valid: VisaStatus[] = [
    'PERMANENT_RESIDENT', 'SPOUSE_OF_JAPANESE', 'LONG_TERM_RESIDENT',
    'DESIGNATED_ACTIVITIES', 'ENGINEER_HUMANITIES', 'CULTURAL_ACTIVITIES',
    'HIGHLY_SKILLED_1', 'HIGHLY_SKILLED_2', 'INTRA_COMPANY_TRANSFER',
    'NURSING_CARE', 'TECHNICAL_INTERN_1', 'TECHNICAL_INTERN_2', 'TECHNICAL_INTERN_3',
    'SPECIFIED_SKILLED_1', 'SPECIFIED_SKILLED_2', 'STUDENT', 'DEPENDENT', 'OTHER',
  ]
  return valid.includes(val as VisaStatus) ? (val as VisaStatus) : 'OTHER'
}

function toJlpt(val: string | null | undefined): JlptLevel {
  if (!val) return 'NONE'
  const map: Record<string, JlptLevel> = {
    N1: 'N1', N2: 'N2', N3: 'N3', N4: 'N4', N5: 'N5', NONE: 'NONE',
  }
  return map[val] || 'NONE'
}

// ─── Main Import ────────────────────────────────────────────────────────

async function main() {
  console.log(`Reading ${JSON_PATH}...`)

  if (!fs.existsSync(JSON_PATH)) {
    console.error(`File not found: ${JSON_PATH}`)
    console.error('Run "python prisma/export-access.py" first.')
    process.exit(1)
  }

  const raw = fs.readFileSync(JSON_PATH, 'utf-8')
  const candidates: LegacyCandidate[] = JSON.parse(raw)
  console.log(`Loaded ${candidates.length} candidates from JSON`)

  // Check if DB already has candidates
  const existingCount = await prisma.candidate.count()
  if (existingCount > 0) {
    console.warn(`WARNING: Database already has ${existingCount} candidates.`)
    console.warn('This import will ADD to existing data. Press Ctrl+C to abort.')
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  let success = 0
  let failed = 0
  const errors: { legacyId: number; error: string }[] = []

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]

    try {
      await prisma.candidate.create({
        data: {
          // Legacy ID
          legacyId: c.legacyId ?? c._legacyId ?? undefined,

          // Names (VarChar 50)
          lastNameKanji: trunc(c.lastNameKanji, 50) || 'Unknown',
          firstNameKanji: trunc(c.firstNameKanji, 50) || '',
          lastNameFurigana: trunc(c.lastNameFurigana || c.lastNameKanji, 50) || 'Unknown',
          firstNameFurigana: trunc(c.firstNameFurigana || c.firstNameKanji, 50) || '',
          lastNameRomaji: trunc(c.lastNameRomaji, 50),
          firstNameRomaji: trunc(c.firstNameRomaji, 50),

          // Personal
          birthDate: toDate(c.birthDate) || new Date('1900-01-01'),
          gender: toGender(c.gender),
          nationality: trunc(c.nationality, 50) || 'Unknown',
          bloodType: trunc(c.bloodType, 5),
          height: toFloat(c.height),
          weight: toFloat(c.weight),
          shoeSize: toFloat(c.shoeSize),
          dominantHand: trunc(c.dominantHand, 10),

          // Contact
          postalCode: trunc(c.postalCode, 8),
          prefecture: trunc(c.prefecture, 10),
          city: trunc(c.city, 50),
          addressLine1: trunc(c.addressLine1, 100),
          addressLine2: trunc(c.addressLine2, 100),
          phone: trunc(c.phone || c.mobile, 20),
          email: trunc(c.email, 100),

          // Immigration
          passportNumber: trunc(c.passportNumber, 20),
          passportExpiry: toDate(c.passportExpiry),
          residenceCardNumber: trunc(c.residenceCardNumber, 20),
          residenceCardExpiry: toDate(c.residenceCardExpiry),
          visaStatus: toVisaStatus(c.visaStatus),
          visaExpiry: toDate(c.visaExpiry),

          // Photo - imported in second pass to avoid huge error messages
          // photoDataUrl: c.photoDataUrl || undefined,

          // Personal — new
          spouse: trunc(c.spouse, 3),

          // Experience
          expWelding: c.expWelding || false,
          expForklift: c.expForklift || false,
          expLineWork: c.expLineWork || false,
          expAssembly: c.expAssembly || false,
          expPacking: c.expPacking || false,
          expInspection: c.expInspection || false,
          expPainting: c.expPainting || false,
          expMachining: c.expMachining || false,
          expCleaning: c.expCleaning || false,
          expCooking: c.expCooking || false,
          expLineLeader: c.expLineLeader || false,
          expOther: trunc(c.expOther, 200),

          // Licenses
          hasDriverLicense: c.hasDriverLicense || false,
          driverLicenseType: trunc(c.driverLicenseType, 50),
          hasForkliftLicense: c.hasForkliftLicense || false,
          hasCraneLicense: c.hasCraneLicense || false,
          hasWeldingCert: c.hasWeldingCert || false,
          hasTamakake: c.hasTamakake || false,

          // Language
          jlptLevel: toJlpt(c.jlptLevel),
          japaneseConversation: trunc(c.japaneseConversation, 50),
          otherLanguages: trunc(c.otherLanguages, 200),

          // Preferences
          bentoPreference: trunc(c.bentoPreference, 100),
          allergies: trunc(c.allergies, 200),

          // Interview
          interviewResult: trunc(c.interviewResult, 50),
          covidVaccineStatus: trunc(c.covidVaccineStatus, 50),
          antigenTestResult: trunc(c.antigenTestResult, 10),
          antigenTestDate: toDate(c.antigenTestDate),

          // Emergency
          emergencyContactName: trunc(c.emergencyContactName, 50),
          emergencyContactPhone: trunc(c.emergencyContactPhone, 20),
          emergencyContactRelation: trunc(c.emergencyContactRelation, 30),

          // Rirekisho fields
          receptionDate: toDate(c.receptionDate),
          timeInJapan: trunc(c.timeInJapan, 10),
          mobile: trunc(c.mobile, 20),
          uniformSize: trunc(c.uniformSize, 5),
          waist: trunc(c.waist, 10),
          safetyShoes: trunc(c.safetyShoes, 3),
          glasses: trunc(c.glasses, 3),
          carOwner: trunc(c.carOwner, 3),
          insurance: trunc(c.insurance, 3),
          licenseExpiry: toDate(c.licenseExpiry),
          education: trunc(c.education, 100),
          major: trunc(c.major, 100),
          speakLevel: trunc(c.speakLevel, 30),
          listenLevel: trunc(c.listenLevel, 30),
          kanjiReadLevel: trunc(c.kanjiReadLevel, 15),
          kanjiWriteLevel: trunc(c.kanjiWriteLevel, 15),
          hiraganaReadLevel: trunc(c.hiraganaReadLevel, 15),
          hiraganaWriteLevel: trunc(c.hiraganaWriteLevel, 15),
          katakanaReadLevel: trunc(c.katakanaReadLevel, 15),
          katakanaWriteLevel: trunc(c.katakanaWriteLevel, 15),
          commuteMethod: trunc(c.commuteMethod, 20),
          commuteTimeMin: c.commuteTimeMin != null ? String(c.commuteTimeMin).slice(0, 10) : undefined,
          lunchPref: trunc(c.lunchPref, 10),
          registeredAddress: trunc(c.registeredAddress, 200),

          // JLPT exam details
          jlptExamTaken: c.jlptExamTaken || false,
          jlptExamDate: trunc(c.jlptExamDate, 20),
          jlptExamScore: trunc(c.jlptExamScore, 20),
          jlptExamPlanned: toDate(c.jlptExamPlanned),

          // Status
          status: 'APPROVED' as CandidateStatus,

          // Nested: Work History (filter out entries without required startYear/startMonth)
          ...((() => {
            const validWh = (c.workHistory || [])
              .filter(wh => wh.companyName && wh.startYear != null && wh.startMonth != null)
            return validWh.length > 0 ? {
              workHistory: {
                create: validWh.map(wh => ({
                  startYear: wh.startYear!,
                  startMonth: wh.startMonth!,
                  endYear: wh.endYear ?? undefined,
                  endMonth: wh.endMonth ?? undefined,
                  companyName: (wh.companyName || '').slice(0, 100),
                  position: trunc(wh.position, 100),
                  jobContent: trunc(wh.jobContent, 200),
                  eventType: (wh.eventType || '入社').slice(0, 20),
                  hakenmoto: trunc(wh.hakenmoto, 100),
                  hakensaki: trunc(wh.hakensaki, 100),
                  workLocation: trunc(wh.workLocation, 100),
                  sortOrder: wh.sortOrder,
                })),
              }
            } : {}
          })()),

          // Nested: Qualifications (from 有資格取得 text fields)
          ...((() => {
            const quals = (c.qualificationsText || []).filter(q => q && q.trim())
            return quals.length > 0 ? {
              qualifications: {
                create: quals.map((q, idx) => ({
                  year: new Date().getFullYear(),
                  month: 1,
                  name: q.slice(0, 100),
                  sortOrder: idx,
                })),
              }
            } : {}
          })()),

          // Nested: Family Members
          familyMembers: c.familyMembers.length > 0 ? {
            create: c.familyMembers.map(fm => ({
              name: (fm.name || '').slice(0, 50),
              relationship: (fm.relationship || '').slice(0, 30),
              age: fm.age ? parseInt(String(fm.age), 10) || undefined : undefined,
              liveTogether: fm.liveTogether,
              residence: trunc(fm.residence, 10),
              dependent: trunc(fm.dependent, 3),
              sortOrder: fm.sortOrder,
            })),
          } : undefined,
        },
      })

      success++
    } catch (err) {
      failed++
      const errorMsg = err instanceof Error ? err.message : String(err)
      // Extract just the actual error reason (after the data dump)
      const reasonMatch = errorMsg.match(/\}\s*\)\s*\n\n(.+)/s)
      const reason = reasonMatch ? reasonMatch[1].slice(0, 500) : errorMsg.slice(-500)
      errors.push({ legacyId: c._legacyId, error: reason })
      if (failed <= 3) {
        console.error(`  ERROR ID ${c._legacyId}: ${reason.slice(0, 200)}`)
      }
    }

    if ((i + 1) % 100 === 0) {
      console.log(`  Progress: ${i + 1}/${candidates.length} (OK: ${success}, Fail: ${failed})`)
    }
  }

  // Final stats
  console.log('\n═══════════════════════════════════════')
  console.log('  IMPORT COMPLETE')
  console.log('═══════════════════════════════════════')
  console.log(`  Total processed: ${candidates.length}`)
  console.log(`  Success: ${success}`)
  console.log(`  Failed: ${failed}`)

  if (errors.length > 0) {
    console.log('\n  Errors:')
    for (const e of errors.slice(0, 20)) {
      console.log(`    Legacy ID ${e.legacyId}: ${e.error}`)
    }
    if (errors.length > 20) {
      console.log(`    ... and ${errors.length - 20} more`)
    }

    // Write full error log
    const errorLogPath = path.join(__dirname, 'legacy-import', 'import-errors.json')
    fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2))
    console.log(`\n  Full error log: ${errorLogPath}`)
  }

  // Verify
  const finalCount = await prisma.candidate.count()
  console.log(`\n  Total candidates in DB: ${finalCount}`)

  await prisma.$disconnect()
}

main().catch(err => {
  console.error('Fatal error:', err)
  prisma.$disconnect()
  process.exit(1)
})
