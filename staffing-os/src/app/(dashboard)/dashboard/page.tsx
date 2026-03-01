import Link from "next/link"
import { Users, UserCheck, Briefcase, AlertTriangle, Building2, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardStats } from "@/actions/dashboard"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"

export default async function DashboardPage() {
  const { stats, alerts, recentActivity } = await getDashboardStats()

  const statCards = [
    {
      label: "候補者",
      value: stats.totalCandidates,
      sub: stats.pendingCandidates > 0 ? `${stats.pendingCandidates}件審査中` : "前月比 +12%",
      icon: Users,
      trend: "up",
      color: "text-[var(--color-primary)] bg-[var(--color-primary)]/10",
      href: "/candidates",
    },
    {
      label: "派遣社員",
      value: stats.activeHaken,
      sub: "前月比 +5%",
      trend: "up",
      icon: UserCheck,
      color: "text-[var(--color-secondary)] bg-[var(--color-secondary)]/10",
      href: "/hakenshain",
    },
    {
      label: "請負",
      value: stats.activeUkeoi,
      sub: "前月比 -2%",
      trend: "down",
      icon: Briefcase,
      color: "text-[var(--color-accent)] bg-[var(--color-accent)]/10",
      href: "/ukeoi",
    },
    {
      label: "要対応",
      value: stats.totalAlerts,
      sub: stats.totalAlerts > 0 ? "コンプライアンス等" : "問題なし",
      icon: stats.totalAlerts > 0 ? AlertTriangle : Clock,
      color: stats.totalAlerts > 0 ? "text-destructive bg-destructive/10" : "text-[var(--color-success)] bg-[var(--color-success)]/10",
      href: "#alerts",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-all hover:bg-muted/50 hover:shadow-md cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <div className={`p-2 rounded-full ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{stat.value}</div>
                </div>
                {stat.sub && (
                  <div className="flex items-center mt-1 text-xs text-muted-foreground gap-1">
                    {stat.trend === "up" && <TrendingUp className="h-3 w-3 text-[var(--color-success)]" />}
                    {stat.trend === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
                    <span>{stat.sub}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <DashboardCharts />

      {/* Additional stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/companies">
          <Card className="transition-colors hover:border-primary cursor-pointer hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-[var(--color-info)]/10 text-[var(--color-info)]">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">登録企業</p>
                <div className="text-2xl font-bold">{stats.totalCompanies}</div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-full bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">総稼働人数</p>
              <div className="text-2xl font-bold">{stats.activeHaken + stats.activeUkeoi}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-full bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">審査待ち</p>
              <div className="text-2xl font-bold">{stats.pendingCandidates}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Panel */}
      <div id="alerts">
        <AlertsPanel
          expiringVisas={alerts.expiringVisas}
          expiringDocuments={alerts.expiringDocuments}
          nearTeishokubi={alerts.nearTeishokubi}
        />
      </div>

      {/* Recent Activity */}
      <RecentActivity activities={recentActivity} />
    </div>
  )
}
