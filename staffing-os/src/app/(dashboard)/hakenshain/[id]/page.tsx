import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getHakenshain } from "@/actions/hakenshain"
import { AssignmentStatusBadge } from "@/components/shared/status-badge"
import { TeishokubiBadge } from "@/components/hakenshain/teishokubi-badge"
import { HakenshainStatusActions } from "@/components/hakenshain/hakenshain-status-actions"
import { calculateAge, toWareki } from "@/lib/wareki"
import { JLPT_LABELS } from "@/lib/constants"

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === "") return null
  const display = typeof value === "boolean" ? (value ? "はい" : "いいえ") : String(value)
  return (
    <div className="flex gap-2 py-1">
      <span className="text-muted-foreground shrink-0 min-w-[120px]">{label}:</span>
      <span className="font-medium">{display}</span>
    </div>
  )
}

export default async function HakenshainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const hakenshain = await getHakenshain(id)

  if (!hakenshain) {
    notFound()
  }

  const candidate = hakenshain.candidate
  const company = hakenshain.company

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hakenshain">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            一覧へ戻る
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {candidate.lastNameKanji} {candidate.firstNameKanji}
            </h1>
            <AssignmentStatusBadge status={hakenshain.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {candidate.lastNameFurigana} {candidate.firstNameFurigana}
          </p>
        </div>
        <HakenshainStatusActions id={hakenshain.id} status={hakenshain.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column — Employment info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>雇用情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-x-8 gap-y-1 md:grid-cols-2">
              <Field label="派遣先" value={company.name} />
              <Field label="業種" value={company.industry} />
              <Field label="入社日" value={new Date(hakenshain.hireDate).toLocaleDateString("ja-JP")} />
              <Field
                label="契約終了日"
                value={
                  hakenshain.contractEndDate
                    ? new Date(hakenshain.contractEndDate).toLocaleDateString("ja-JP")
                    : null
                }
              />
              <Field label="時給" value={`¥${hakenshain.jikyu.toLocaleString()}`} />
              <Field label="職種" value={hakenshain.position} />
              <Field label="製造ライン" value={hakenshain.productionLine} />
              <Field label="シフト" value={hakenshain.shift} />
              <Field label="派遣元責任者" value={hakenshain.dispatchSupervisor} />
              <Field label="派遣先責任者" value={hakenshain.clientSupervisor} />
            </div>

            {/* 抵触日 Section */}
            {hakenshain.teishokubiDate && (
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">抵触日（3年ルール）</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      労働者派遣法に基づく派遣期間制限
                    </p>
                  </div>
                  <TeishokubiBadge teishokubiDate={new Date(hakenshain.teishokubiDate)} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column — Photo + basic candidate info */}
        <Card>
          <CardHeader>
            <CardTitle>個人情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Photo */}
            <div className="flex justify-center">
              {hakenshain.photoDataUrl ? (
                <div className="h-32 w-24 overflow-hidden rounded border">
                  <img
                    src={hakenshain.photoDataUrl}
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

            <Field label="国籍" value={candidate.nationality} />
            <Field
              label="生年月日"
              value={`${toWareki(new Date(candidate.birthDate))} (${calculateAge(new Date(candidate.birthDate))}歳)`}
            />
            <Field label="性別" value={candidate.gender} />
            <Field label="電話" value={candidate.phone} />
            <Field label="メール" value={candidate.email} />
            <Field label="JLPT" value={JLPT_LABELS[candidate.jlptLevel as keyof typeof JLPT_LABELS]} />

            <div className="pt-2 border-t">
              <Link href={`/candidates/${candidate.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  候補者詳細を見る
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank account & Emergency contact */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>銀行口座</CardTitle>
          </CardHeader>
          <CardContent>
            {hakenshain.bankName ? (
              <div className="space-y-1">
                <Field label="銀行名" value={hakenshain.bankName} />
                <Field label="支店名" value={hakenshain.bankBranch} />
                <Field label="口座種別" value={hakenshain.bankAccountType} />
                <Field label="口座番号" value={hakenshain.bankAccountNumber ? "****" : null} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">未登録</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>緊急連絡先</CardTitle>
          </CardHeader>
          <CardContent>
            {hakenshain.emergencyName ? (
              <div className="space-y-1">
                <Field label="氏名" value={hakenshain.emergencyName} />
                <Field label="電話" value={hakenshain.emergencyPhone} />
                <Field label="続柄" value={hakenshain.emergencyRelation} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">未登録</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {hakenshain.notes && (
        <Card>
          <CardHeader>
            <CardTitle>備考</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{hakenshain.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
