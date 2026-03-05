"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, ThumbsUp, ThumbsDown, Eye, Pencil, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CandidateStatusBadge } from "@/components/shared/status-badge"
import { useDebounce } from "@/hooks/use-debounce"
import { useEffect } from "react"
import { updateCandidateStatus } from "@/actions/candidates"
import { toast } from "sonner"
import type { CandidateListItem } from "@/actions/candidates"
import type { CandidateStatus } from "@prisma/client"

const STATUS_OPTIONS = [
  { value: "", label: "全てのステータス" },
  { value: "PENDING", label: "審査中" },
  { value: "APPROVED", label: "承認済み" },
  { value: "REJECTED", label: "不合格" },
  { value: "HIRED", label: "採用済み" },
  { value: "WITHDRAWN", label: "辞退" },
]

const PAGE_SIZE_OPTIONS = [24, 48, 96] as const

interface CandidateListProps {
  candidates: CandidateListItem[]
  total: number
  currentPage: number
  pageSize: number
  search: string
  status?: CandidateStatus
}

export function CandidateList({ candidates, total, currentPage, pageSize, search, status }: CandidateListProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(search)
  const debouncedSearch = useDebounce(searchValue, 300)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const totalPages = Math.ceil(total / pageSize)

  const buildParams = (overrides: { search?: string; status?: string; page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams()
    const s = overrides.search !== undefined ? overrides.search : searchValue
    if (s) params.set("search", s)
    const st = overrides.status !== undefined ? overrides.status : (status || "")
    if (st) params.set("status", st)
    const ps = overrides.pageSize ?? pageSize
    if (ps !== 24) params.set("pageSize", String(ps))
    const p = overrides.page ?? undefined
    if (p && p > 1) params.set("page", String(p))
    return params.toString()
  }

  const updateFilters = (newSearch?: string, newStatus?: string) => {
    router.push(`/candidates?${buildParams({ search: newSearch, status: newStatus })}`)
  }

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateFilters(debouncedSearch, status)
    }
  }, [debouncedSearch])

  function handleStatusChange(id: string, newStatus: "APPROVED" | "REJECTED") {
    setPendingId(id)
    startTransition(async () => {
      const result = await updateCandidateStatus(id, newStatus)
      setPendingId(null)
      if (result && "success" in result) {
        toast.success(newStatus === "APPROVED" ? "承認しました" : "不合格にしました")
      } else {
        const err = result as { error?: string } | undefined
        toast.error(err?.error || "エラーが発生しました")
      }
    })
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
            placeholder="名前で検索（漢字・ふりがな・ローマ字）"
            className="pl-9"
          />
        </div>
        <NativeSelect
          value={status || ""}
          onChange={(e) => updateFilters(searchValue, e.target.value)}
          className="w-40"
          aria-label="ステータスフィルター"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={String(pageSize)}
          onChange={(e) => router.push(`/candidates?${buildParams({ pageSize: Number(e.target.value) })}`)}
          className="w-28"
          aria-label="表示件数"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}件</option>
          ))}
        </NativeSelect>
      </div>

      {/* Card Grid */}
      {candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 py-16">
          <UserPlus className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            候補者データはまだありません。「新規登録」から候補者を追加してください。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {candidates.map((c) => {
            const initial = c.lastNameKanji ? c.lastNameKanji.charAt(0) : "?"
            const isThisLoading = isPending && pendingId === c.id
            const visaDaysLeft = c.visaExpiry
              ? Math.ceil((new Date(c.visaExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null

            return (
              <div
                key={c.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
              >
                {/* Photo */}
                <Link href={`/candidates/${c.id}`} className="block">
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                    <Avatar className="h-full w-full rounded-none">
                      <AvatarImage
                        src={c.photoDataUrl || undefined}
                        alt={`${c.lastNameKanji} ${c.firstNameKanji}`}
                        className="h-full w-full object-cover"
                      />
                      <AvatarFallback className="h-full w-full rounded-none text-3xl font-bold text-muted-foreground">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    {/* Status badge overlay */}
                    <div className="absolute left-2 top-2">
                      <CandidateStatusBadge status={c.status} />
                    </div>
                    {/* Visa warning */}
                    {visaDaysLeft !== null && visaDaysLeft <= 30 && (
                      <div className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        visaDaysLeft <= 0
                          ? "bg-red-500 text-white"
                          : "bg-amber-400 text-amber-900"
                      }`}>
                        {visaDaysLeft <= 0 ? "期限切れ" : `残${visaDaysLeft}日`}
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <Link href={`/candidates/${c.id}`} className="hover:underline">
                    <h3 className="truncate text-sm font-bold leading-tight">
                      {c.lastNameKanji} {c.firstNameKanji}
                    </h3>
                  </Link>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {c.lastNameFurigana} {c.firstNameFurigana}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.nationality}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center border-t bg-muted/30 px-1 py-1">
                  {/* Approve */}
                  <button
                    type="button"
                    disabled={isThisLoading || c.status === "APPROVED"}
                    onClick={() => handleStatusChange(c.id, "APPROVED")}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-40"
                    title="承認"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  {/* Reject */}
                  <button
                    type="button"
                    disabled={isThisLoading || c.status === "REJECTED"}
                    onClick={() => handleStatusChange(c.id, "REJECTED")}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40"
                    title="不合格"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                  {/* View */}
                  <Link
                    href={`/candidates/${c.id}`}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-sky-600 transition-colors hover:bg-sky-50"
                    title="詳細"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  {/* Edit */}
                  <Link
                    href={`/candidates/${c.id}/edit`}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                    title="編集"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  {/* Nyusha (only for approved) */}
                  {c.status === "APPROVED" && (
                    <Link
                      href={`/hakenshain/nyusha/${c.id}`}
                      className="flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-50"
                      title="入社届へ"
                    >
                      入社
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{total}件中 {((currentPage - 1) * pageSize) + 1}〜{Math.min(currentPage * pageSize, total)}件を表示</span>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => router.push(`/candidates?${buildParams({ page: currentPage - 1 })}`)}
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
            onClick={() => router.push(`/candidates?${buildParams({ page: currentPage + 1 })}`)}
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  )
}
