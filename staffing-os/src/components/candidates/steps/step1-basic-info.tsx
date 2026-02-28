"use client"

import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import type { CandidateFormData } from "@/lib/validators/candidate"

const GENDER_OPTIONS = [
  { value: "", label: "選択してください" },
  { value: "MALE", label: "男性" },
  { value: "FEMALE", label: "女性" },
  { value: "OTHER", label: "その他" },
  { value: "PREFER_NOT_TO_SAY", label: "回答しない" },
]

export function Step1BasicInfo() {
  const { register, formState: { errors } } = useFormContext<CandidateFormData>()

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="lastNameKanji">氏（漢字） *</Label>
        <Input id="lastNameKanji" {...register("lastNameKanji")} placeholder="山田" />
        {errors.lastNameKanji && <p className="text-xs text-destructive">{errors.lastNameKanji.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="firstNameKanji">名（漢字） *</Label>
        <Input id="firstNameKanji" {...register("firstNameKanji")} placeholder="太郎" />
        {errors.firstNameKanji && <p className="text-xs text-destructive">{errors.firstNameKanji.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastNameFurigana">ふりがな（氏） *</Label>
        <Input id="lastNameFurigana" {...register("lastNameFurigana")} placeholder="やまだ" />
        {errors.lastNameFurigana && <p className="text-xs text-destructive">{errors.lastNameFurigana.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="firstNameFurigana">ふりがな（名） *</Label>
        <Input id="firstNameFurigana" {...register("firstNameFurigana")} placeholder="たろう" />
        {errors.firstNameFurigana && <p className="text-xs text-destructive">{errors.firstNameFurigana.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastNameRomaji">ローマ字（氏）</Label>
        <Input id="lastNameRomaji" {...register("lastNameRomaji")} placeholder="Yamada" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="firstNameRomaji">ローマ字（名）</Label>
        <Input id="firstNameRomaji" {...register("firstNameRomaji")} placeholder="Taro" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">生年月日 *</Label>
        <Input id="birthDate" type="date" {...register("birthDate")} />
        {errors.birthDate && <p className="text-xs text-destructive">{errors.birthDate.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">性別</Label>
        <Select id="gender" {...register("gender")}>
          {GENDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="nationality">国籍 *</Label>
        <Input id="nationality" {...register("nationality")} placeholder="フィリピン" />
        {errors.nationality && <p className="text-xs text-destructive">{errors.nationality.message}</p>}
      </div>
    </div>
  )
}
