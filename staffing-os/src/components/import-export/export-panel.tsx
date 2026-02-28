"use client"

import { useTransition } from "react"
import { Download, Users, UserCheck, Briefcase } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { exportCandidatesCsv, exportHakenshainCsv } from "@/actions/import-export"

function downloadCsv(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export function ExportPanel() {
  const [isPending, startTransition] = useTransition()

  const handleExport = (type: "candidates" | "hakenshain") => {
    startTransition(async () => {
      try {
        const date = new Date().toISOString().split("T")[0]
        let csv: string
        let filename: string

        if (type === "candidates") {
          csv = await exportCandidatesCsv()
          filename = `候補者_${date}.csv`
        } else {
          csv = await exportHakenshainCsv()
          filename = `派遣社員_${date}.csv`
        }

        downloadCsv(csv, filename)
        toast.success("エクスポートが完了しました")
      } catch {
        toast.error("エクスポートに失敗しました")
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            CSVエクスポート
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            データをCSVファイルとしてダウンロードします。Excel（UTF-8 BOM付き）に対応しています。
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <h4 className="font-medium">候補者データ</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  全候補者の基本情報・連絡先・在留情報を含む
                </p>
                <Button
                  onClick={() => handleExport("candidates")}
                  disabled={isPending}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  候補者CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-500" />
                  <h4 className="font-medium">派遣社員データ</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  派遣社員の雇用情報・企業・抵触日を含む
                </p>
                <Button
                  onClick={() => handleExport("hakenshain")}
                  disabled={isPending}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  派遣社員CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 opacity-60">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-amber-500" />
                  <h4 className="font-medium">請負データ</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  請負社員の雇用情報・企業データを含む
                </p>
                <Button variant="outline" className="w-full" disabled>
                  準備中
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSVインポート</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              CSVインポート機能は今後実装予定です。
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              UTF-8（BOM付き）またはShift-JISのCSVファイルに対応予定
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
