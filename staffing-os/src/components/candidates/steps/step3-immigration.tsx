"use client"

import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import type { CandidateFormData } from "@/lib/validators/candidate"

const VISA_OPTIONS = [
  { value: "", label: "選択してください" },
  { value: "PERMANENT_RESIDENT", label: "永住者" },
  { value: "SPOUSE_OF_JAPANESE", label: "日本人の配偶者等" },
  { value: "LONG_TERM_RESIDENT", label: "定住者" },
  { value: "DESIGNATED_ACTIVITIES", label: "特定活動" },
  { value: "TECHNICAL_INTERN_1", label: "技能実習1号" },
  { value: "TECHNICAL_INTERN_2", label: "技能実習2号" },
  { value: "TECHNICAL_INTERN_3", label: "技能実習3号" },
  { value: "SPECIFIED_SKILLED_1", label: "特定技能1号" },
  { value: "SPECIFIED_SKILLED_2", label: "特定技能2号" },
  { value: "STUDENT", label: "留学" },
  { value: "DEPENDENT", label: "家族滞在" },
  { value: "OTHER", label: "その他" },
]

export function Step3Immigration() {
  const { register } = useFormContext<CandidateFormData>()

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="passportNumber">パスポート番号</Label>
        <Input id="passportNumber" {...register("passportNumber")} placeholder="AB1234567" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passportExpiry">パスポート有効期限</Label>
        <Input id="passportExpiry" type="date" {...register("passportExpiry")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="residenceCardNumber">在留カード番号</Label>
        <Input id="residenceCardNumber" {...register("residenceCardNumber")} placeholder="AB12345678CD" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="residenceCardExpiry">在留カード有効期限</Label>
        <Input id="residenceCardExpiry" type="date" {...register("residenceCardExpiry")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="visaStatus">在留資格</Label>
        <Select id="visaStatus" {...register("visaStatus")}>
          {VISA_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="visaExpiry">在留期限</Label>
        <Input id="visaExpiry" type="date" {...register("visaExpiry")} />
      </div>
    </div>
  )
}
