import { z } from "zod"
import { dateStringSchema, phoneSchema } from "./shared"

// ===== 入社連絡票 Step 2: Employment Data =====
export const nyushaEmploymentSchema = z.object({
  companyId: z.string().min(1, "派遣先企業を選択してください"),
  hireDate: dateStringSchema,
  contractEndDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません")
    .optional()
    .or(z.literal("")),
  jikyu: z.coerce.number().int().min(1, "時給を入力してください"),
  position: z.string().max(100).optional().or(z.literal("")),
  productionLine: z.string().max(100).optional().or(z.literal("")),
  shift: z.string().max(50).optional().or(z.literal("")),
  dispatchSupervisor: z.string().max(50).optional().or(z.literal("")),
  clientSupervisor: z.string().max(50).optional().or(z.literal("")),
  // Bank account
  bankName: z.string().max(50).optional().or(z.literal("")),
  bankBranch: z.string().max(50).optional().or(z.literal("")),
  bankAccountType: z.enum(["普通", "当座"]).optional().or(z.literal("")),
  bankAccountNumber: z.string().max(20).optional().or(z.literal("")),
  // Emergency contact
  emergencyName: z.string().max(50).optional().or(z.literal("")),
  emergencyPhone: phoneSchema,
  emergencyRelation: z.string().max(30).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
})

export type NyushaEmploymentData = z.infer<typeof nyushaEmploymentSchema>

// ===== Full Nyusha schema (candidateId + employment data) =====
export const nyushaSchema = nyushaEmploymentSchema.extend({
  candidateId: z.string().min(1, "候補者を選択してください"),
})

export type NyushaFormData = z.infer<typeof nyushaSchema>

// ===== Step titles for the wizard =====
export const NYUSHA_STEP_TITLES = [
  "候補者確認",
  "雇用情報",
  "最終確認",
] as const
