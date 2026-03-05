import { OcrScanner } from "@/components/ocr/ocr-scanner"

export default function OcrPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">書類スキャン</h1>
        <p className="text-sm text-muted-foreground">
          在留カード・免許証をスキャンして候補者データを自動抽出します
        </p>
      </div>

      <OcrScanner />
    </div>
  )
}
