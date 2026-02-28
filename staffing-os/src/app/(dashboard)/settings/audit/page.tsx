import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAuditLog } from "@/actions/users"

const ACTION_LABELS: Record<string, string> = {
  CREATE: "作成",
  UPDATE: "更新",
  DELETE: "削除",
  STATUS_CHANGE: "ステータス変更",
}

const TABLE_LABELS: Record<string, string> = {
  Candidate: "候補者",
  HakenshainAssignment: "派遣社員",
  UkeoiAssignment: "請負",
  ClientCompany: "企業",
  Document: "書類",
  User: "ユーザー",
}

const ACTION_COLORS: Record<string, "default" | "success" | "warning" | "destructive"> = {
  CREATE: "success",
  UPDATE: "warning",
  DELETE: "destructive",
  STATUS_CHANGE: "default",
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; table?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = 50

  const { logs, total } = await getAuditLog({
    page,
    pageSize,
    tableName: params.table,
  })

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            設定に戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">監査ログ</h1>
          <p className="text-sm text-muted-foreground">
            全操作の履歴（{total}件）
          </p>
        </div>
      </div>

      {/* Filter by table */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/settings/audit">
          <Badge variant={!params.table ? "default" : "outline"} className="cursor-pointer">
            全て
          </Badge>
        </Link>
        {Object.entries(TABLE_LABELS).map(([value, label]) => (
          <Link key={value} href={`/settings/audit?table=${value}`}>
            <Badge
              variant={params.table === value ? "default" : "outline"}
              className="cursor-pointer"
            >
              {label}
            </Badge>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">日時</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ユーザー</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">操作</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">対象</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">詳細</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      ログはありません
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const newVals = log.newValues as Record<string, unknown> | null
                    const detail = newVals
                      ? Object.entries(newVals)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ")
                      : ""

                    return (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("ja-JP", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          {log.user.name || log.user.email}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={ACTION_COLORS[log.action] || "default"}>
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {TABLE_LABELS[log.tableName] || log.tableName}
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate text-muted-foreground text-xs">
                          {detail}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {(page - 1) * pageSize + 1}〜{Math.min(page * pageSize, total)} / {total}件
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/settings/audit?page=${page - 1}${params.table ? `&table=${params.table}` : ""}`}>
                <Button variant="outline" size="sm">前へ</Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/settings/audit?page=${page + 1}${params.table ? `&table=${params.table}` : ""}`}>
                <Button variant="outline" size="sm">次へ</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
