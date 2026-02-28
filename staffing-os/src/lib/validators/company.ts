import { z } from "zod"
import { postalCodeSchema, phoneSchema, emailSchema } from "./shared"

export const companySchema = z.object({
  name: z.string().min(1, "企業名を入力してください").max(100),
  nameKana: z.string().max(100).optional().or(z.literal("")),
  industry: z.string().max(50).optional().or(z.literal("")),
  postalCode: postalCodeSchema,
  prefecture: z.string().max(10).optional().or(z.literal("")),
  city: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  phone: phoneSchema,
  fax: z.string().max(20).optional().or(z.literal("")),
  contactName: z.string().max(50).optional().or(z.literal("")),
  contactEmail: emailSchema,
  notes: z.string().max(1000).optional().or(z.literal("")),
})

export type CompanyFormData = z.infer<typeof companySchema>
