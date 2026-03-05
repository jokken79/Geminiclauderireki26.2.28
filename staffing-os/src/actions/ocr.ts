"use server"

import { requireRole } from "@/lib/rbac"
import { execFile } from "node:child_process"
import path from "node:path"
import type { OcrResult } from "@/services/ocr-service"

export async function runOcr(imageBase64: string): Promise<OcrResult> {
  await requireRole("TANTOSHA")

  console.log(`[OCR Action] Starting, image size: ${Math.round(imageBase64.length / 1024)}KB`)

  const workerScript = path.join(process.cwd(), "scripts", "ocr-worker.mjs")

  return new Promise<OcrResult>((resolve) => {
    const child = execFile("node", [workerScript], {
      timeout: 60_000,
      maxBuffer: 50 * 1024 * 1024,
    }, (error, stdout, stderr) => {
      if (error) {
        console.error("[OCR Action] Worker error:", error.message)
        if (stderr) console.error("[OCR Action] stderr:", stderr)
        resolve({
          success: false,
          provider: "Tesseract.js",
          documentType: "unknown",
          fields: {},
          confidence: 0,
          error: `OCR処理エラー: ${error.message}`,
        })
        return
      }

      try {
        const result = JSON.parse(stdout)
        console.log(`[OCR Action] Complete, success: ${result.success}, type: ${result.documentType}`)
        resolve(result)
      } catch (parseError) {
        console.error("[OCR Action] Parse error:", stdout.substring(0, 200))
        resolve({
          success: false,
          provider: "Tesseract.js",
          documentType: "unknown",
          fields: {},
          confidence: 0,
          error: "OCR結果の解析に失敗しました",
        })
      }
    })

    child.stdin?.write(imageBase64)
    child.stdin?.end()
  })
}
