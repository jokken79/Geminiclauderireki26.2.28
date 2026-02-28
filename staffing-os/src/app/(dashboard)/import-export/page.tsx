import { ExportPanel } from "@/components/import-export/export-panel"

export default function ImportExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">インポート/エクスポート</h1>
        <p className="text-sm text-muted-foreground">
          データのCSVエクスポートとインポート
        </p>
      </div>

      <ExportPanel />
    </div>
  )
}
