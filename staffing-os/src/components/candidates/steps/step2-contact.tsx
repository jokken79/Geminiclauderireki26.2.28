"use client"

import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { PREFECTURES } from "@/lib/constants"
import type { CandidateFormData } from "@/lib/validators/candidate"

export function Step2Contact() {
  const { register, setValue, watch } = useFormContext<CandidateFormData>()

  const handlePostalCodeBlur = async () => {
    const postalCode = watch("postalCode")
    if (!postalCode) return
    const digits = postalCode.replace("-", "")
    if (digits.length !== 7) return

    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`)
      const data = await res.json()
      if (data.results?.[0]) {
        setValue("prefecture", data.results[0].address1)
        setValue("city", data.results[0].address2 + data.results[0].address3)
      }
    } catch {
      // Postal code API failed, user can enter manually
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="postalCode">郵便番号</Label>
        <Input
          id="postalCode"
          {...register("postalCode")}
          placeholder="123-4567"
          onBlur={handlePostalCodeBlur}
        />
        <p className="text-xs text-muted-foreground">入力後、住所を自動入力します</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prefecture">都道府県</Label>
        <Select id="prefecture" {...register("prefecture")}>
          <option value="">選択してください</option>
          {PREFECTURES.map((pref) => (
            <option key={pref} value={pref}>{pref}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="city">市区町村</Label>
        <Input id="city" {...register("city")} placeholder="豊田市" />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="addressLine1">町名・番地</Label>
        <Input id="addressLine1" {...register("addressLine1")} placeholder="トヨタ町1-1" />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="addressLine2">建物名・部屋番号</Label>
        <Input id="addressLine2" {...register("addressLine2")} placeholder="○○マンション 101号室" />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="addressFurigana">住所ふりがな</Label>
        <Input id="addressFurigana" {...register("addressFurigana")} placeholder="あいちけんとよたし..." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">電話番号</Label>
        <Input id="phone" {...register("phone")} placeholder="090-1234-5678" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input id="email" type="email" {...register("email")} placeholder="example@mail.com" />
      </div>
    </div>
  )
}
