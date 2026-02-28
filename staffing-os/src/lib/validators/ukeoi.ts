import { z } from "zod"
import { dateStringSchema, phoneSchema } from "./shared"

export const ukeoiSchema = z.object({
  candidateId: z.string().min(1, "候補者を選択してください"),
  companyId: z.string().min(1, "企業を選択してください"),
  hireDate: dateStringSchema,
  contractEndDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません")
    .optional()
    .or(z.literal("")),
  monthlySalary: z.coerce.number().int().min(1, "月給を入力してください"),
  position: z.string().max(100).optional().or(z.literal("")),
  projectName: z.string().max(100).optional().or(z.literal("")),
  // 偽装請負防止 — REQUIRED
  internalSupervisor: z.string().min(1, "自社の現場責任者は必須です（偽装請負防止）").max(50),
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

export type UkeoiFormData = z.infer<typeof ukeoiSchema>
