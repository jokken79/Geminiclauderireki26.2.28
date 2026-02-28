"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PREFECTURES } from "@/lib/constants"
import { createCompany, updateCompany } from "@/actions/companies"
import type { CompanyFormData } from "@/lib/validators/company"

interface CompanyFormProps {
  companyId?: string
  defaultValues?: Partial<CompanyFormData>
  mode: "create" | "edit"
}

export function CompanyForm({ companyId, defaultValues, mode }: CompanyFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState<CompanyFormData>({
    name: defaultValues?.name || "",
    nameKana: defaultValues?.nameKana || "",
    industry: defaultValues?.industry || "",
    postalCode: defaultValues?.postalCode || "",
    prefecture: defaultValues?.prefecture || "",
    city: defaultValues?.city || "",
    address: defaultValues?.address || "",
    phone: defaultValues?.phone || "",
    fax: defaultValues?.fax || "",
    contactName: defaultValues?.contactName || "",
    contactEmail: defaultValues?.contactEmail || "",
    notes: defaultValues?.notes || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = (field: keyof CompanyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      setErrors({ name: "企業名を入力してください" })
      return
    }

    startTransition(async () => {
      const result = mode === "create"
        ? await createCompany(formData)
        : await updateCompany(companyId!, formData)

      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success(mode === "create" ? "企業を登録しました" : "企業を更新しました")
        router.push("/companies")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>企業名 *</Label>
            <Input
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <Label>企業名（カナ）</Label>
            <Input
              value={formData.nameKana}
              onChange={(e) => updateField("nameKana", e.target.value)}
            />
          </div>
          <div>
            <Label>業種</Label>
            <Input
              value={formData.industry}
              onChange={(e) => updateField("industry", e.target.value)}
              placeholder="例: 自動車部品製造"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>所在地</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>郵便番号</Label>
            <Input
              value={formData.postalCode}
              onChange={(e) => updateField("postalCode", e.target.value)}
              placeholder="123-4567"
            />
          </div>
          <div>
            <Label>都道府県</Label>
            <select
              value={formData.prefecture}
              onChange={(e) => updateField("prefecture", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">選択してください</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>市区町村</Label>
            <Input
              value={formData.city}
              onChange={(e) => updateField("city", e.target.value)}
            />
          </div>
          <div>
            <Label>住所</Label>
            <Input
              value={formData.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>連絡先</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>電話番号</Label>
            <Input
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>
          <div>
            <Label>FAX</Label>
            <Input
              value={formData.fax}
              onChange={(e) => updateField("fax", e.target.value)}
            />
          </div>
          <div>
            <Label>担当者名</Label>
            <Input
              value={formData.contactName}
              onChange={(e) => updateField("contactName", e.target.value)}
            />
          </div>
          <div>
            <Label>担当者メール</Label>
            <Input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => updateField("contactEmail", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>備考</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : mode === "create" ? "登録する" : "更新する"}
        </Button>
      </div>
    </form>
  )
}
