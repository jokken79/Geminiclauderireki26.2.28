"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createHakenshain } from "@/actions/hakenshain"
import { calculateAge, toWareki } from "@/lib/wareki"
import { calculateTeishokubi } from "@/lib/teishokubi"
import { JLPT_LABELS } from "@/lib/constants"
import { NYUSHA_STEP_TITLES } from "@/lib/validators/hakenshain"
import type { NyushaEmploymentData } from "@/lib/validators/hakenshain"

interface NyushaWizardProps {
  candidate: {
    id: string
    lastNameKanji: string
    firstNameKanji: string
    lastNameFurigana: string
    firstNameFurigana: string
    lastNameRomaji: string | null
    firstNameRomaji: string | null
    birthDate: Date
    gender: string | null
    nationality: string
    phone: string | null
    email: string | null
    postalCode: string | null
    prefecture: string | null
    city: string | null
    addressLine1: string | null
    photoDataUrl: string | null
    visaStatus: string | null
    visaExpiry: Date | null
    jlptLevel: string
    emergencyContactName: string | null
    emergencyContactPhone: string | null
    emergencyContactRelation: string | null
  }
  companies: {
    id: string
    name: string
    industry: string | null
    prefecture: string | null
  }[]
}

export function NyushaWizard({ candidate, companies }: NyushaWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isPending, startTransition] = useTransition()

  // Employment form state
  const [formData, setFormData] = useState<NyushaEmploymentData>({
    companyId: "",
    hireDate: new Date().toISOString().split("T")[0],
    contractEndDate: "",
    jikyu: 0,
    position: "",
    productionLine: "",
    shift: "",
    dispatchSupervisor: "",
    clientSupervisor: "",
    bankName: "",
    bankBranch: "",
    bankAccountType: "",
    bankAccountNumber: "",
    emergencyName: candidate.emergencyContactName || "",
    emergencyPhone: candidate.emergencyContactPhone || "",
    emergencyRelation: candidate.emergencyContactRelation || "",
    notes: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = (field: keyof NyushaEmploymentData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.companyId) newErrors.companyId = "派遣先企業を選択してください"
    if (!formData.hireDate) newErrors.hireDate = "入社日を入力してください"
    if (!formData.jikyu || formData.jikyu <= 0) newErrors.jikyu = "時給を入力してください"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const goNext = () => {
    if (currentStep === 1 && !validateStep2()) return
    if (currentStep < 2) setCurrentStep((prev) => prev + 1)
  }

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1)
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createHakenshain({
        candidateId: candidate.id,
        ...formData,
      })

      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success("派遣社員として登録しました")
        router.push(`/hakenshain/${result.id}`)
      }
    })
  }

  const selectedCompany = companies.find((c) => c.id === formData.companyId)
  const teishokubiPreview = formData.hireDate
    ? calculateTeishokubi(new Date(formData.hireDate))
    : null

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <nav className="flex items-center justify-center gap-2">
        {NYUSHA_STEP_TITLES.map((title, i) => (
          <button
            key={title}
            type="button"
            onClick={() => {
              if (i < currentStep) setCurrentStep(i)
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              i === currentStep
                ? "bg-primary text-primary-foreground"
                : i < currentStep
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-default"
            )}
          >
            {i < currentStep && <Check className="h-3 w-3" />}
            <span>{i + 1}. {title}</span>
          </button>
        ))}
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>{NYUSHA_STEP_TITLES[currentStep]}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 1: Candidate Confirmation */}
          {currentStep === 0 && (
            <Step1CandidateConfirm candidate={candidate} />
          )}

          {/* Step 2: Employment Data */}
          {currentStep === 1 && (
            <Step2EmploymentData
              formData={formData}
              errors={errors}
              companies={companies}
              updateField={updateField}
              teishokubiPreview={teishokubiPreview}
            />
          )}

          {/* Step 3: Final Confirmation */}
          {currentStep === 2 && (
            <Step3FinalConfirm
              candidate={candidate}
              formData={formData}
              selectedCompany={selectedCompany}
              teishokubiPreview={teishokubiPreview}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={goBack} disabled={currentStep === 0}>
          戻る
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentStep + 1} / {NYUSHA_STEP_TITLES.length}
        </span>
        {currentStep < 2 ? (
          <Button onClick={goNext}>次へ</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "登録中..." : "派遣社員として登録"}
          </Button>
        )}
      </div>
    </div>
  )
}

