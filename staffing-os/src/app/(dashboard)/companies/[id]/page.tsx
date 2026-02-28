import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCompany } from "@/actions/companies"
import { AssignmentStatusBadge } from "@/components/shared/status-badge"

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2 py-1">
      <span className="text-muted-foreground shrink-0 min-w-[100px]">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const company = await getCompany(id)

  if (!company) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/companies">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            一覧へ戻る
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{company.name}</h1>
            {!company.isActive && <Badge variant="secondary">無効</Badge>}
          </div>
          {company.nameKana && (
            <p className="text-sm text-muted-foreground">{company.nameKana}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent>
            <Field label="業種" value={company.industry} />
            <Field label="郵便番号" value={company.postalCode} />
            <Field label="都道府県" value={company.prefecture} />
            <Field label="市区町村" value={company.city} />
            <Field label="住所" value={company.address} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>連絡先</CardTitle>
          </CardHeader>
          <CardContent>
            <Field label="電話" value={company.phone} />
            <Field label="FAX" value={company.fax} />
            <Field label="担当者" value={company.contactName} />
            <Field label="メール" value={company.contactEmail} />
          </CardContent>
        </Card>
      </div>

      {/* Assigned Workers */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-300">
              派遣社員 ({company.hakenshain.length}名)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {company.hakenshain.length === 0 ? (
              <p className="text-sm text-muted-foreground">割り当てなし</p>
            ) : (
              <div className="space-y-2">
                {company.hakenshain.map((h) => (
                  <Link
                    key={h.id}
                    href={`/hakenshain/${h.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <span className="font-medium">
                        {h.candidate.lastNameKanji} {h.candidate.firstNameKanji}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({h.candidate.nationality})
                      </span>
                    </div>
                    <AssignmentStatusBadge status={h.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-300">
              請負社員 ({company.ukeoi.length}名)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {company.ukeoi.length === 0 ? (
              <p className="text-sm text-muted-foreground">割り当てなし</p>
            ) : (
              <div className="space-y-2">
                {company.ukeoi.map((u) => (
                  <Link
                    key={u.id}
                    href={`/ukeoi/${u.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <span className="font-medium">
                        {u.candidate.lastNameKanji} {u.candidate.firstNameKanji}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({u.candidate.nationality})
                      </span>
                    </div>
                    <AssignmentStatusBadge status={u.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {company.notes && (
        <Card>
          <CardHeader>
            <CardTitle>備考</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{company.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
