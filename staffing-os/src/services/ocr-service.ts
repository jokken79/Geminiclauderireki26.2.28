/**
 * OCR Service — Local OCR using Tesseract.js + MRZ parser
 *
 * No cloud AI providers needed. Processes:
 * 1. 在留カード (Residence Card) — Japanese text + MRZ zone
 * 2. 免許証 (Driver's License) — Japanese text extraction
 *
 * Uses Tesseract.js (WebAssembly) for text recognition
 * and 'mrz' package for Machine Readable Zone parsing.
 */

import { createWorker, type Worker } from "tesseract.js"
import { parse as parseMrz } from "mrz"

export interface OcrResult {
  success: boolean
  provider: string
  documentType: "zairyu_card" | "driver_license" | "unknown"
  fields: OcrExtractedFields
  confidence: number
  rawText?: string
  error?: string
}

export interface OcrExtractedFields {
  // Names
  lastNameKanji?: string
  firstNameKanji?: string
  lastNameFurigana?: string
  firstNameFurigana?: string
  lastNameRomaji?: string
  firstNameRomaji?: string
  // Personal
  birthDate?: string
  gender?: string
  nationality?: string
  // Address
  postalCode?: string
  prefecture?: string
  city?: string
  addressLine1?: string
  // Contact
  phone?: string
  // Immigration (在留カード)
  residenceCardNumber?: string
  visaStatus?: string
  visaExpiry?: string
  // Passport
  passportNumber?: string
  // Driver's license (免許証)
  driverLicenseNumber?: string
  driverLicenseExpiry?: string
  driverLicenseType?: string
}

// ===== Tesseract.js Worker Management =====

let workerJpn: Worker | null = null
let workerMrz: Worker | null = null

async function getJpnWorker(): Promise<Worker> {
  if (!workerJpn) {
    workerJpn = await createWorker("jpn")
  }
  return workerJpn
}

async function getMrzWorker(): Promise<Worker> {
  if (!workerMrz) {
    workerMrz = await createWorker("eng")
  }
  return workerMrz
}

// ===== Document Type Detection =====

function detectDocumentType(text: string): "zairyu_card" | "driver_license" | "unknown" {
  const lower = text.toLowerCase()
  // 在留カード indicators
  if (
    text.includes("在留カード") ||
    text.includes("RESIDENCE CARD") ||
    text.includes("在留資格") ||
    text.includes("在留期間") ||
    /[A-Z]{2}\d{8}[A-Z]{2}/.test(text) // Residence card number pattern
  ) {
    return "zairyu_card"
  }
  // 免許証 indicators
  if (
    text.includes("運転免許証") ||
    text.includes("免許の条件") ||
    text.includes("公安委員会") ||
    lower.includes("driver")
  ) {
    return "driver_license"
  }
  return "unknown"
}

// ===== MRZ Parsing for 在留カード =====

function extractMrzFromText(text: string): OcrExtractedFields {
  const fields: OcrExtractedFields = {}

  // Find MRZ lines (TD1 format: 3 lines of 30 characters)
  const lines = text.split("\n").map(l => l.trim().replace(/\s/g, ""))
  const mrzLines: string[] = []

  for (const line of lines) {
    // MRZ lines contain mostly uppercase letters, digits, and <
    const cleaned = line.replace(/[^A-Z0-9<]/g, "")
    if (cleaned.length >= 28 && cleaned.length <= 32) {
      mrzLines.push(cleaned.substring(0, 30))
    }
  }

  if (mrzLines.length >= 3) {
    try {
      const result = parseMrz(mrzLines)

      if (result.valid || result.fields) {
        const f = result.fields

        // Name (romaji)
        if (f.lastName) fields.lastNameRomaji = f.lastName
        if (f.firstName) fields.firstNameRomaji = f.firstName

        // Birth date
        if (f.birthDate) {
          fields.birthDate = f.birthDate
        }

        // Gender
        if (f.sex === "male") fields.gender = "MALE"
        else if (f.sex === "female") fields.gender = "FEMALE"

        // Nationality
        if (f.nationality) {
          fields.nationality = convertCountryCode(f.nationality)
        }

        // Document number (在留カード番号)
        if (f.documentNumber) {
          fields.residenceCardNumber = f.documentNumber
        }

        // Expiry date
        if (f.expirationDate) {
          fields.visaExpiry = f.expirationDate
        }
      }
    } catch {
      // MRZ parse failed — continue with regex extraction
    }
  }

  return fields
}

