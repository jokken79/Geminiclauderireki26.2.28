import Link from "next/link"
import { AlertTriangle, Clock, FileText, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants"
import type { DocumentType } from "@prisma/client"

function daysUntil(date: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function DaysBadge({ days }: { days: number }) {
  const variant = days < 0 ? "destructive" : days <= 14 ? "destructive" : "warning"
  const label = days < 0 ? `${Math.abs(days)}日超過` : days === 0 ? "本日" : `残り${days}日`
  return <Badge variant={variant}>{label}</Badge>
}

interface AlertsPanelProps {
  expiringVisas: {
    id: string
    lastNameKanji: string
    firstNameKanji: string
    visaExpiry: Date | null
  }[]
  expiringDocuments: {
    id: string
    type: DocumentType
    fileName: string
    expiryDate: Date | null
    candidate: {
      id: string
      lastNameKanji: string
      firstNameKanji: string
    }
  }[]
  nearTeishokubi: {
    id: string
    teishokubiDate: Date | null
    candidate: {
      lastNameKanji: string
      firstNameKanji: string
    }
    company: {
      name: string
    }
  }[]
}

export function AlertsPanel({ expiringVisas, expiringDocuments, nearTeishokubi }: AlertsPanelProps) {
  const hasAlerts = expiringVisas.length > 0 || expiringDocuments.length > 0 || nearTeishokubi.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          コンプライアンスアラート
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAlerts ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <p>アラートはありません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Visa Expiry Alerts */}
            {expiringVisas.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Clock className="h-4 w-4 text-red-500" />
                  ビザ期限切れ間近 ({expiringVisas.length}件)
                </h4>
                <div className="space-y-1">
                  {expiringVisas.map((v) => {
                    const days = daysUntil(new Date(v.visaExpiry!))
                    return (
                      <Link
                        key={v.id}
                        href={`/candidates/${v.id}`}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm">
                          {v.lastNameKanji} {v.firstNameKanji}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(v.visaExpiry!).toLocaleDateString("ja-JP")}
                          </span>
                          <DaysBadge days={days} />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Document Expiry Alerts */}
            {expiringDocuments.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
                  <FileText className="h-4 w-4 text-amber-500" />
                  書類期限切れ間近 ({expiringDocuments.length}件)
                </h4>
                <div className="space-y-1">
                  {expiringDocuments.map((d) => {
                    const days = daysUntil(new Date(d.expiryDate!))
                    return (
                      <Link
                        key={d.id}
                        href={`/candidates/${d.candidate.id}`}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-muted/50 transition-colors"
                      >
                        <div className="text-sm">
                          <span>{d.candidate.lastNameKanji} {d.candidate.firstNameKanji}</span>
                          <span className="text-muted-foreground ml-2">
                            ({DOCUMENT_TYPE_LABELS[d.type]})
                          </span>
                        </div>
                        <DaysBadge days={days} />
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Teishokubi Alerts */}
            {nearTeishokubi.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  抵触日接近 ({nearTeishokubi.length}件)
                </h4>
                <div className="space-y-1">
                  {nearTeishokubi.map((h) => {
                    const days = daysUntil(new Date(h.teishokubiDate!))
                    return (
                      <Link
                        key={h.id}
                        href={`/hakenshain/${h.id}`}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-muted/50 transition-colors"
                      >
                        <div className="text-sm">
                          <span>{h.candidate.lastNameKanji} {h.candidate.firstNameKanji}</span>
                          <span className="text-muted-foreground ml-2">
                            → {h.company.name}
                          </span>
                        </div>
                        <DaysBadge days={days} />
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
