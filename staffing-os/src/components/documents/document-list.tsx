"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { type ColumnDef } from "@tanstack/react-table"
import { FileText, Trash2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/shared/data-table"
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants"
import { deleteDocument, type DocumentListItem } from "@/actions/documents"
import type { DocumentType } from "@prisma/client"

function ExpiryBadge({ expiryDate }: { expiryDate: Date | null }) {
  if (!expiryDate) return <span className="text-muted-foreground">—</span>

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  let variant: "success" | "warning" | "destructive" = "success"
  if (daysLeft < 0) variant = "destructive"
  else if (daysLeft <= 30) variant = "warning"

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs">{expiry.toLocaleDateString("ja-JP")}</span>
      <Badge variant={variant}>
        {daysLeft < 0
          ? `${Math.abs(daysLeft)}日超過`
          : daysLeft === 0
            ? "本日期限"
            : `残り${daysLeft}日`}
      </Badge>
    </div>
  )
}

function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm("この書類を削除しますか？")) return
    startTransition(async () => {
      const result = await deleteDocument(id)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success("書類を削除しました")
      }
    })
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  )
}

const columns: ColumnDef<DocumentListItem, unknown>[] = [
  {
    accessorKey: "type",
    header: "種別",
    cell: ({ getValue }) => {
      const type = getValue() as DocumentType
      return (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span>{DOCUMENT_TYPE_LABELS[type]}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "fileName",
    header: "ファイル名",
  },
  {
    id: "candidate",
    header: "候補者",
    cell: ({ row }) => {
      const c = row.original.candidate
      return (
        <Link href={`/candidates/${c.id}`} className="text-primary hover:underline">
          {c.lastNameKanji} {c.firstNameKanji}
        </Link>
      )
    },
  },
  {
    accessorKey: "expiryDate",
    header: "有効期限",
    cell: ({ getValue }) => <ExpiryBadge expiryDate={getValue() as Date | null} />,
  },
  {
    accessorKey: "createdAt",
    header: "登録日",
    cell: ({ getValue }) => new Date(getValue() as Date).toLocaleDateString("ja-JP"),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => <DeleteButton id={row.original.id} />,
  },
]

interface DocumentListProps {
  documents: DocumentListItem[]
  total: number
  currentPage: number
  pageSize: number
}

export function DocumentList({ documents, total, currentPage, pageSize }: DocumentListProps) {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const totalPages = Math.ceil(total / pageSize)

  const buildHref = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams()
    const s = overrides.search !== undefined ? String(overrides.search) : search
    const t = overrides.type !== undefined ? String(overrides.type) : typeFilter
    const p = overrides.page !== undefined ? String(overrides.page) : String(currentPage)

    if (s) params.set("search", s)
    if (t) params.set("type", t)
    if (p !== "1") params.set("page", p)

    const qs = params.toString()
    return `/documents${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <form className="flex gap-2 flex-1 max-w-lg">
          <Input
            placeholder="候補者名で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Link href={buildHref({ search, page: 1 })}>
            <Button type="button" variant="outline" size="sm">検索</Button>
          </Link>
        </form>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">全種別</option>
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <Link href={buildHref({ type: typeFilter, page: 1 })}>
          <Button type="button" variant="outline" size="sm">絞り込み</Button>
        </Link>

        <Link href={buildHref({ expiring: "true" as unknown as string })}>
          <Button type="button" variant="outline" size="sm">
            <AlertCircle className="mr-1 h-4 w-4" />
            期限間近
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={documents}
        emptyMessage="書類データはまだありません。"
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            全{total}件中 {(currentPage - 1) * pageSize + 1}〜
            {Math.min(currentPage * pageSize, total)}件
          </span>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link href={buildHref({ page: currentPage - 1 })}>
                <Button variant="outline" size="sm">前へ</Button>
              </Link>
            )}
            {currentPage < totalPages && (
              <Link href={buildHref({ page: currentPage + 1 })}>
                <Button variant="outline" size="sm">次へ</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