// ===== Step 1: Candidate Confirmation =====

function Step1CandidateConfirm({ candidate }: { candidate: NyushaWizardProps["candidate"] }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        以下の候補者を派遣社員として登録します。内容を確認してください。
      </p>

      <div className="flex gap-6">
        {/* Photo */}
        <div className="shrink-0">
          {candidate.photoDataUrl ? (
            <div className="h-32 w-24 overflow-hidden rounded border">
              <img
                src={candidate.photoDataUrl}
                alt="証明写真"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-32 w-24 items-center justify-center rounded border bg-muted text-xs text-muted-foreground">
              写真なし
            </div>
          )}
        </div>

        {/* Candidate details */}
        <div className="grid gap-x-8 gap-y-1 md:grid-cols-2 text-sm flex-1">
          <Field label="氏名（漢字）" value={`${candidate.lastNameKanji} ${candidate.firstNameKanji}`} />
          <Field label="ふりがな" value={`${candidate.lastNameFurigana} ${candidate.firstNameFurigana}`} />
          {candidate.lastNameRomaji && (
            <Field label="ローマ字" value={`${candidate.lastNameRomaji} ${candidate.firstNameRomaji}`} />
          )}
          <Field
            label="生年月日"
            value={`${toWareki(new Date(candidate.birthDate))} (${calculateAge(new Date(candidate.birthDate))}歳)`}
          />
          <Field label="国籍" value={candidate.nationality} />
          <Field label="性別" value={candidate.gender} />
          <Field label="電話" value={candidate.phone} />
          <Field label="メール" value={candidate.email} />
          <Field
            label="住所"
            value={[candidate.prefecture, candidate.city, candidate.addressLine1].filter(Boolean).join(" ")}
          />
          <Field label="在留資格" value={candidate.visaStatus} />
          <Field
            label="ビザ期限"
            value={candidate.visaExpiry ? new Date(candidate.visaExpiry).toLocaleDateString("ja-JP") : null}
          />
          <Field label="JLPT" value={JLPT_LABELS[candidate.jlptLevel as keyof typeof JLPT_LABELS]} />
        </div>
      </div>
    </div>
  )
}

// ===== Step 2: Employment Data =====

function Step2EmploymentData({
  formData,
  errors,
  companies,
  updateField,
  teishokubiPreview,
}: {
  formData: NyushaEmploymentData
  errors: Record<string, string>
  companies: NyushaWizardProps["companies"]
  updateField: (field: keyof NyushaEmploymentData, value: string | number) => void
  teishokubiPreview: Date | null
}) {
  return (
    <div className="space-y-6">
      {/* Dispatch Info */}
      <div className="space-y-4">
        <h4 className="font-medium border-b pb-1">派遣情報</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>派遣先企業 *</Label>
            <select
              value={formData.companyId}
              onChange={(e) => updateField("companyId", e.target.value)}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-sm",
                errors.companyId && "border-red-500"
              )}
            >
              <option value="">選択してください</option>
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
            <Label>時給（円） *</Label>
            <Input
              type="number"
              value={formData.jikyu || ""}
              onChange={(e) => updateField("jikyu", parseInt(e.target.value) || 0)}
              placeholder="例: 1200"
              className={errors.jikyu ? "border-red-500" : ""}
            />
            {errors.jikyu && <p className="text-xs text-red-500 mt-1">{errors.jikyu}</p>}
          </div>

          <div>
            <Label>職種</Label>
            <Input
              value={formData.position}
              onChange={(e) => updateField("position", e.target.value)}
              placeholder="例: 製造ライン作業"
            />
          </div>

          <div>
            <Label>製造ライン</Label>
            <Input
              value={formData.productionLine}
              onChange={(e) => updateField("productionLine", e.target.value)}
              placeholder="例: A棟2F"
            />
          </div>

          <div>
            <Label>シフト</Label>
            <Input
              value={formData.shift}
              onChange={(e) => updateField("shift", e.target.value)}
              placeholder="例: 日勤 8:00-17:00"
            />
          </div>
        </div>
      </div>

      {/* 抵触日 Preview */}
      {teishokubiPreview && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <h4 className="font-medium text-blue-900 dark:text-blue-100">抵触日（自動計算）</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            入社日から3年後: <strong>{teishokubiPreview.toLocaleDateString("ja-JP")}</strong>
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            ※ 労働者派遣法に基づき、同一事業所への派遣期間は原則3年が上限です
          </p>
        </div>
      )}

      {/* Supervisors */}
      <div className="space-y-4">
        <h4 className="font-medium border-b pb-1">担当者</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>派遣元責任者</Label>
            <Input
              value={formData.dispatchSupervisor}
              onChange={(e) => updateField("dispatchSupervisor", e.target.value)}
            />
          </div>
          <div>
            <Label>派遣先責任者</Label>
            <Input
              value={formData.clientSupervisor}
              onChange={(e) => updateField("clientSupervisor", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bank Account */}
      <div className="space-y-4">
        <h4 className="font-medium border-b pb-1">銀行口座</h4>
        <div className="grid gap-4 md:grid-cols-2">
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
              placeholder="1234567"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4">
        <h4 className="font-medium border-b pb-1">緊急連絡先</h4>
        <div className="grid gap-4 md:grid-cols-3">
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
              placeholder="例: 配偶者"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label>備考</Label>
        <textarea
          value={formData.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
          placeholder="特記事項があれば入力してください"
        />
      </div>
    </div>
  )
}

