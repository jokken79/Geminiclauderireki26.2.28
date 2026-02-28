"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createUkeoi } from "@/actions/ukeoi"
import type { UkeoiFormData } from "@/lib/validators/ukeoi"

interface UkeoiFormProps {
  candidates: {
    id: string
    lastNameKanji: string
    firstNameKanji: string
    lastNameFurigana: string
    firstNameFurigana: string
    nationality: string
  }[]
  companies: {
    id: string
    name: string
    industry: string | null
  }[]
}

export function UkeoiForm({ candidates, companies }: UkeoiFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState<UkeoiFormData>({
    candidateId: "",
    companyId: "",
    hireDate: new Date().toISOString().split("T")[0],
    contractEndDate: "",
    monthlySalary: 0,
    position: "",
    projectName: "",
    internalSupervisor: "",
    bankName: "",
    bankBranch: "",
    bankAccountType: "",
    bankAccountNumber: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
    notes: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = (field: keyof UkeoiFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.candidateId) newErrors.candidateId = "候補者を選択してください"
    if (!formData.companyId) newErrors.companyId = "企業を選択してください"
    if (!formData.hireDate) newErrors.hireDate = "入社日を入力してください"
    if (!formData.monthlySalary || formData.monthlySalary <= 0) newErrors.monthlySalary = "月給を入力してください"
    if (!formData.internalSupervisor) newErrors.internalSupervisor = "自社の現場責任者は必須です（偽装請負防止）"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      const result = await createUkeoi(formData)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success("請負社員として登録しました")
        router.push(`/ukeoi/${result.id}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 偽装請負 Warning */}
      <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950">
        <div className="flex gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-900 dark:text-amber-100">
              偽装請負防止に関する注意事項
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              請負契約において、発注者が請負労働者に直接指揮命令を行うことは「偽装請負」に該当し、
              労働者派遣法違反となります。必ず<strong>自社の現場責任者</strong>を配置し、
              自社の責任で業務を遂行してください。
            </p>
            <ul className="text-xs text-amber-700 dark:text-amber-300 mt-2 list-disc list-inside space-y-1">
              <li>発注者からの直接の指揮命令は禁止です</li>
              <li>自社の現場責任者が作業指示・管理を行ってください</li>
              <li>労働者の配置・評価は自社で決定してください</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Selection */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>候補者 *</Label>
            <select
              value={formData.candidateId}
              onChange={(e) => updateField("candidateId", e.target.value)}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-sm",
                errors.candidateId && "border-red-500"
              )}
            >
              <option value="">候補者を選択</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.lastNameKanji} {c.firstNameKanji} ({c.nationality})
                </option>
              ))}
            </select>
            {errors.candidateId && <p className="text-xs text-red-500 mt-1">{errors.candidateId}</p>}
          </div>

          <div>
            <Label>企業 *</Label>
            <select
              value={formData.companyId}
              onChange={(e) => updateField("companyId", e.target.value)}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-sm",
                errors.companyId && "border-red-500"
              )}
            >
              <option value="">企業を選択</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.industry ? ` (${c.industry})` : ""}
                </option>
              ))}
            </select>
            {errors.companyId && <p className="text-xs text-red-500 mt-1">{errors.companyId}</p>}
          </div>

          <div>
            <Label>入社日 *</Label>
            <Input
              type="date"
              value={formData.hireDate}
              onChange={(e) => updateField("hireDate", e.target.value)}
              className={errors.hireDate ? "border-red-500" : ""}
            />
            {errors.hireDate && <p className="text-xs text-red-500 mt-1">{errors.hireDate}</p>}
          </div>

          <div>
            <Label>契約終了日</Label>
            <Input
              type="date"
              value={formData.contractEndDate}
              onChange={(e) => updateField("contractEndDate", e.target.value)}
            />
          </div>

          <div>
            <Label>月給（円） *</Label>
            <Input
              type="number"
              value={formData.monthlySalary || ""}
              onChange={(e) => updateField("monthlySalary", parseInt(e.target.value) || 0)}
              placeholder="例: 250000"
              className={errors.monthlySalary ? "border-red-500" : ""}
            />
            {errors.monthlySalary && <p className="text-xs text-red-500 mt-1">{errors.monthlySalary}</p>}
          </div>

          <div>
            <Label>職種</Label>
            <Input
              value={formData.position}
              onChange={(e) => updateField("position", e.target.value)}
            />
          </div>

          <div>
            <Label>プロジェクト名</Label>
            <Input
              value={formData.projectName}
              onChange={(e) => updateField("projectName", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Internal Supervisor — REQUIRED with strong visual emphasis */}
      <Card className="border-amber-300 dark:border-amber-700">
        <CardHeader className="bg-amber-50 dark:bg-amber-950 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <AlertTriangle className="h-5 w-5" />
            自社現場責任者（必須）
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div>
            <Label>現場責任者名 *</Label>
            <Input
              value={formData.internalSupervisor}
              onChange={(e) => updateField("internalSupervisor", e.target.value)}
              placeholder="自社の現場責任者の氏名"
              className={cn(
                "border-2",
                errors.internalSupervisor ? "border-red-500" : "border-amber-300 dark:border-amber-600"
              )}
            />
            {errors.internalSupervisor && (
              <p className="text-xs text-red-500 mt-1">{errors.internalSupervisor}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              偽装請負防止のため、自社の現場責任者の配置が法律で義務付けられています
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bank Account */}
      <Card>
        <CardHeader>
          <CardTitle>銀行口座</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>銀行名</Label>
            <Input
              value={formData.bankName}
              onChange={(e) => updateField("bankName", e.target.value)}
            />
          </div>
          <div>
            <Label>支店名</Label>
            <Input
              value={formData.bankBranch}
              onChange={(e) => updateField("bankBranch", e.target.value)}
            />
          </div>
          <div>
            <Label>口座種別</Label>
            <select
              value={formData.bankAccountType}
              onChange={(e) => updateField("bankAccountType", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">選択してください</option>
              <option value="普通">普通</option>
              <option value="当座">当座</option>
            </select>
          </div>
          <div>
            <Label>口座番号</Label>
            <Input
              value={formData.bankAccountNumber}
              onChange={(e) => updateField("bankAccountNumber", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>緊急連絡先</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>氏名</Label>
            <Input
              value={formData.emergencyName}
              onChange={(e) => updateField("emergencyName", e.target.value)}
            />
          </div>
          <div>
            <Label>電話番号</Label>
            <Input
              value={formData.emergencyPhone}
              onChange={(e) => updateField("emergencyPhone", e.target.value)}
            />
          </div>
          <div>
            <Label>続柄</Label>
            <Input
              value={formData.emergencyRelation}
              onChange={(e) => updateField("emergencyRelation", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>備考</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
            placeholder="特記事項があれば入力してください"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
        <Button type="submit" disabled={isPending} className="bg-amber-600 hover:bg-amber-700">
          {isPending ? "登録中..." : "請負社員として登録"}
        </Button>
      </div>
    </form>
  )
}
