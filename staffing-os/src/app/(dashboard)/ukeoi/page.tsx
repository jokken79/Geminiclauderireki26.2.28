import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function UkeoiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">請負一覧</h1>
        <p className="text-sm text-muted-foreground">請負社員の管理・偽装請負防止</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>請負データ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p>請負データはまだありません。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
