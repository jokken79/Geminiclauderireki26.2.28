"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { CandidateFormData } from "@/lib/validators/candidate"

const EXPERIENCE_FIELDS = [
  { name: "expWelding" as const, label: "溶接" },
  { name: "expForklift" as const, label: "フォークリフト" },
  { name: "expLineWork" as const, label: "ライン作業" },
  { name: "expAssembly" as const, label: "組立" },
  { name: "expPacking" as const, label: "梱包" },
  { name: "expInspection" as const, label: "検品" },
  { name: "expPainting" as const, label: "塗装" },
  { name: "expMachining" as const, label: "機械加工" },
  { name: "expCleaning" as const, label: "清掃" },
  { name: "expCooking" as const, label: "調理" },
]

export function Step6Qualifications() {
  const { register, control } = useFormContext<CandidateFormData>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "qualifications",
  })

  return (
    <div className="space-y-6">
      {/* Experience Checkboxes */}
      <div className="space-y-3">
        <Label>経験（該当するものにチェック）</Label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {EXPERIENCE_FIELDS.map((field) => (
            <label key={field.name} className="flex items-center gap-2 text-sm">
              <Checkbox {...register(field.name)} />
              {field.label}
            </label>
          ))}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">その他の経験</Label>
          <Input {...register("expOther")} placeholder="その他の経験を入力" />
        </div>
      </div>

      {/* Licenses */}
      <div className="space-y-3">
        <Label>免許・資格</Label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox {...register("hasDriverLicense")} />
            運転免許
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox {...register("hasForkliftLicense")} />
            フォークリフト
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox {...register("hasCraneLicense")} />
            クレーン
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox {...register("hasWeldingCert")} />
            溶接資格
          </label>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">運転免許の種類</Label>
          <Input {...register("driverLicenseType")} placeholder="普通自動車免許" />
        </div>
      </div>

      {/* Additional Qualifications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>その他の資格</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ year: new Date().getFullYear(), month: 1, name: "", details: "" })}
          >
            <Plus className="mr-1 h-3 w-3" />
            追加
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-end gap-2 rounded-lg border p-3">
            <div className="grid flex-1 gap-2 md:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs">取得年</Label>
                <Input type="number" {...register(`qualifications.${index}.year`, { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">取得月</Label>
                <Input type="number" min={1} max={12} {...register(`qualifications.${index}.month`, { valueAsNumber: true })} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">資格名 *</Label>
                <Input {...register(`qualifications.${index}.name`)} placeholder="危険物取扱者乙種第4類" />
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
