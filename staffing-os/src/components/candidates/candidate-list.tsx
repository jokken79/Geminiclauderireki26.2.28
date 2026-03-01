"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Eye, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { CandidateStatusBadge } from "@/components/shared/status-badge"
import type { CandidateListItem } from "@/actions/candidates"
import type { CandidateStatus } from "@prisma/client"

const columns: ColumnDef<CandidateListItem>[] = [
  {
    accessorKey: "photoDataUrl",
    header: "写真",
    enableSorting: false,
    cell: ({ row }) => {
      const photo = row.original.photoDataUrl
      return (
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border bg-muted">
          {photo ? (
            <img src={photo} alt={`${row.original.lastNameKanji} ${row.original.firstNameKanji}の写真`} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>
      )
    },
  },
  {
    id: "name",
    header: "氏名",
    accessorFn: (row) => `${row.lastNameKanji} ${row.firstNameKanji}`,
    cell: ({ row }) => (
      <div>
        <div className="font-medium">
          {row.original.lastNameKanji} {row.original.firstNameKanji}
        </div>
        <div className="text-xs text-muted-foreground">
          {row.original.lastNameFurigana} {row.original.firstNameFurigana}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "nationality",
    header: "国籍",
  },
  {
    accessorKey: "phone",
    header: "電話番号",
    cell: ({ row }) => row.original.phone || "-",
  },
  {
    accessorKey: "status",
    header: "ステータス",
    cell: ({ row }) => <CandidateStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "visaExpiry",
    header: "在留期限",
    cell: ({ row }) => {
      const date = row.original.visaExpiry
      if (!date) return "-"
      const d = new Date(date)
      const daysLeft = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return (
        <div>
          <div className="text-sm">{d.toLocaleDateString("ja-JP")}</div>
          {daysLeft <= 30 && daysLeft > 0 && (
            <div className="text-xs text-amber-600">残り{daysLeft}日</div>
          )}
          {daysLeft <= 0 && (
            <div className="text-xs text-destructive">期限切れ</div>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <Link href={`/candidates/${row.original.id}`}>
        <Button variant="ghost" size="sm" aria-label={`${row.original.lastNameKanji} ${row.original.firstNameKanji}の詳細を見る`}>
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
    ),
  },
]

const STATUS_OPTIONS = [
  { value: "", label: "全てのステータス" },
  { value: "PENDING", label: "審査中" },
  { value: "APPROVED", label: "承認済み" },
  { value: "REJECTED", label: "不合格" },
  { value: "HIRED", label: "採用済み" },
  { value: "WITHDRAWN", label: "辞退" },
]

interface CandidateListProps {
  candidates: CandidateListItem[]
  total: number
  currentPage: number
  search: string
  status?: CandidateStatus
}

export function CandidateList({ candidates, total, currentPage, search, status }: CandidateListProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(search)
  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  const updateFilters = (newSearch?: string, newStatus?: string) => {
    const params = new URLSearchParams()
    const s = newSearch ?? searchValue
    if (s) params.set("search", s)
    if (newStatus) params.set("status", newStatus)
    router.push(`/candidates?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateFilters()}
            placeholder="名前で検索（漢字・ふりがな・ローマ字）"
            className="pl-9"
          />
        </div>
        <Select
          value={status || ""}
          onChange={(e) => updateFilters(undefined, e.target.value)}
          className="w-40"
          aria-label="ステータスフィルター"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
        <Button variant="outline" onClick={() => updateFilters()}>
          検索
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={candidates}
        emptyMessage="候補者データはまだありません。「新規登録」から候補者を追加してください。"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => {
              const params = new URLSearchParams()
              if (search) params.set("search", search)
              if (status) params.set("status", status)
              params.set("page", String(currentPage - 1))
              router.push(`/candidates?${params.toString()}`)
            }}
          >
            前へ
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => {
              const params = new URLSearchParams()
              if (search) params.set("search", search)
              if (status) params.set("status", status)
              params.set("page", String(currentPage + 1))
              router.push(`/candidates?${params.toString()}`)
            }}
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  )
}