// ===== Japanese Text Parsing =====

function parseZairyuCard(text: string): OcrExtractedFields {
  const fields: OcrExtractedFields = {}

  // 氏名 (Name in Kanji)
  const nameMatch = text.match(/氏\s*名\s*[:\s]*(.+?)[\n\r]/)
  if (nameMatch) {
    const nameParts = nameMatch[1].trim().split(/\s+/)
    if (nameParts.length >= 2) {
      fields.lastNameKanji = nameParts[0]
      fields.firstNameKanji = nameParts.slice(1).join("")
    } else if (nameParts[0]) {
      fields.lastNameKanji = nameParts[0]
    }
  }

  // Name in Romaji (usually on the card)
  const romajiMatch = text.match(/(?:NAME|名前)\s*[:\s]*([A-Z]+)\s+([A-Z]+)/)
  if (romajiMatch) {
    fields.lastNameRomaji = romajiMatch[1]
    fields.firstNameRomaji = romajiMatch[2]
  }

  // 国籍・地域 (Nationality)
  const nationalityMatch = text.match(/国籍[・地域]*\s*[:\s]*(.+?)[\n\r]/)
  if (nationalityMatch) {
    fields.nationality = nationalityMatch[1].trim()
  }

  // 生年月日 (Birth date)
  const birthMatch = text.match(/生年月日\s*[:\s]*(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/)
  if (birthMatch) {
    fields.birthDate = `${birthMatch[1]}-${birthMatch[2].padStart(2, "0")}-${birthMatch[3].padStart(2, "0")}`
  }

  // 性別 (Gender)
  const genderMatch = text.match(/性\s*別\s*[:\s]*(男|女)/)
  if (genderMatch) {
    fields.gender = genderMatch[1] === "男" ? "MALE" : "FEMALE"
  }

  // 在留資格 (Visa status)
  const visaMatch = text.match(/在留資格\s*[:\s]*(.+?)[\n\r]/)
  if (visaMatch) {
    fields.visaStatus = mapVisaStatus(visaMatch[1].trim())
  }

  // 在留期間（満了日）(Visa expiry)
  const expiryMatch = text.match(/(?:在留期間|満了日|期間満了)\s*[:\s]*(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/)
  if (expiryMatch) {
    fields.visaExpiry = `${expiryMatch[1]}-${expiryMatch[2].padStart(2, "0")}-${expiryMatch[3].padStart(2, "0")}`
  }

  // 在留カード番号 (Residence card number)
  const cardMatch = text.match(/([A-Z]{2}\d{8}[A-Z]{2})/)
  if (cardMatch) {
    fields.residenceCardNumber = cardMatch[1]
  }

  // 住居地 (Address)
  const addressMatch = text.match(/住居地\s*[:\s]*(.+?)(?:[\n\r]|$)/)
  if (addressMatch) {
    const addr = addressMatch[1].trim()
    // Try to split prefecture
    const prefMatch = addr.match(/^(.{2,3}[都道府県])(.+)/)
    if (prefMatch) {
      fields.prefecture = prefMatch[1]
      fields.city = prefMatch[2].trim()
    } else {
      fields.addressLine1 = addr
    }
  }

  return fields
}

function parseDriverLicense(text: string): OcrExtractedFields {
  const fields: OcrExtractedFields = {}

  // 氏名 (Name)
  const nameMatch = text.match(/氏\s*名\s*[:\s]*(.+?)[\n\r]/)
  if (nameMatch) {
    const nameParts = nameMatch[1].trim().split(/\s+/)
    if (nameParts.length >= 2) {
      fields.lastNameKanji = nameParts[0]
      fields.firstNameKanji = nameParts.slice(1).join("")
    }
  }

  // 生年月日 (Birth date) — Japanese license format
  const birthMatch = text.match(/(?:生年月日|生\s*年\s*月\s*日)\s*[:\s]*(?:昭和|平成|令和)?\s*(\d{1,4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/)
  if (birthMatch) {
    const year = parseInt(birthMatch[1])
    // If year < 100, it's wareki — convert to seireki
    const fullYear = year < 100 ? convertWarekiYear(year, text) : year
    fields.birthDate = `${fullYear}-${birthMatch[2].padStart(2, "0")}-${birthMatch[3].padStart(2, "0")}`
  }

  // 住所 (Address)
  const addressMatch = text.match(/住\s*所\s*[:\s]*(.+?)[\n\r]/)
  if (addressMatch) {
    const addr = addressMatch[1].trim()
    const prefMatch = addr.match(/^(.{2,3}[都道府県])(.+)/)
    if (prefMatch) {
      fields.prefecture = prefMatch[1]
      fields.city = prefMatch[2].trim()
    } else {
      fields.addressLine1 = addr
    }
  }

  // 免許証番号 (License number — 12 digits)
  const licenseNumMatch = text.match(/(\d{12})/)
  if (licenseNumMatch) {
    fields.driverLicenseNumber = licenseNumMatch[1]
  }

  // 有効期限 (Expiry)
  const expiryMatch = text.match(/(?:有効期限|期限)\s*[:\s]*(?:令和|平成)?\s*(\d{1,4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/)
  if (expiryMatch) {
    const year = parseInt(expiryMatch[1])
    const fullYear = year < 100 ? convertWarekiYear(year, text) : year
    fields.driverLicenseExpiry = `${fullYear}-${expiryMatch[2].padStart(2, "0")}-${expiryMatch[3].padStart(2, "0")}`
  }

  // 免許の種類 (License type from conditions)
  const typePatterns = [
    { pattern: /普通/, value: "普通自動車免許" },
    { pattern: /準中型/, value: "準中型免許" },
    { pattern: /中型/, value: "中型免許" },
    { pattern: /大型/, value: "大型免許" },
    { pattern: /原付/, value: "原付免許" },
  ]
  for (const { pattern, value } of typePatterns) {
    if (pattern.test(text)) {
      fields.driverLicenseType = value
      break
    }
  }

  return fields
}

// ===== Utility Functions =====

function convertCountryCode(code: string): string {
  const map: Record<string, string> = {
    VNM: "ベトナム", PHL: "フィリピン", BRA: "ブラジル",
    CHN: "中国", KOR: "韓国", IDN: "インドネシア",
    THA: "タイ", MMR: "ミャンマー", NPL: "ネパール",
    PER: "ペルー", JPN: "日本", USA: "アメリカ",
    GBR: "イギリス", IND: "インド", BGD: "バングラデシュ",
    LKA: "スリランカ", PAK: "パキスタン", TWN: "台湾",
    MNG: "モンゴル", KHM: "カンボジア", LAO: "ラオス",
  }
  return map[code] || code
}

function mapVisaStatus(text: string): string {
  const map: Record<string, string> = {
    "永住者": "PERMANENT_RESIDENT",
    "定住者": "LONG_TERM_RESIDENT",
    "日本人の配偶者等": "SPOUSE_OF_JAPANESE",
    "特定活動": "DESIGNATED_ACTIVITIES",
    "技術・人文知識・国際業務": "ENGINEER_HUMANITIES",
    "技術": "ENGINEER_HUMANITIES",
    "人文知識": "ENGINEER_HUMANITIES",
    "高度専門職1号": "HIGHLY_SKILLED_1",
    "高度専門職2号": "HIGHLY_SKILLED_2",
    "企業内転勤": "INTRA_COMPANY_TRANSFER",
    "介護": "NURSING_CARE",
    "文化活動": "CULTURAL_ACTIVITIES",
    "技能実習1号": "TECHNICAL_INTERN_1",
    "技能実習2号": "TECHNICAL_INTERN_2",
    "技能実習3号": "TECHNICAL_INTERN_3",
    "特定技能1号": "SPECIFIED_SKILLED_1",
    "特定技能2号": "SPECIFIED_SKILLED_2",
    "留学": "STUDENT",
    "家族滞在": "DEPENDENT",
  }

  for (const [key, value] of Object.entries(map)) {
    if (text.includes(key)) return value
  }
  return "OTHER"
}

function convertWarekiYear(warekiYear: number, context: string): number {
  if (context.includes("令和")) return 2018 + warekiYear
  if (context.includes("平成")) return 1988 + warekiYear
  if (context.includes("昭和")) return 1925 + warekiYear
  // Default: assume Reiwa for recent dates
  return 2018 + warekiYear
}

// ===== Main OCR Function =====

export async function processOcr(imageBase64: string): Promise<OcrResult> {
  try {
    // Strip data URL prefix for Tesseract
    const base64Data = imageBase64.includes(",") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`

    // Step 1: OCR with Japanese language
    console.log("[OCR] Creating Tesseract.js Japanese worker...")
    const jpnWorker = await getJpnWorker()
    console.log("[OCR] Worker ready, starting recognition...")
    const jpnResult = await jpnWorker.recognize(base64Data)
    const jpnText = jpnResult.data.text
    const jpnConfidence = jpnResult.data.confidence / 100
    console.log(`[OCR] Japanese text extracted (confidence: ${(jpnConfidence * 100).toFixed(1)}%, length: ${jpnText.length})`)

    // Step 2: Detect document type
    const documentType = detectDocumentType(jpnText)
    console.log(`[OCR] Document type detected: ${documentType}`)

    // Step 3: Try MRZ extraction (for 在留カード)
    let mrzFields: OcrExtractedFields = {}
    if (documentType === "zairyu_card" || documentType === "unknown") {
      console.log("[OCR] Attempting MRZ extraction...")
      const mrzWorker = await getMrzWorker()
      const mrzResult = await mrzWorker.recognize(base64Data)
      mrzFields = extractMrzFromText(mrzResult.data.text)
    }

    // Step 4: Parse Japanese text based on document type
    let textFields: OcrExtractedFields = {}
    if (documentType === "driver_license") {
      textFields = parseDriverLicense(jpnText)
    } else {
      textFields = parseZairyuCard(jpnText)
    }

    // Step 5: Merge results (MRZ takes priority for structured data)
    const fields: OcrExtractedFields = {
      ...textFields,
      ...Object.fromEntries(
        Object.entries(mrzFields).filter(([, v]) => v !== undefined && v !== "")
      ),
    }

    // Keep Japanese text fields if MRZ didn't provide them
    if (textFields.lastNameKanji && !fields.lastNameKanji) {
      fields.lastNameKanji = textFields.lastNameKanji
    }
    if (textFields.firstNameKanji && !fields.firstNameKanji) {
      fields.firstNameKanji = textFields.firstNameKanji
    }

    const hasData = Object.values(fields).some(v => v !== undefined && v !== "")

    return {
      success: hasData,
      provider: "Tesseract.js",
      documentType,
      fields,
      confidence: hasData ? jpnConfidence : 0,
      rawText: jpnText,
      error: hasData ? undefined : "テキストを抽出できませんでした。画像の品質を確認してください。",
    }
  } catch (error) {
    console.error("[OCR] Processing error:", error)
    return {
      success: false,
      provider: "Tesseract.js",
      documentType: "unknown",
      fields: {},
      confidence: 0,
      error: "OCR処理中にエラーが発生しました。もう一度お試しください。",
    }
  }
}

/** Cleanup workers when no longer needed */
export async function terminateOcrWorkers(): Promise<void> {
  if (workerJpn) {
    await workerJpn.terminate()
    workerJpn = null
  }
  if (workerMrz) {
    await workerMrz.terminate()
    workerMrz = null
  }
}
