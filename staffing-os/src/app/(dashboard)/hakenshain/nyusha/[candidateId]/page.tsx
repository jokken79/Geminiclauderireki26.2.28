import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCandidate } from "@/actions/candidates"
import { getActiveCompanies } from "@/actions/hakenshain"
import { NyushaWizard } from "@/components/hakenshain/nyusha-wizard"

export default async function NyushaPage({
  params,
}: {
  params: Promise<{ candidateId: string }>
}) {
  const { candidateId } = await params

  const [candidate, companies] = await Promise.all([
    getCandidate(candidateId),
    getActiveCompanies(),
  ])

  if (!candidate) {
    notFound()
  }

  // Only approved candidates can proceed
  if (candidate.status !== "APPROVED") {
    redirect("/hakenshain/nyusha/select")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hakenshain/nyusha/select">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            候補者選択に戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">入社連絡票</h1>
          <p className="text-sm text-muted-foreground">
            {candidate.lastNameKanji} {candidate.firstNameKanji} さんの派遣登録
          </p>
        </div>
      </div>

      <NyushaWizard
        candidate={candidate}
        companies={companies}
      />
    </div>
  )
}
