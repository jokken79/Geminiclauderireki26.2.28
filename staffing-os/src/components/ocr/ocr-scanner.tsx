"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Upload, ScanLine, Edit, ArrowRight, CreditCard, Car } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { runOcr } from "@/actions/ocr"
import type { OcrExtractedFields } from "@/services/ocr-service"

type DocumentType = "zairyu_card" | "driver_license" | "unknown"

export function OcrScanner() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<OcrExtractedFields | null>(null)
  const [documentType, setDocumentType] = useState<DocumentType>("unknown")
  const [confidence, setConfidence] = useState<number>(0)
  const [rawText, setRawText] = useState<string>("")
  const [showRawText, setShowRawText] = useState(false)

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
      setRawText("")
    }
    reader.readAsDataURL(file)
  }

  const handleScan = () => {
    if (!imagePreview) return

    startTransition(async () => {
      const result = await runOcr(imagePreview)

      if (result.rawText) setRawText(result.rawText)

      if (!result.success) {
        toast.error(result.error || "OCR処理に失敗しました")
        return
      }

      setOcrResult(result.fields)
      setDocumentType(result.documentType)
      setConfidence(result.confidence)

      const hasFields = Object.values(result.fields).some(v => v)
      const typeLabel = result.documentType === "zairyu_card" ? "在留カード"
        : result.documentType === "driver_license" ? "免許証" : "書類"

      if (hasFields) {
        toast.success(`${typeLabel}のスキャン完了（信頼度: ${Math.round(result.confidence * 100)}%）`)
      } else {
        toast.warning("テキストは読み取れましたが、フィールドを自動抽出できませんでした。認識テキストを確認してください。")
      }
    })
  }

  const handleApplyToForm = () => {
    if (!ocrResult) return

    const params = new URLSearchParams()
    const fieldMap: Record<string, string | undefined> = {
      lastNameKanji: ocrResult.lastNameKanji,
      firstNameKanji: ocrResult.firstNameKanji,
      lastNameFurigana: ocrResult.lastNameFurigana,
      firstNameFurigana: ocrResult.firstNameFurigana,
      lastNameRomaji: ocrResult.lastNameRomaji,
      firstNameRomaji: ocrResult.firstNameRomaji,
      birthDate: ocrResult.birthDate,
      gender: ocrResult.gender,
      nationality: ocrResult.nationality,
      postalCode: ocrResult.postalCode,
      prefecture: ocrResult.prefecture,
      city: ocrResult.city,
      addressLine1: ocrResult.addressLine1,
      phone: ocrResult.phone,
      residenceCardNumber: ocrResult.residenceCardNumber,
      visaStatus: ocrResult.visaStatus,
      visaExpiry: ocrResult.visaExpiry,
      driverLicenseType: ocrResult.driverLicenseType,
      driverLicenseExpiry: ocrResult.driverLicenseExpiry,
    }

    for (const [key, value] of Object.entries(fieldMap)) {
      if (value) params.set(key, value)
    }

    router.push(`/candidates/new?${params.toString()}`)
  }

  const updateField = (field: keyof OcrExtractedFields, value: string) => {
    if (ocrResult) {
      setOcrResult({ ...ocrResult, [field]: value })
    }
  }

  const EditableField = ({ label, field }: { label: string; field: keyof OcrExtractedFields }) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        value={(ocrResult?.[field] as string) || ""}
        onChange={(e) => updateField(field, e.target.value)}
        className="text-sm"
      />
    </div>
  )

  const documentTypeIcon = documentType === "zairyu_card" ? <CreditCard className="h-4 w-4" />
    : documentType === "driver_license" ? <Car className="h-4 w-4" /> : null

  const documentTypeLabel = documentType === "zairyu_card" ? "在留カード"
    : documentType === "driver_license" ? "運転免許証" : "書類"

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            書類スキャン
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>在留カードまたは免許証の写真を選択</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              対応形式: JPEG, PNG（最大10MB）・鮮明な写真を使用してください
            </p>
          </div>

          {imagePreview && (
            <div className="space-y-4">
              <div className="rounded-lg border p-2 bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="プレビュー"
                  className="max-h-72 mx-auto rounded"
                />
              </div>

              <Button
                onClick={handleScan}
                disabled={isPending}
                className="w-full"
              >
                <ScanLine className="mr-2 h-4 w-4" />
                {isPending ? "スキャン中（初回は言語データのダウンロードに時間がかかります）..." : "スキャン実行"}
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
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {documentTypeIcon}
                <span>{documentTypeLabel}</span>
                <span>|</span>
                <span>信頼度: {Math.round(confidence * 100)}%</span>
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
                <EditableField label="姓（ローマ字）" field="lastNameRomaji" />
                <EditableField label="名（ローマ字）" field="firstNameRomaji" />
                <EditableField label="性別" field="gender" />
                <EditableField label="国籍" field="nationality" />
              </div>
            </div>

            {/* Address */}
            <div>
              <h4 className="text-sm font-medium border-b pb-1 mb-3">住所</h4>
              <div className="grid gap-3 md:grid-cols-3">
                <EditableField label="郵便番号" field="postalCode" />
                <EditableField label="都道府県" field="prefecture" />
                <EditableField label="市区町村" field="city" />
                <EditableField label="番地" field="addressLine1" />
                <EditableField label="電話番号" field="phone" />
              </div>
            </div>

            {/* Immigration (在留カード) */}
            {(documentType === "zairyu_card" || ocrResult.residenceCardNumber || ocrResult.visaStatus) && (
              <div>
                <h4 className="text-sm font-medium border-b pb-1 mb-3">在留情報</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  <EditableField label="在留カード番号" field="residenceCardNumber" />
                  <EditableField label="在留資格" field="visaStatus" />
                  <EditableField label="在留期限" field="visaExpiry" />
                </div>
              </div>
            )}

            {/* Driver License */}
            {(documentType === "driver_license" || ocrResult.driverLicenseType) && (
              <div>
                <h4 className="text-sm font-medium border-b pb-1 mb-3">免許情報</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  <EditableField label="免許種類" field="driverLicenseType" />
                  <EditableField label="有効期限" field="driverLicenseExpiry" />
                  <EditableField label="免許番号" field="driverLicenseNumber" />
                </div>
              </div>
            )}

            {/* Raw Text Toggle (for debugging) */}
            {rawText && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  {showRawText ? "認識テキストを非表示" : "認識テキストを表示"}
                </button>
                {showRawText && (
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap">
                    {rawText}
                  </pre>
                )}
              </div>
            )}

            {/* Apply to Form Button */}
            <div className="pt-4 border-t">
              <Button onClick={handleApplyToForm} className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                この内容で履歴書に反映
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
