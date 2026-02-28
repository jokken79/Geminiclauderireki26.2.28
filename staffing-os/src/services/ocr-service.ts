/**
 * OCR Service — Multi-provider OCR with circuit breaker pattern
 *
 * Supports:
 * 1. Azure Computer Vision (primary)
 * 2. Google Gemini Vision (backup)
 * 3. OpenAI Vision (secondary)
 *
 * Each provider is tried in order. If one fails, the next is attempted.
 * When no providers are configured, returns a demo/manual mode response.
 */

export interface OcrResult {
  success: boolean
  provider: string
  fields: OcrExtractedFields
  confidence: number
  rawText?: string
  error?: string
}

export interface OcrExtractedFields {
  lastNameKanji?: string
  firstNameKanji?: string
  lastNameFurigana?: string
  firstNameFurigana?: string
  lastNameRomaji?: string
  firstNameRomaji?: string
  birthDate?: string
  gender?: string
  nationality?: string
  postalCode?: string
  prefecture?: string
  city?: string
  addressLine1?: string
  phone?: string
  email?: string
  // Education entries
  education?: {
    year: number
    month: number
    schoolName: string
    faculty?: string
    eventType: string
  }[]
  // Work history entries
  workHistory?: {
    startYear: number
    startMonth: number
    endYear?: number
    endMonth?: number
    companyName: string
    position?: string
    eventType: string
  }[]
  // Qualifications
  qualifications?: {
    year: number
    month: number
    name: string
  }[]
  // Photo extracted from document
  photoDataUrl?: string
}

interface OcrProvider {
  name: string
  isConfigured: () => boolean
  process: (imageBase64: string) => Promise<OcrResult>
}

/** Check if Azure Computer Vision is configured */
function isAzureConfigured(): boolean {
  return !!(process.env.AZURE_VISION_ENDPOINT && process.env.AZURE_VISION_KEY)
}

/** Check if Google Gemini is configured */
function isGeminiConfigured(): boolean {
  return !!process.env.GOOGLE_GEMINI_API_KEY
}

/** Check if OpenAI is configured */
function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}

/** Process with Azure Computer Vision */
async function processWithAzure(imageBase64: string): Promise<OcrResult> {
  const endpoint = process.env.AZURE_VISION_ENDPOINT!
  const key = process.env.AZURE_VISION_KEY!

  // Strip data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "")
  const buffer = Buffer.from(base64Data, "base64")

  const response = await fetch(`${endpoint}/vision/v3.2/read/analyze`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/octet-stream",
    },
    body: buffer,
  })

  if (!response.ok) {
    throw new Error(`Azure Vision API error: ${response.status}`)
  }

  // Azure uses async processing — poll for results
  const operationUrl = response.headers.get("Operation-Location")
  if (!operationUrl) throw new Error("No operation URL returned from Azure")

  let result
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1000))
    const pollResponse = await fetch(operationUrl, {
      headers: { "Ocp-Apim-Subscription-Key": key },
    })
    result = await pollResponse.json()
    if (result.status === "succeeded") break
    if (result.status === "failed") throw new Error("Azure OCR processing failed")
  }

  const rawText = result?.analyzeResult?.readResults
    ?.flatMap((r: { lines: { text: string }[] }) => r.lines.map((l: { text: string }) => l.text))
    .join("\n") || ""

  return {
    success: true,
    provider: "Azure Computer Vision",
    fields: parseJapaneseResume(rawText),
    confidence: 0.85,
    rawText,
  }
}

/** Process with Google Gemini Vision */
async function processWithGemini(imageBase64: string): Promise<OcrResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY!

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "")
  const mimeType = imageBase64.match(/data:(image\/\w+);base64/)?.[1] || "image/jpeg"

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: RESUME_EXTRACTION_PROMPT,
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}"

  try {
    const fields = JSON.parse(text) as OcrExtractedFields
    return {
      success: true,
      provider: "Google Gemini",
      fields,
      confidence: 0.9,
    }
  } catch {
    return {
      success: true,
      provider: "Google Gemini",
      fields: parseJapaneseResume(text),
      confidence: 0.7,
      rawText: text,
    }
  }
}

