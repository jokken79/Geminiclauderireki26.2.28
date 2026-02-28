"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Upload, ScanLine, Edit, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { runOcr } from "@/actions/ocr"
import type { OcrExtractedFields } from "@/services/ocr-service"

export function OcrScanner() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<OcrExtractedFields | null>(null)
  const [provider, setProvider] = useState<string>("")
  const [confidence, setConfidence] = useState<number>(0)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error("ファイルサイズは10MB以下にしてください")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
      setOcrResult(null)
    }
    reader.readAsDataURL(file)
  }

  const handleScan = () => {
    if (!imagePreview) return

    startTransition(async () => {
      const result = await runOcr(imagePreview)

      if (!result.success) {
        toast.error(result.error || "OCR処理に失敗しました")
        return
      }

      setOcrResult(result.fields)
      setProvider(result.provider)
      setConfidence(result.confidence)
      toast.success(`${result.provider}でスキャン完了`)
    })
  }

  const handleCreateCandidate = () => {
    if (!ocrResult) return

    // Build query params from OCR result to pre-fill the candidate form
    const params = new URLSearchParams()
    if (ocrResult.lastNameKanji) params.set("lastNameKanji", ocrResult.lastNameKanji)
    if (ocrResult.firstNameKanji) params.set("firstNameKanji", ocrResult.firstNameKanji)
    if (ocrResult.lastNameFurigana) params.set("lastNameFurigana", ocrResult.lastNameFurigana)
    if (ocrResult.firstNameFurigana) params.set("firstNameFurigana", ocrResult.firstNameFurigana)
    if (ocrResult.birthDate) params.set("birthDate", ocrResult.birthDate)
    if (ocrResult.nationality) params.set("nationality", ocrResult.nationality)
    if (ocrResult.phone) params.set("phone", ocrResult.phone)
    if (ocrResult.email) params.set("email", ocrResult.email)
    if (ocrResult.postalCode) params.set("postalCode", ocrResult.postalCode)
    if (ocrResult.prefecture) params.set("prefecture", ocrResult.prefecture)
    if (ocrResult.city) params.set("city", ocrResult.city)
    if (ocrResult.addressLine1) params.set("addressLine1", ocrResult.addressLine1)

    router.push(`/candidates/new?${params.toString()}`)
  }

  // Editable field component
  const EditableField = ({ label, field }: { label: string; field: keyof OcrExtractedFields }) => {
    const value = ocrResult?.[field] as string | undefined
    return (
      <div>
        <Label className="text-xs">{label}</Label>
        <Input
          value={value || ""}
          onChange={(e) => {
            if (ocrResult) {
              setOcrResult({ ...ocrResult, [field]: e.target.value })
            }
          }}
          className="text-sm"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            履歴書アップロード
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>履歴書の画像またはPDFを選択</Label>
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              対応形式: JPEG, PNG, PDF（最大10MB）
            </p>
          </div>

          {imagePreview && (
            <div className="space-y-4">
              <div className="rounded-lg border p-2 bg-muted/30">
                <img
                  src={imagePreview}
                  alt="プレビュー"
                  className="max-h-96 mx-auto rounded"
                />
              </div>

              <Button
                onClick={handleScan}
                disabled={isPending}
                className="w-full"
              >
                <ScanLine className="mr-2 h-4 w-4" />
                {isPending ? "スキャン中..." : "OCRスキャン実行"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OCR Results */}
      {ocrResult && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                抽出結果（編集可能）
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                プロバイダー: {provider} | 信頼度: {Math.round(confidence * 100)}%
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="text-sm font-medium border-b pb-1 mb-3">基本情報</h4>
              <div className="grid gap-3 md:grid-cols-3">
                <EditableField label="姓（漢字）" field="lastNameKanji" />
                <EditableField label="名（漢字）" field="firstNameKanji" />
                <EditableField label="生年月日" field="birthDate" />
                <EditableField label="ふりがな（姓）" field="lastNameFurigana" />
                <EditableField label="ふりがな（名）" field="firstNameFurigana" />
                <EditableField label="国籍" field="nationality" />
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-medium border-b pb-1 mb-3">連絡先</h4>
              <div className="grid gap-3 md:grid-cols-3">
                <EditableField label="郵便番号" field="postalCode" />
                <EditableField label="都道府県" field="prefecture" />
                <EditableField label="市区町村" field="city" />
                <EditableField label="住所" field="addressLine1" />
                <EditableField label="電話番号" field="phone" />
                <EditableField label="メール" field="email" />
              </div>
            </div>

            {/* Education */}
            {ocrResult.education && ocrResult.education.length > 0 && (
              <div>
                <h4 className="text-sm font-medium border-b pb-1 mb-3">学歴</h4>
                <div className="space-y-1">
                  {ocrResult.education.map((ed, i) => (
                    <div key={i} className="text-sm text-muted-foreground">
                      {ed.year}/{ed.month} {ed.schoolName} {ed.faculty || ""} ({ed.eventType})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Work History */}
            {ocrResult.workHistory && ocrResult.workHistory.length > 0 && (
              <div>
                <h4 className="text-sm font-medium border-b pb-1 mb-3">職歴</h4>
                <div className="space-y-1">
                  {ocrResult.workHistory.map((wh, i) => (
                    <div key={i} className="text-sm text-muted-foreground">
                      {wh.startYear}/{wh.startMonth} - {wh.endYear ? `${wh.endYear}/${wh.endMonth}` : "現在"} {wh.companyName} ({wh.eventType})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create Candidate Button */}
            <div className="pt-4 border-t">
              <Button onClick={handleCreateCandidate} className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                この内容で候補者を作成
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
