import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCandidates } from "@/actions/candidates"
import { CandidateList } from "@/components/candidates/candidate-list"

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string; pageSize?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const status = params.status as "PENDING" | "APPROVED" | "REJECTED" | "HIRED" | "WITHDRAWN" | undefined
  const page = Number(params.page) || 1
  const pageSize = [24, 48, 96].includes(Number(params.pageSize)) ? Number(params.pageSize) : 24

  const { candidates, total } = await getCandidates({
    search: search || undefined,
    status,
    page,
    pageSize,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">候補者一覧</h1>
          <p className="text-sm text-muted-foreground">
            全 {total} 件
          </p>
        </div>
        <Link href="/candidates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Button>
        </Link>
      </div>

      <CandidateList
        candidates={candidates}
        total={total}
        currentPage={page}
        pageSize={pageSize}
        search={search}
        status={status}
      />
    </div>
  )
}
