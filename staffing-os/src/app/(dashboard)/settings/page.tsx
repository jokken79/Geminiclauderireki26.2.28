import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-sm text-muted-foreground">システム設定・ユーザー管理</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>一般設定</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">設定機能は今後実装予定です。</p>
        </CardContent>
      </Card>
    </div>
  )
}
