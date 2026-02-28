"use client"

import { useState } from "react"
import Link from "next/link"
import { type ColumnDef } from "@tanstack/react-table"
import { Eye, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/shared/data-table"
import { AssignmentStatusBadge } from "@/components/shared/status-badge"
import { TeishokubiBadge } from "@/components/hakenshain/teishokubi-badge"
import type { HakenshainListItem } from "@/actions/hakenshain"
import { ASSIGNMENT_STATUS_LABELS } from "@/lib/constants"
import type { AssignmentStatus } from "@prisma/client"

const columns: ColumnDef<HakenshainListItem, unknown>[] = [
  {
    accessorKey: "photoDataUrl",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      const photo = row.original.photoDataUrl
      return (
        <div className="h-10 w-8 overflow-hidden rounded border bg-muted">
          {photo ? (
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              写真
            </div>
          )}
        </div>
      )
    },
  },
  {
    id: "name",
    header: "氏名",
    accessorFn: (row) => `${row.candidate.lastNameKanji} ${row.candidate.firstNameKanji}`,
    cell: ({ row }) => {
      const c = row.original.candidate
      return (
        <div>
          <div className="font-medium">{c.lastNameKanji} {c.firstNameKanji}</div>
          <div className="text-xs text-muted-foreground">{c.lastNameFurigana} {c.firstNameFurigana}</div>
        </div>
      )
    },
  },
  {
    id: "company",
    header: "派遣先",
    accessorFn: (row) => row.company.name,
  },
  {
    accessorKey: "position",
    header: "職種",
    cell: ({ getValue }) => getValue() || "—",
  },
  {
    accessorKey: "jikyu",
    header: "時給",
    cell: ({ getValue }) => `¥${(getValue() as number).toLocaleString()}`,
  },
  {
    accessorKey: "hireDate",
    header: "入社日",
    cell: ({ getValue }) => {
      const date = getValue() as Date
      return new Date(date).toLocaleDateString("ja-JP")
    },
  },
  {
    accessorKey: "status",
    header: "ステータス",
    cell: ({ getValue }) => <AssignmentStatusBadge status={getValue() as AssignmentStatus} />,
  },
  {
    accessorKey: "teishokubiDate",
    header: "抵触日",
    cell: ({ getValue }) => {
      const date = getValue() as Date | null
      if (!date) return "—"
      return <TeishokubiBadge teishokubiDate={new Date(date)} />
    },
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <Link href={`/hakenshain/${row.original.id}`}>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
    ),
  },
]

interface HakenshainListProps {
  hakenshain: HakenshainListItem[]
  total: number
  currentPage: number
  pageSize: number
  hasApprovedCandidates: boolean
}

export function HakenshainList({
  hakenshain,
  total,
  currentPage,
  pageSize,
  hasApprovedCandidates,
}: HakenshainListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const totalPages = Math.ceil(total / pageSize)

  const buildHref = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams()
    const s = overrides.search !== undefined ? String(overrides.search) : search
    const st = overrides.status !== undefined ? String(overrides.status) : statusFilter
    const p = overrides.page !== undefined ? String(overrides.page) : String(currentPage)

    if (s) params.set("search", s)
    if (st) params.set("status", st)
    if (p !== "1") params.set("page", p)

    const qs = params.toString()
    return `/hakenshain${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <form className="flex gap-2 flex-1 max-w-lg">
            <Input
              placeholder="氏名で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Link href={buildHref({ search, page: 1 })}>
              <Button type="button" variant="outline" size="sm">
                検索
              </Button>
            </Link>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
            }}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">全ステータス</option>
            {Object.entries(ASSIGNMENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <Link href={buildHref({ status: statusFilter, page: 1 })}>
            <Button type="button" variant="outline" size="sm">
              絞り込み
            </Button>
          </Link>
        </div>

        {hasApprovedCandidates && (
          <Link href="/hakenshain/nyusha/select">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              入社連絡票
            </Button>
          </Link>
        )}
      </div>

      <DataTable
        columns={columns}
        data={hakenshain}
        emptyMessage="派遣社員データはまだありません。候補者を承認して入社連絡票から登録してください。"
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
