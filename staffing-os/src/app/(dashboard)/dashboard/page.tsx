import Link from "next/link"
import { Users, UserCheck, Briefcase, AlertTriangle, Building2, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardStats } from "@/actions/dashboard"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { RecentActivity } from "@/components/dashboard/recent-activity"

export default async function DashboardPage() {
  const { stats, alerts, recentActivity } = await getDashboardStats()

  const statCards = [
    {
      label: "候補者",
      value: stats.totalCandidates,
      sub: stats.pendingCandidates > 0 ? `${stats.pendingCandidates}件審査中` : undefined,
      icon: Users,
      color: "text-blue-500",
      href: "/candidates",
    },
    {
      label: "派遣社員",
      value: stats.activeHaken,
      sub: "稼働中",
      icon: UserCheck,
      color: "text-green-500",
      href: "/hakenshain",
    },
    {
      label: "請負",
      value: stats.activeUkeoi,
      sub: "稼働中",
      icon: Briefcase,
      color: "text-amber-500",
      href: "/ukeoi",
    },
    {
      label: "要対応",
      value: stats.totalAlerts,
      sub: stats.totalAlerts > 0 ? "コンプライアンス" : "問題なし",
      icon: stats.totalAlerts > 0 ? AlertTriangle : Clock,
      color: stats.totalAlerts > 0 ? "text-red-500" : "text-green-500",
      href: "#alerts",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:border-primary cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.sub && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Additional stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/companies">
          <Card className="transition-colors hover:border-primary cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.totalCompanies}</div>
                <p className="text-sm text-muted-foreground">登録企業</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UserCheck className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{stats.activeHaken + stats.activeUkeoi}</div>
              <p className="text-sm text-muted-foreground">総稼働人数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-amber-500" />
            <div>
              <div className="text-2xl font-bold">{stats.pendingCandidates}</div>
              <p className="text-sm text-muted-foreground">審査待ち</p>
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
