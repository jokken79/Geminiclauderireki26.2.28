import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getApprovedCandidates, getActiveCompanies } from "@/actions/hakenshain"
import { UkeoiForm } from "@/components/ukeoi/ukeoi-form"

export default async function UkeoiNewPage() {
  const [candidates, companies] = await Promise.all([
    getApprovedCandidates(),
    getActiveCompanies(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/ukeoi">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            一覧へ戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">請負社員登録</h1>
          <p className="text-sm text-muted-foreground">
            承認済みの候補者を請負社員として登録します
          </p>
        </div>
      </div>

      <UkeoiForm
        candidates={candidates.map((c) => ({
          id: c.id,
          lastNameKanji: c.lastNameKanji,
          firstNameKanji: c.firstNameKanji,
          lastNameFurigana: c.lastNameFurigana,
          firstNameFurigana: c.firstNameFurigana,
          nationality: c.nationality,
        }))}
        companies={companies}
      />
    </div>
  )
}
