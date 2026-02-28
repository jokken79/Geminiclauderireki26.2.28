import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CandidateStatusBadge } from "@/components/shared/status-badge"
import { getCandidate } from "@/actions/candidates"
import { CandidateStatusActions } from "@/components/candidates/candidate-status-actions"
import { JLPT_LABELS } from "@/lib/constants"
import { calculateAge, toWareki } from "@/lib/wareki"

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const candidate = await getCandidate(id)

  if (!candidate) {
    notFound()
  }

  const age = calculateAge(candidate.birthDate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/candidates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {candidate.lastNameKanji} {candidate.firstNameKanji}
              </h1>
              <CandidateStatusBadge status={candidate.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {candidate.lastNameFurigana} {candidate.firstNameFurigana}
              {candidate.lastNameRomaji && ` / ${candidate.lastNameRomaji} ${candidate.firstNameRomaji}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <CandidateStatusActions candidateId={id} currentStatus={candidate.status} />
          <Link href={`/candidates/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Photo + Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {candidate.photoDataUrl && (
              <div className="mx-auto flex h-32 w-24 overflow-hidden rounded-lg border">
                <img src={candidate.photoDataUrl} alt="証明写真" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">生年月日</span>
                <span>{candidate.birthDate.toLocaleDateString("ja-JP")}（{age}歳）</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">和暦</span>
                <span>{toWareki(candidate.birthDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">国籍</span>
                <span>{candidate.nationality}</span>
              </div>
              {candidate.bloodType && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">血液型</span>
                  <span>{candidate.bloodType}型</span>
                </div>
              )}
              {candidate.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">電話</span>
                  <span>{candidate.phone}</span>
                </div>
              )}
              {candidate.jlptLevel !== "NONE" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">JLPT</span>
                  <span>{JLPT_LABELS[candidate.jlptLevel]}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Immigration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">在留情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {candidate.visaStatus && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">在留資格</span>
                <span>{candidate.visaStatus}</span>
              </div>
            )}
            {candidate.visaExpiry && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">在留期限</span>
                <span>{candidate.visaExpiry.toLocaleDateString("ja-JP")}</span>
              </div>
            )}
            {candidate.residenceCardNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">在留カード</span>
                <span>{candidate.residenceCardNumber}</span>
              </div>
            )}
            {candidate.passportNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">パスポート</span>
                <span>{candidate.passportNumber}</span>
              </div>
            )}
            {!candidate.visaStatus && !candidate.passportNumber && (
              <p className="text-muted-foreground">在留情報は未登録です</p>
            )}
          </CardContent>
        </Card>

        {/* Qualifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">資格・経験</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {candidate.expWelding && <Badge variant="secondary">溶接</Badge>}
              {candidate.expForklift && <Badge variant="secondary">フォークリフト</Badge>}
              {candidate.expLineWork && <Badge variant="secondary">ライン作業</Badge>}
              {candidate.expAssembly && <Badge variant="secondary">組立</Badge>}
              {candidate.expPacking && <Badge variant="secondary">梱包</Badge>}
              {candidate.expInspection && <Badge variant="secondary">検品</Badge>}
              {candidate.expPainting && <Badge variant="secondary">塗装</Badge>}
              {candidate.expMachining && <Badge variant="secondary">機械加工</Badge>}
              {candidate.hasDriverLicense && <Badge variant="outline">運転免許</Badge>}
              {candidate.hasForkliftLicense && <Badge variant="outline">フォークリフト免許</Badge>}
              {candidate.hasCraneLicense && <Badge variant="outline">クレーン免許</Badge>}
              {candidate.hasWeldingCert && <Badge variant="outline">溶接資格</Badge>}
            </div>
            {candidate.qualifications.length > 0 && (
              <div className="pt-2 space-y-1 text-sm">
                {candidate.qualifications.map((q) => (
                  <div key={q.id} className="text-muted-foreground">
                    {q.year}/{q.month} {q.name}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Work History */}
      {candidate.workHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">職歴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {candidate.workHistory.map((wh) => (
                <div key={wh.id} className="flex items-center gap-4 text-sm border-b pb-2 last:border-0">
                  <span className="shrink-0 text-muted-foreground">
                    {wh.startYear}/{wh.startMonth} - {wh.endYear ? `${wh.endYear}/${wh.endMonth}` : "在職中"}
                  </span>
                  <span className="font-medium">{wh.companyName}</span>
                  {wh.position && <span className="text-muted-foreground">({wh.position})</span>}
                  <Badge variant="outline" className="ml-auto">{wh.eventType}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Family */}
      {candidate.familyMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">家族構成</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {candidate.familyMembers.map((fm) => (
                <div key={fm.id} className="flex items-center gap-4 text-sm">
                  <span className="font-medium">{fm.name}</span>
                  <span className="text-muted-foreground">{fm.relationship}</span>
                  {fm.age && <span className="text-muted-foreground">{fm.age}歳</span>}
                  {fm.liveTogether && <Badge variant="secondary">同居</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
