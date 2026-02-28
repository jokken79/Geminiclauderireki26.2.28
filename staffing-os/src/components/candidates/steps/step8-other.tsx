"use client"

import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { JLPT_LABELS, BLOOD_TYPES } from "@/lib/constants"
import type { CandidateFormData } from "@/lib/validators/candidate"

export function Step8Other() {
  const { register } = useFormContext<CandidateFormData>()

  return (
    <div className="space-y-6">
      {/* Languages */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">言語能力</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">JLPT</Label>
            <Select {...register("jlptLevel")}>
              {Object.entries(JLPT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">日本語会話力</Label>
            <Input {...register("japaneseConversation")} placeholder="日常会話レベル" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">その他言語</Label>
            <Input {...register("otherLanguages")} placeholder="英語、タガログ語" />
          </div>
        </div>
      </div>

      {/* Physical */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">身体情報</h3>
        <div className="grid gap-3 md:grid-cols-5">
          <div className="space-y-1">
            <Label className="text-xs">血液型</Label>
            <Select {...register("bloodType")}>
              <option value="">未選択</option>
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>{bt}型</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">身長 (cm)</Label>
            <Input type="number" step="0.1" {...register("height")} placeholder="170" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">体重 (kg)</Label>
            <Input type="number" step="0.1" {...register("weight")} placeholder="65" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">靴のサイズ</Label>
            <Input type="number" step="0.5" {...register("shoeSize")} placeholder="27" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">利き手</Label>
            <Select {...register("dominantHand")}>
              <option value="">未選択</option>
              <option value="右">右</option>
              <option value="左">左</option>
              <option value="両方">両方</option>
            </Select>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">視力（左）</Label>
            <Input type="number" step="0.1" {...register("visionLeft")} placeholder="1.0" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">視力（右）</Label>
            <Input type="number" step="0.1" {...register("visionRight")} placeholder="1.0" />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">食事・アレルギー</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">弁当の希望</Label>
            <Input {...register("bentoPreference")} placeholder="肉弁当" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">アレルギー</Label>
            <Input {...register("allergies")} placeholder="なし" />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">緊急連絡先</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">氏名</Label>
            <Input {...register("emergencyContactName")} placeholder="山田花子" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">電話番号</Label>
            <Input {...register("emergencyContactPhone")} placeholder="090-9876-5432" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">続柄</Label>
            <Input {...register("emergencyContactRelation")} placeholder="配偶者" />
          </div>
        </div>
      </div>

      {/* COVID */}
      <div className="space-y-1">
        <Label className="text-xs">ワクチン接種状況</Label>
        <Input {...register("covidVaccineStatus")} placeholder="3回接種済み" />
      </div>
    </div>
  )
}
