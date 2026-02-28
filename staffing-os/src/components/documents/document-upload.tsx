"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createDocument } from "@/actions/documents"
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants"
import type { DocumentType } from "@prisma/client"

interface DocumentUploadProps {
  candidateId: string
  onSuccess?: () => void
}

export function DocumentUpload({ candidateId, onSuccess }: DocumentUploadProps) {
  const [isPending, startTransition] = useTransition()
  const [docType, setDocType] = useState<DocumentType | "">("")
  const [expiryDate, setExpiryDate] = useState("")
  const [notes, setNotes] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    // Limit to 10MB
    if (f.size > 10 * 1024 * 1024) {
      toast.error("ファイルサイズは10MB以下にしてください")
      return
    }

    setFile(f)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !docType) {
      toast.error("書類種別とファイルを選択してください")
      return
    }

    startTransition(async () => {
      // Convert file to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string

        const result = await createDocument({
          candidateId,
          type: docType,
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
          expiryDate: expiryDate || undefined,
          notes: notes || undefined,
        })

        if ("error" in result) {
          toast.error(result.error)
        } else {
          toast.success("書類をアップロードしました")
          setFile(null)
          setDocType("")
          setExpiryDate("")
          setNotes("")
          onSuccess?.()
        }
      }
      reader.readAsDataURL(file)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>書類種別 *</Label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocumentType)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">選択してください</option>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>有効期限</Label>
          <Input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <Label>ファイル * (最大10MB)</Label>
          <Input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
          />
          {file && (
            <p className="text-xs text-muted-foreground mt-1">
              {file.name} ({(file.size / 1024).toFixed(0)}KB)
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label>メモ</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="書類に関するメモ"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending || !file || !docType}>
        <Upload className="mr-2 h-4 w-4" />
        {isPending ? "アップロード中..." : "アップロード"}
      </Button>
    </form>
  )
}
