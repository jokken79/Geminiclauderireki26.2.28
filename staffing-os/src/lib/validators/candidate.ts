import { z } from "zod"
import {
  postalCodeSchema,
  phoneSchema,
  emailSchema,
  dateStringSchema,
  optionalDateSchema,
  optionalPositiveNumberSchema,
} from "./shared"

// ===== Sub-schemas for related records =====

export const educationHistorySchema = z.object({
  year: z.coerce.number().int().min(1950).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  schoolName: z.string().min(1, "学校名を入力してください").max(100),
  faculty: z.string().max(100).optional().or(z.literal("")),
  eventType: z.string().min(1, "入学・卒業を選択してください"),
})

export const workHistorySchema = z.object({
  startYear: z.coerce.number().int().min(1950).max(2100),
  startMonth: z.coerce.number().int().min(1).max(12),
  endYear: z.coerce.number().int().min(1950).max(2100).optional().or(z.literal("").transform(() => undefined)),
  endMonth: z.coerce.number().int().min(1).max(12).optional().or(z.literal("").transform(() => undefined)),
  companyName: z.string().min(1, "会社名を入力してください").max(100),
  position: z.string().max(100).optional().or(z.literal("")),
  jobContent: z.string().max(200).optional().or(z.literal("")),
  eventType: z.string().min(1, "入社・退社を選択してください"),
})

export const qualificationSchema = z.object({
  year: z.coerce.number().int().min(1950).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  name: z.string().min(1, "資格名を入力してください").max(100),
  details: z.string().max(200).optional().or(z.literal("")),
})

export const familyMemberSchema = z.object({
  name: z.string().min(1, "氏名を入力してください").max(50),
  relationship: z.string().min(1, "続柄を入力してください").max(30),
  age: z.coerce.number().int().min(0).max(150).optional().or(z.literal("").transform(() => undefined)),
  liveTogether: z.boolean().default(false),
})

// ===== Step-level schemas =====

// Step 1: 基本情報
export const step1Schema = z.object({
  lastNameKanji: z.string().min(1, "氏（漢字）を入力してください").max(50),
  firstNameKanji: z.string().min(1, "名（漢字）を入力してください").max(50),
  lastNameFurigana: z.string().min(1, "ふりがな（氏）を入力してください").max(50),
  firstNameFurigana: z.string().min(1, "ふりがな（名）を入力してください").max(50),
  lastNameRomaji: z.string().max(50).optional().or(z.literal("")),
  firstNameRomaji: z.string().max(50).optional().or(z.literal("")),
  birthDate: dateStringSchema,
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional().or(z.literal("")),
  nationality: z.string().min(1, "国籍を入力してください").max(50),
})

// Step 2: 連絡先
export const step2Schema = z.object({
  postalCode: postalCodeSchema,
  prefecture: z.string().max(10).optional().or(z.literal("")),
  city: z.string().max(50).optional().or(z.literal("")),
  addressLine1: z.string().max(100).optional().or(z.literal("")),
  addressLine2: z.string().max(100).optional().or(z.literal("")),
  addressFurigana: z.string().max(200).optional().or(z.literal("")),
  phone: phoneSchema,
  email: emailSchema,
})

// Step 3: 在留情報
export const step3Schema = z.object({
  passportNumber: z.string().max(20).optional().or(z.literal("")),
  passportExpiry: optionalDateSchema,
  residenceCardNumber: z.string().max(20).optional().or(z.literal("")),
  residenceCardExpiry: optionalDateSchema,
  visaStatus: z.enum([
    "PERMANENT_RESIDENT", "SPOUSE_OF_JAPANESE", "LONG_TERM_RESIDENT",
    "DESIGNATED_ACTIVITIES", "TECHNICAL_INTERN_1", "TECHNICAL_INTERN_2",
    "TECHNICAL_INTERN_3", "SPECIFIED_SKILLED_1", "SPECIFIED_SKILLED_2",
    "STUDENT", "DEPENDENT", "OTHER",
  ]).optional().or(z.literal("")),
  visaExpiry: optionalDateSchema,
})

// Step 4: 写真
export const step4Schema = z.object({
  photoDataUrl: z.string().optional().or(z.literal("")),
})

// Step 5: 職歴
export const step5Schema = z.object({
  workHistory: z.array(workHistorySchema).default([]),
})

// Step 6: 資格・経験
export const step6Schema = z.object({
  expWelding: z.boolean().default(false),
  expForklift: z.boolean().default(false),
  expLineWork: z.boolean().default(false),
  expAssembly: z.boolean().default(false),
  expPacking: z.boolean().default(false),
  expInspection: z.boolean().default(false),
  expPainting: z.boolean().default(false),
  expMachining: z.boolean().default(false),
  expCleaning: z.boolean().default(false),
  expCooking: z.boolean().default(false),
  expOther: z.string().max(200).optional().or(z.literal("")),
  qualifications: z.array(qualificationSchema).default([]),
  hasDriverLicense: z.boolean().default(false),
  driverLicenseType: z.string().max(50).optional().or(z.literal("")),
  hasForkliftLicense: z.boolean().default(false),
  hasCraneLicense: z.boolean().default(false),
  hasWeldingCert: z.boolean().default(false),
})

// Step 7: 家族
export const step7Schema = z.object({
  familyMembers: z.array(familyMemberSchema).default([]),
})

// Step 8: その他
export const step8Schema = z.object({
  jlptLevel: z.enum(["N1", "N2", "N3", "N4", "N5", "NONE"]).default("NONE"),
  japaneseConversation: z.string().max(50).optional().or(z.literal("")),
  otherLanguages: z.string().max(200).optional().or(z.literal("")),
  bloodType: z.string().max(5).optional().or(z.literal("")),
  height: optionalPositiveNumberSchema,
  weight: optionalPositiveNumberSchema,
  shoeSize: optionalPositiveNumberSchema,
  dominantHand: z.string().max(10).optional().or(z.literal("")),
  visionLeft: optionalPositiveNumberSchema,
  visionRight: optionalPositiveNumberSchema,
  bentoPreference: z.string().max(100).optional().or(z.literal("")),
  allergies: z.string().max(200).optional().or(z.literal("")),
  emergencyContactName: z.string().max(50).optional().or(z.literal("")),
  emergencyContactPhone: phoneSchema,
  emergencyContactRelation: z.string().max(30).optional().or(z.literal("")),
  covidVaccineStatus: z.string().max(50).optional().or(z.literal("")),
})

// ===== Full candidate schema (for server-side validation) =====
export const candidateSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema)
  .merge(step6Schema)
  .merge(step7Schema)
  .merge(step8Schema)

export type CandidateFormData = z.infer<typeof candidateSchema>

// Step schemas array for multi-step form
export const STEP_SCHEMAS = [
  step1Schema,   // 0: 基本情報
  step2Schema,   // 1: 連絡先
  step3Schema,   // 2: 在留情報
  step4Schema,   // 3: 写真
  step5Schema,   // 4: 職歴
  step6Schema,   // 5: 資格・経験
  step7Schema,   // 6: 家族
  step8Schema,   // 7: その他
] as const

export const STEP_TITLES = [
  "基本情報",
  "連絡先",
  "在留情報",
  "写真",
  "職歴",
  "資格・経験",
  "家族",
  "その他",
  "確認",
] as const
