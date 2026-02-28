import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">企業一覧</h1>
          <p className="text-sm text-muted-foreground">派遣先・工場の管理</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新規登録
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>企業データ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p>企業データはまだありません。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
