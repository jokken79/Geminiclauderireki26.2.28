import Link from "next/link"
import { Users, ScrollText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const settingsLinks = [
  {
    href: "/settings/users",
    label: "ユーザー管理",
    description: "ユーザーの追加・ロール変更・無効化",
    icon: Users,
  },
  {
    href: "/settings/audit",
    label: "監査ログ",
    description: "全操作の履歴を確認",
    icon: ScrollText,
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-sm text-muted-foreground">システム設定・ユーザー管理</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="transition-colors hover:border-primary cursor-pointer h-full">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg bg-muted p-3">
                  <link.icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">{link.label}</h3>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
