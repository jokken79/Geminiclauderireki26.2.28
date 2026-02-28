"use client"

import { useCallback, useRef } from "react"
import { useFormContext } from "react-hook-form"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { CandidateFormData } from "@/lib/validators/candidate"

export function Step4Photo() {
  const { setValue, watch } = useFormContext<CandidateFormData>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoDataUrl = watch("photoDataUrl")

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        alert("ファイルサイズは5MB以下にしてください")
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        setValue("photoDataUrl", reader.result as string)
      }
      reader.readAsDataURL(file)
    },
    [setValue]
  )

  const removePhoto = () => {
    setValue("photoDataUrl", "")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="space-y-4">
      <Label>証明写真（3×4cm）</Label>
      <p className="text-sm text-muted-foreground">
        縦4cm × 横3cm のパスポートサイズの写真をアップロードしてください。
      </p>

      <div className="flex items-start gap-6">
        {/* Photo preview */}
        <div className="flex h-40 w-30 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {photoDataUrl ? (
            <img
              src={photoDataUrl}
              alt="証明写真"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-center text-xs text-muted-foreground">
              <Upload className="mx-auto mb-1 h-6 w-6" />
              未アップロード
            </div>
          )}
        </div>

        {/* Upload controls */}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            写真を選択
          </Button>
          {photoDataUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removePhoto}
            >
              <X className="mr-1 h-3 w-3" />
              削除
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP（最大5MB）
          </p>
        </div>
      </div>
    </div>
  )
}
