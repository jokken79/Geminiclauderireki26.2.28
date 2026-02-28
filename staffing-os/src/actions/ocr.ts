"use server"

import { auth } from "@/lib/auth"
import { processOcr, type OcrResult } from "@/services/ocr-service"

export async function runOcr(imageBase64: string): Promise<OcrResult> {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  return processOcr(imageBase64)
}
