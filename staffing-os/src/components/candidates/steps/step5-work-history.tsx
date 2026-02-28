"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import type { CandidateFormData } from "@/lib/validators/candidate"

export function Step5WorkHistory() {
  const { register, control } = useFormContext<CandidateFormData>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "workHistory",
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>職歴</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              startYear: new Date().getFullYear(),
              startMonth: 1,
              endYear: undefined,
              endMonth: undefined,
              companyName: "",
              position: "",
              jobContent: "",
              eventType: "入社",
            })
          }
        >
          <Plus className="mr-1 h-3 w-3" />
          追加
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          職歴はまだ登録されていません。「追加」ボタンから追加してください。
        </p>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">職歴 {index + 1}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">開始年</Label>
              <Input type="number" {...register(`workHistory.${index}.startYear`, { valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">開始月</Label>
              <Input type="number" min={1} max={12} {...register(`workHistory.${index}.startMonth`, { valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">終了年</Label>
              <Input type="number" {...register(`workHistory.${index}.endYear`)} placeholder="在職中は空欄" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">終了月</Label>
              <Input type="number" min={1} max={12} {...register(`workHistory.${index}.endMonth`)} placeholder="" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">会社名 *</Label>
              <Input {...register(`workHistory.${index}.companyName`)} placeholder="株式会社○○" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">職種</Label>
              <Input {...register(`workHistory.${index}.position`)} placeholder="製造" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">区分</Label>
              <Select {...register(`workHistory.${index}.eventType`)}>
                <option value="入社">入社</option>
                <option value="退社">退社</option>
                <option value="在職中">在職中</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">業務内容</Label>
            <Input {...register(`workHistory.${index}.jobContent`)} placeholder="自動車部品の組立" />
          </div>
        </div>
      ))}
    </div>
  )
}
