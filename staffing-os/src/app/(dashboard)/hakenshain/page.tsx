import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HakenshainPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">派遣社員一覧</h1>
        <p className="text-sm text-muted-foreground">派遣社員の管理・抵触日追跡</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>派遣社員データ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p>派遣社員データはまだありません。候補者を承認して入社連絡票から登録してください。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
