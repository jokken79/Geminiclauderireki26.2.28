"use client"

import { useFormContext } from "react-hook-form"
import { JLPT_LABELS, CANDIDATE_STATUS_LABELS } from "@/lib/constants"
import type { CandidateFormData } from "@/lib/validators/candidate"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium border-b pb-1">{title}</h3>
      <div className="grid gap-x-6 gap-y-1 md:grid-cols-2 text-sm">
        {children}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === "") return null
  const display = typeof value === "boolean" ? (value ? "はい" : "いいえ") : String(value)
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="font-medium">{display}</span>
    </div>
  )
}

export function Step9Confirm() {
  const { getValues } = useFormContext<CandidateFormData>()
  const v = getValues()

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        以下の内容で登録します。確認してから「登録する」ボタンを押してください。
      </p>

      <Section title="基本情報">
        <Field label="氏名（漢字）" value={`${v.lastNameKanji} ${v.firstNameKanji}`} />
        <Field label="ふりがな" value={`${v.lastNameFurigana} ${v.firstNameFurigana}`} />
        <Field label="ローマ字" value={v.lastNameRomaji && v.firstNameRomaji ? `${v.lastNameRomaji} ${v.firstNameRomaji}` : undefined} />
        <Field label="生年月日" value={v.birthDate} />
        <Field label="国籍" value={v.nationality} />
      </Section>

      <Section title="連絡先">
        <Field label="郵便番号" value={v.postalCode} />
        <Field label="都道府県" value={v.prefecture} />
        <Field label="市区町村" value={v.city} />
        <Field label="住所" value={v.addressLine1} />
        <Field label="電話番号" value={v.phone} />
        <Field label="メール" value={v.email} />
      </Section>

      <Section title="在留情報">
        <Field label="パスポート" value={v.passportNumber} />
        <Field label="在留カード" value={v.residenceCardNumber} />
        <Field label="在留資格" value={v.visaStatus} />
        <Field label="在留期限" value={v.visaExpiry} />
      </Section>

      <Section title="写真">
        {v.photoDataUrl ? (
          <div className="flex h-20 w-15 overflow-hidden rounded border">
            <img src={v.photoDataUrl} alt="証明写真" className="h-full w-full object-cover" />
          </div>
        ) : (
          <span className="text-muted-foreground">未アップロード</span>
        )}
      </Section>

      <Section title="職歴">
        {v.workHistory?.length ? (
          <div className="md:col-span-2 space-y-1">
            {v.workHistory.map((wh, i) => (
              <div key={i} className="text-sm">
                {wh.startYear}/{wh.startMonth} - {wh.endYear ? `${wh.endYear}/${wh.endMonth}` : "在職中"} | {wh.companyName} ({wh.eventType})
              </div>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">なし</span>
        )}
      </Section>

      <Section title="言語・その他">
        <Field label="JLPT" value={JLPT_LABELS[v.jlptLevel as keyof typeof JLPT_LABELS]} />
        <Field label="血液型" value={v.bloodType} />
        <Field label="身長" value={v.height ? `${v.height}cm` : undefined} />
        <Field label="体重" value={v.weight ? `${v.weight}kg` : undefined} />
      </Section>
    </div>
  )
}
