import { getUkeoiList } from "@/actions/ukeoi"
import { getApprovedCandidates } from "@/actions/hakenshain"
import { UkeoiList } from "@/components/ukeoi/ukeoi-list"
import type { AssignmentStatus } from "@prisma/client"

export default async function UkeoiPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = 20

  const [{ ukeoi, total }, approvedCandidates] = await Promise.all([
    getUkeoiList({
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
        <h1 className="text-2xl font-bold">請負一覧</h1>
        <p className="text-sm text-muted-foreground">
          請負社員の管理・偽装請負防止
        </p>
      </div>

      <UkeoiList
        ukeoi={ukeoi}
        total={total}
        currentPage={page}
        pageSize={pageSize}
        hasApprovedCandidates={approvedCandidates.length > 0}
      />
    </div>
  )
}
