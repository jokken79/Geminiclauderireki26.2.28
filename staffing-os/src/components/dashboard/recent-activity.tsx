import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
}

interface RecentActivityProps {
  activities: {
    id: string
    action: string
    tableName: string
    recordId: string
    createdAt: Date
    newValues: unknown
    user: { name: string | null }
  }[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>最近のアクティビティ</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <p>まだアクティビティはありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const values = activity.newValues as Record<string, unknown> | null
              const name = values?.name || values?.candidateName || ""

              return (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div className="text-sm">
                    <span className="font-medium">{activity.user.name || "システム"}</span>
                    <span className="text-muted-foreground">
                      {" "}が{TABLE_LABELS[activity.tableName] || activity.tableName}を
                      {ACTION_LABELS[activity.action] || activity.action}
                    </span>
                    {name && (
                      <span className="text-muted-foreground"> ({String(name)})</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {new Date(activity.createdAt).toLocaleString("ja-JP", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