/** Process with OpenAI Vision */
async function processWithOpenAI(imageBase64: string): Promise<OcrResult> {
  const apiKey = process.env.OPENAI_API_KEY!

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: RESUME_EXTRACTION_PROMPT },
            {
              type: "image_url",
              image_url: { url: imageBase64 },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || "{}"

  try {
    const fields = JSON.parse(text) as OcrExtractedFields
    return {
      success: true,
      provider: "OpenAI GPT-4o",
      fields,
      confidence: 0.9,
    }
  } catch {
    return {
      success: true,
      provider: "OpenAI GPT-4o",
      fields: {},
      confidence: 0.3,
      rawText: text,
    }
  }
}

const RESUME_EXTRACTION_PROMPT = `You are an expert at reading Japanese resumes (履歴書/rirekisho).
Extract the following fields from this resume image and return them as JSON:

{
  "lastNameKanji": "姓（漢字）",
  "firstNameKanji": "名（漢字）",
  "lastNameFurigana": "ふりがな（姓）",
  "firstNameFurigana": "ふりがな（名）",
  "lastNameRomaji": "Last name in romaji",
  "firstNameRomaji": "First name in romaji",
  "birthDate": "YYYY-MM-DD format",
  "gender": "MALE or FEMALE",
  "nationality": "国籍",
  "postalCode": "XXX-XXXX",
  "prefecture": "都道府県",
  "city": "市区町村",
  "addressLine1": "住所",
  "phone": "電話番号",
  "email": "メールアドレス",
  "education": [{ "year": 2020, "month": 4, "schoolName": "学校名", "faculty": "学部", "eventType": "入学/卒業" }],
  "workHistory": [{ "startYear": 2020, "startMonth": 4, "endYear": 2022, "endMonth": 3, "companyName": "会社名", "position": "職種", "eventType": "入社/退社" }],
  "qualifications": [{ "year": 2020, "month": 6, "name": "資格名" }]
}

Only include fields that are clearly visible. Use null for fields that cannot be determined.
All dates should use YYYY-MM-DD format. Return valid JSON only.`

/** Basic text parser for OCR raw output (fallback) */
function parseJapaneseResume(text: string): OcrExtractedFields {
  const fields: OcrExtractedFields = {}

  // Try to extract name patterns (very basic)
  const nameMatch = text.match(/氏名[:\s]*(.+?)[\n\r]/)
  if (nameMatch) {
    const parts = nameMatch[1].trim().split(/\s+/)
    if (parts.length >= 2) {
      fields.lastNameKanji = parts[0]
      fields.firstNameKanji = parts[1]
    }
  }

  // Try to extract phone
  const phoneMatch = text.match(/(\d{2,4}[-\s]?\d{2,4}[-\s]?\d{3,4})/)
  if (phoneMatch) {
    fields.phone = phoneMatch[1]
  }

  // Try to extract postal code
  const postalMatch = text.match(/〒?\s*(\d{3}[-\s]?\d{4})/)
  if (postalMatch) {
    fields.postalCode = postalMatch[1]
  }

  return fields
}

// ===== Main OCR function =====

const providers: OcrProvider[] = [
  { name: "Azure", isConfigured: isAzureConfigured, process: processWithAzure },
  { name: "Gemini", isConfigured: isGeminiConfigured, process: processWithGemini },
  { name: "OpenAI", isConfigured: isOpenAIConfigured, process: processWithOpenAI },
]

export async function processOcr(imageBase64: string): Promise<OcrResult> {
  const configuredProviders = providers.filter((p) => p.isConfigured())

  if (configuredProviders.length === 0) {
    return {
      success: false,
      provider: "none",
      fields: {},
      confidence: 0,
      error: "OCRプロバイダーが設定されていません。環境変数を確認してください（AZURE_VISION_ENDPOINT, GOOGLE_GEMINI_API_KEY, or OPENAI_API_KEY）",
    }
  }

  // Try each provider in order (circuit breaker pattern)
  for (const provider of configuredProviders) {
    try {
      console.log(`Trying OCR provider: ${provider.name}`)
      const result = await provider.process(imageBase64)
      console.log(`OCR success with ${provider.name}, confidence: ${result.confidence}`)
      return result
    } catch (error) {
      console.error(`OCR provider ${provider.name} failed:`, error)
      // Continue to next provider
    }
  }

  return {
    success: false,
    provider: "all-failed",
    fields: {},
    confidence: 0,
    error: "全てのOCRプロバイダーが失敗しました。手動で入力してください。",
  }
}