// ===== Step 3: Final Confirmation =====

function Step3FinalConfirm({
  candidate,
  formData,
  selectedCompany,
  teishokubiPreview,
}: {
  candidate: NyushaWizardProps["candidate"]
  formData: NyushaEmploymentData
  selectedCompany?: { id: string; name: string; industry: string | null; prefecture: string | null }
  teishokubiPreview: Date | null
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
          以下の内容で派遣社員として登録します。登録後、候補者のステータスは「採用済み」に変更されます。
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Candidate summary */}
        <div className="space-y-3">
          <h4 className="font-medium border-b pb-1">候補者情報</h4>
          <Field label="氏名" value={`${candidate.lastNameKanji} ${candidate.firstNameKanji}`} />
          <Field label="国籍" value={candidate.nationality} />
          <Field
            label="生年月日"
            value={`${toWareki(new Date(candidate.birthDate))} (${calculateAge(new Date(candidate.birthDate))}歳)`}
          />
          <Field label="電話" value={candidate.phone} />
        </div>

        {/* Employment summary */}
        <div className="space-y-3">
          <h4 className="font-medium border-b pb-1">雇用情報</h4>
          <Field label="派遣先" value={selectedCompany?.name} />
          <Field label="入社日" value={formData.hireDate} />
          <Field label="契約終了日" value={formData.contractEndDate || "未定"} />
          <Field label="時給" value={`¥${formData.jikyu.toLocaleString()}`} />
          <Field label="職種" value={formData.position} />
          <Field label="製造ライン" value={formData.productionLine} />
          <Field label="シフト" value={formData.shift} />
          {teishokubiPreview && (
            <Field
              label="抵触日"
              value={teishokubiPreview.toLocaleDateString("ja-JP")}
            />
          )}
        </div>

        {/* Supervisors */}
        <div className="space-y-3">
          <h4 className="font-medium border-b pb-1">担当者</h4>
          <Field label="派遣元責任者" value={formData.dispatchSupervisor} />
          <Field label="派遣先責任者" value={formData.clientSupervisor} />
        </div>

        {/* Bank */}
        <div className="space-y-3">
          <h4 className="font-medium border-b pb-1">銀行口座</h4>
          <Field label="銀行名" value={formData.bankName} />
          <Field label="支店名" value={formData.bankBranch} />
          <Field label="口座種別" value={formData.bankAccountType} />
          <Field label="口座番号" value={formData.bankAccountNumber} />
        </div>

        {/* Emergency contact */}
        <div className="space-y-3">
          <h4 className="font-medium border-b pb-1">緊急連絡先</h4>
          <Field label="氏名" value={formData.emergencyName} />
          <Field label="電話" value={formData.emergencyPhone} />
          <Field label="続柄" value={formData.emergencyRelation} />
        </div>
      </div>

      {formData.notes && (
        <div>
          <h4 className="font-medium border-b pb-1 mb-2">備考</h4>
          <p className="text-sm">{formData.notes}</p>
        </div>
      )}
    </div>
  )
}

// ===== Shared Field component =====

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="font-medium">{String(value)}</span>
    </div>
  )
}
