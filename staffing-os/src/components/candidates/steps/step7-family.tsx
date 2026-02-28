"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { CandidateFormData } from "@/lib/validators/candidate"

export function Step7Family() {
  const { register, control } = useFormContext<CandidateFormData>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "familyMembers",
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>家族構成</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({ name: "", relationship: "", age: undefined, liveTogether: false })
          }
          disabled={fields.length >= 5}
        >
          <Plus className="mr-1 h-3 w-3" />
          追加（最大5人）
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          家族情報はまだ登録されていません。
        </p>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">家族 {index + 1}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">氏名 *</Label>
              <Input {...register(`familyMembers.${index}.name`)} placeholder="山田花子" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">続柄 *</Label>
              <Input {...register(`familyMembers.${index}.relationship`)} placeholder="配偶者" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">年齢</Label>
              <Input type="number" {...register(`familyMembers.${index}.age`)} placeholder="30" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox {...register(`familyMembers.${index}.liveTogether`)} />
            同居
          </label>
        </div>
      ))}
    </div>
  )
}
