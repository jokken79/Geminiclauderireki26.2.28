import { OcrScanner } from "@/components/ocr/ocr-scanner"

export default function OcrPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">OCRスキャン</h1>
        <p className="text-sm text-muted-foreground">
          履歴書をスキャンして候補者データを自動抽出します
        </p>
      </div>

      <OcrScanner />
    </div>
  )
}
