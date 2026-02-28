import { Badge } from "@/components/ui/badge"
import { getDaysUntilTeishokubi, getTeishokubiSeverity, getTeishokubiLabel } from "@/lib/teishokubi"

const SEVERITY_VARIANTS = {
  safe: "success",
  warning: "warning",
  danger: "destructive",
  expired: "destructive",
} as const

interface TeishokubiBadgeProps {
  teishokubiDate: Date
  showDate?: boolean
}

export function TeishokubiBadge({ teishokubiDate, showDate = true }: TeishokubiBadgeProps) {
  const daysRemaining = getDaysUntilTeishokubi(teishokubiDate)
  const severity = getTeishokubiSeverity(daysRemaining)
  const label = getTeishokubiLabel(daysRemaining)

  return (
    <div className="flex flex-col gap-0.5">
      {showDate && (
        <span className="text-xs text-muted-foreground">
          {teishokubiDate.toLocaleDateString("ja-JP")}
        </span>
      )}
      <Badge variant={SEVERITY_VARIANTS[severity]}>
        {label}
      </Badge>
    </div>
  )
}
