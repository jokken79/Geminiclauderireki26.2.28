import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getApprovedCandidates } from "@/actions/hakenshain"
import { CandidateStatusBadge } from "@/components/shared/status-badge"

export default async function NyushaSelectPage() {
  const candidates = await getApprovedCandidates()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hakenshain">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            一覧へ戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">入社連絡票 — 候補者選択</h1>
          <p className="text-sm text-muted-foreground">
            承認済みの候補者から派遣社員として登録する候補者を選択してください
          </p>
        </div>
      </div>

      {candidates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              承認済みの候補者がいません。先に候補者を承認してください。
            </p>
            <Link href="/candidates" className="mt-4 inline-block">
              <Button variant="outline">候補者一覧へ</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c) => (
            <Link key={c.id} href={`/hakenshain/nyusha/${c.id}`}>
              <Card className="transition-colors hover:border-primary cursor-pointer">
                <CardContent className="flex gap-4 p-4">
                  {/* Photo */}
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded border bg-muted">
                    {c.photoDataUrl ? (
                      <img src={c.photoDataUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        写真
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {c.lastNameKanji} {c.firstNameKanji}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.lastNameFurigana} {c.firstNameFurigana}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{c.nationality}</span>
                      {c.phone && <span>📞 {c.phone}</span>}
                    </div>
                    {c.visaExpiry && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        ビザ期限: {new Date(c.visaExpiry).toLocaleDateString("ja-JP")}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
