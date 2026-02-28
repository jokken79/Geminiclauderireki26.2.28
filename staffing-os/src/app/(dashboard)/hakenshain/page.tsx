import { getHakenshainList, getApprovedCandidates } from "@/actions/hakenshain"
import { HakenshainList } from "@/components/hakenshain/hakenshain-list"
import type { AssignmentStatus } from "@prisma/client"

export default async function HakenshainPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = 20

  const [{ hakenshain, total }, approvedCandidates] = await Promise.all([
    getHakenshainList({
      search: params.search,
      status: params.status as AssignmentStatus | undefined,
      page,
      pageSize,
    }),
    getApprovedCandidates(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">派遣社員一覧</h1>
        <p className="text-sm text-muted-foreground">
          派遣社員の管理・抵触日追跡
        </p>
      </div>

      <HakenshainList
        hakenshain={hakenshain}
        total={total}
        currentPage={page}
        pageSize={pageSize}
        hasApprovedCandidates={approvedCandidates.length > 0}
      />
    </div>
  )
}
