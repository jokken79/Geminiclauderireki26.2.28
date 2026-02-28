import { getDocuments } from "@/actions/documents"
import { DocumentList } from "@/components/documents/document-list"
import type { DocumentType } from "@prisma/client"

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; expiring?: string; page?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = 20

  const { documents, total } = await getDocuments({
    search: params.search,
    type: params.type as DocumentType | undefined,
    expiringSoon: params.expiring === "true",
    page,
    pageSize,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">書類管理</h1>
        <p className="text-sm text-muted-foreground">
          候補者・社員の書類管理・期限追跡（{total}件）
        </p>
      </div>

      <DocumentList
        documents={documents}
        total={total}
        currentPage={page}
        pageSize={pageSize}
      />
    </div>
  )
}
