import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUkeoi } from "@/actions/ukeoi"
import { AssignmentStatusBadge } from "@/components/shared/status-badge"
import { UkeoiStatusActions } from "@/components/ukeoi/ukeoi-status-actions"
import { calculateAge, toWareki } from "@/lib/wareki"

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

export default async function UkeoiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ukeoi = await getUkeoi(id)

  if (!ukeoi) {
    notFound()
  }

  const candidate = ukeoi.candidate
  const company = ukeoi.company

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/ukeoi">
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
            <AssignmentStatusBadge status={ukeoi.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {candidate.lastNameFurigana} {candidate.firstNameFurigana} — 請負
          </p>
        </div>
        <UkeoiStatusActions id={ukeoi.id} status={ukeoi.status} />
      </div>

      {/* Permanent 偽装請負 Warning */}
      <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm">
              偽装請負防止 — コンプライアンス確認
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
              発注者による直接の指揮命令は違法です。自社の現場責任者（
              <strong>{ukeoi.internalSupervisor}</strong>）が業務管理を行ってください。
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Employment info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>雇用情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-x-8 gap-y-1 md:grid-cols-2">
              <Field label="企業" value={company.name} />
              <Field label="業種" value={company.industry} />
              <Field label="入社日" value={new Date(ukeoi.hireDate).toLocaleDateString("ja-JP")} />
              <Field
                label="契約終了日"
                value={ukeoi.contractEndDate ? new Date(ukeoi.contractEndDate).toLocaleDateString("ja-JP") : null}
              />
              <Field label="月給" value={`¥${ukeoi.monthlySalary.toLocaleString()}`} />
              <Field label="職種" value={ukeoi.position} />
              <Field label="プロジェクト" value={ukeoi.projectName} />
            </div>

            {/* Internal supervisor with emphasis */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/50">
              <Field label="自社現場責任者" value={ukeoi.internalSupervisor} />
            </div>
          </CardContent>
        </Card>

        {/* Personal info */}
        <Card>
          <CardHeader>
            <CardTitle>個人情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ukeoi.photoDataUrl ? (
              <div className="flex justify-center">
                <div className="h-32 w-24 overflow-hidden rounded border">
                  <img src={ukeoi.photoDataUrl} alt="証明写真" className="h-full w-full object-cover" />
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="flex h-32 w-24 items-center justify-center rounded border bg-muted text-xs text-muted-foreground">
                  写真なし
                </div>
              </div>
            )}
            <Field label="国籍" value={candidate.nationality} />
            <Field
              label="生年月日"
              value={`${toWareki(new Date(candidate.birthDate))} (${calculateAge(new Date(candidate.birthDate))}歳)`}
            />
            <Field label="電話" value={candidate.phone} />
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

      {/* Bank & Emergency */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>銀行口座</CardTitle>
          </CardHeader>
          <CardContent>
            {ukeoi.bankName ? (
              <div className="space-y-1">
                <Field label="銀行名" value={ukeoi.bankName} />
                <Field label="支店名" value={ukeoi.bankBranch} />
                <Field label="口座種別" value={ukeoi.bankAccountType} />
                <Field label="口座番号" value={ukeoi.bankAccountNumber ? "****" : null} />
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
            {ukeoi.emergencyName ? (
              <div className="space-y-1">
                <Field label="氏名" value={ukeoi.emergencyName} />
                <Field label="電話" value={ukeoi.emergencyPhone} />
                <Field label="続柄" value={ukeoi.emergencyRelation} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">未登録</p>
            )}
          </CardContent>
        </Card>
      </div>

      {ukeoi.notes && (
        <Card>
          <CardHeader>
            <CardTitle>備考</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{ukeoi.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
