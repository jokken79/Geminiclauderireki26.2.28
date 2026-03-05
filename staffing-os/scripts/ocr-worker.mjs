/**
 * OCR Worker — PaddleOCR via @gutenye/ocr-node (ONNX, no Python needed)
 * Much higher accuracy than Tesseract.js for Japanese documents
 * Reads base64 image from stdin, outputs JSON result to stdout
 */
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const { default: Ocr } = require("@gutenye/ocr-node")

import fs from "fs"
import path from "path"
import { parse as parseMrz } from "mrz"

// Read all stdin
const chunks = []
for await (const chunk of process.stdin) chunks.push(chunk)
const imageBase64 = Buffer.concat(chunks).toString("utf-8").trim()

// Convert base64 to buffer
let imgBuffer
if (imageBase64.startsWith("data:")) {
  const base64Part = imageBase64.split(",")[1]
  imgBuffer = Buffer.from(base64Part, "base64")
} else {
  imgBuffer = Buffer.from(imageBase64, "base64")
}

// --- PaddleOCR ---
const ocr = await Ocr.create()
const ocrResults = await ocr.detect(imgBuffer)

// Combine all text lines
const lines = ocrResults.map(r => ({ text: r.text, confidence: r.mean, box: r.box }))
const fullText = lines.map(l => l.text).join("\n")
const avgConfidence = lines.length > 0
  ? lines.reduce((sum, l) => sum + l.confidence, 0) / lines.length
  : 0

// --- Document type detection ---
function detectDocumentType(text) {
  if (
    text.includes("在留カード") || text.includes("在留力") ||
    text.includes("RESIDENCE CARD") || text.includes("RESIDENCE") ||
    text.includes("在留資格") || text.includes("在留") ||
    /[A-Z]{2}\d{8}[A-Z]{2}/.test(text) ||
    text.includes("日本国政") || text.includes("GOVERNMENT")
  ) return "zairyu_card"
  if (
    text.includes("運転免許証") || text.includes("免許証") ||
    text.includes("免許の条件") || text.includes("公安委員会") ||
    text.includes("免許") || text.includes("優良") ||
    text.includes("見本") || text.includes("见本") ||
    /\d{12}/.test(text)
  ) return "driver_license"
  return "unknown"
}

const documentType = detectDocumentType(fullText)

// --- Field extraction ---
const fields = {}

// Prefecture detection
const prefectures = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"]
for (const pref of prefectures) {
  if (fullText.includes(pref)) {
    fields.prefecture = pref
    // Find the line containing the prefecture and grab rest as city
    const prefLine = lines.find(l => l.text.includes(pref))
    if (prefLine) {
      const afterPref = prefLine.text.substring(prefLine.text.indexOf(pref) + pref.length).trim()
      if (afterPref) fields.city = afterPref
    }
    break
  }
}

// Name in romaji (uppercase words)
const romajiNames = []
for (const line of lines) {
  const match = line.text.match(/^([A-Z]{2,})$/)
  if (match && !["DX","LA","OE","MOI","JAPAN","GOVERNMENT","RESIDENCE","CARD","NAME","SEX","DATE","BIRTH","STATUS","STAY"].includes(match[1])) {
    romajiNames.push(match[1])
  }
}
// Also check for romaji in mixed lines
for (const line of lines) {
  const matches = line.text.match(/\b([A-Z][A-Z]+)\b/g)
  if (matches) {
    for (const m of matches) {
      if (m.length >= 3 && !["DX","LA","OE","MOI","JAPAN","GOVERNMENT","RESIDENCE","CARD","NAME","SEX","DATE","BIRTH","STATUS","STAY","ATE"].includes(m.toUpperCase())) {
        if (!romajiNames.includes(m)) romajiNames.push(m)
      }
    }
  }
}
if (romajiNames.length >= 2) {
  fields.lastNameRomaji = romajiNames[0]
  fields.firstNameRomaji = romajiNames.slice(1).join(" ")
} else if (romajiNames.length === 1) {
  fields.lastNameRomaji = romajiNames[0]
}

// Birth date: look for YYYY年MM月DD日 pattern
const birthDateMatches = [...fullText.matchAll(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/g)]
for (const m of birthDateMatches) {
  const y = parseInt(m[1])
  const dateStr = `${y}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`
  if (y >= 1950 && y <= 2010 && !fields.birthDate) {
    fields.birthDate = dateStr
  }
}

// Gender
if (fullText.includes("男") || /\bM\b/.test(fullText)) fields.gender = "MALE"
else if (fullText.includes("女") || /\bF\b/.test(fullText)) fields.gender = "FEMALE"

// Nationality for zairyu
const nationalities = {
  "中国":"中国","韓国":"韓国","ベトナム":"ベトナム","フィリピン":"フィリピン",
  "ブラジル":"ブラジル","インドネシア":"インドネシア","ネパール":"ネパール",
  "ミャンマー":"ミャンマー","タイ":"タイ","ペルー":"ペルー","インド":"インド",
  "バングラデシュ":"バングラデシュ","スリランカ":"スリランカ","パキスタン":"パキスタン",
  "台湾":"台湾","モンゴル":"モンゴル","カンボジア":"カンボジア","ラオス":"ラオス"
}
for (const [key, val] of Object.entries(nationalities)) {
  if (fullText.includes(key)) { fields.nationality = val; break }
}

// Visa status for zairyu
const visaMap = {
  "永住者":"PERMANENT_RESIDENT","定住者":"LONG_TERM_RESIDENT",
  "日本人の配偶者":"SPOUSE_OF_JAPANESE","特定活動":"DESIGNATED_ACTIVITIES",
  "技術・人文知識・国際業務":"ENGINEER_HUMANITIES",
  "技術":"ENGINEER_HUMANITIES","人文知識":"ENGINEER_HUMANITIES","人文知":"ENGINEER_HUMANITIES",
  "高度専門職":"HIGHLY_SKILLED_1","企業内転勤":"INTRA_COMPANY_TRANSFER",
  "介護":"NURSING_CARE","技能実習":"TECHNICAL_INTERN_1",
  "特定技能":"SPECIFIED_SKILLED_1","留学":"STUDENT","家族滞在":"DEPENDENT"
}
for (const [key, val] of Object.entries(visaMap)) {
  if (fullText.includes(key)) { fields.visaStatus = val; break }
}

// Residence card number
const cardMatch = fullText.match(/([A-Z]{2}\d{8}[A-Z]{2})/)
if (cardMatch) fields.residenceCardNumber = cardMatch[1]

// Driver license number (12 digits)
if (documentType === "driver_license") {
  const licMatch = fullText.match(/(\d{12})/)
  if (licMatch) fields.driverLicenseNumber = licMatch[1]

  // License type
  if (fullText.includes("普通")) fields.driverLicenseType = "普通自動車免許"
  else if (fullText.includes("準中型")) fields.driverLicenseType = "準中型免許"
  else if (fullText.includes("中型")) fields.driverLicenseType = "中型免許"
  else if (fullText.includes("大型")) fields.driverLicenseType = "大型免許"
}

// Visa expiry: dates >= 2024
for (const m of birthDateMatches) {
  const y = parseInt(m[1])
  if (y >= 2024 && !fields.visaExpiry && !fields.driverLicenseExpiry) {
    const dateStr = `${y}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`
    if (documentType === "driver_license") {
      fields.driverLicenseExpiry = dateStr
    } else {
      fields.visaExpiry = dateStr
    }
  }
}

// Wareki date conversion for license
const warekiMatch = fullText.match(/(?:昭和|平成|令和|合和)(\d{1,2})年\s*(\d{1,2})月\s*(\d{1,2})日/)
if (warekiMatch && documentType === "driver_license") {
  const era = fullText.includes("令和") || fullText.includes("合和") ? 2018 : fullText.includes("平成") ? 1988 : 1925
  const y = era + parseInt(warekiMatch[1])
  if (y >= 1950 && y <= 2010 && !fields.birthDate) {
    fields.birthDate = `${y}-${warekiMatch[2].padStart(2,"0")}-${warekiMatch[3].padStart(2,"0")}`
  }
}

// Name from kanji lines (for driver license: 氏名 line, for zairyu: near top)
if (documentType === "driver_license") {
  // For menkyo, the name is usually in the first few lines
  for (const line of lines.slice(0, 3)) {
    // Look for Japanese name pattern: kanji characters that look like a name
    const nameMatch = line.text.match(/([^\d\s]{1,4})\s+([^\d\s]{1,4})\s+([^\d\s]{1,4})/)
    if (nameMatch && line.text.includes("日") && line.text.includes("生")) {
      // This line likely contains: 姓 名 ... 年月日生
      const parts = line.text.split(/\s+/).filter(p => !p.match(/\d/) && !p.includes("生") && !p.includes("日") && !p.includes("年") && !p.includes("月") && p.length <= 4 && p.length >= 1)
      if (parts.length >= 2) {
        fields.lastNameKanji = parts[0]
        fields.firstNameKanji = parts[1]
      }
    }
  }
  // Fallback: first line often has name
  if (!fields.lastNameKanji && lines.length > 0) {
    const firstLine = lines[0].text
    // Pattern: 姓 名 花子 ...
    const parts = firstLine.match(/^[^\d]*?([一-龥ぁ-んァ-ヶ]{1,4})\s+([一-龥ぁ-んァ-ヶ]{1,4})/)
    if (parts) {
      fields.lastNameKanji = parts[1]
      fields.firstNameKanji = parts[2]
    }
  }
}

// MRZ parsing for zairyu card (from text)
if (documentType === "zairyu_card" || documentType === "unknown") {
  const mrzCandidates = fullText.split("\n").map(l => l.trim().replace(/\s/g, ""))
  const mrzLines = []
  for (const line of mrzCandidates) {
    const cleaned = line.replace(/[^A-Z0-9<]/g, "")
    if (cleaned.length >= 28 && cleaned.length <= 32) mrzLines.push(cleaned.substring(0, 30))
  }
  if (mrzLines.length >= 3) {
    try {
      const result = parseMrz(mrzLines)
      if (result.valid || result.fields) {
        const f = result.fields
        if (f.lastName && !fields.lastNameRomaji) fields.lastNameRomaji = f.lastName
        if (f.firstName && !fields.firstNameRomaji) fields.firstNameRomaji = f.firstName
        if (f.birthDate && !fields.birthDate) fields.birthDate = f.birthDate
        if (f.sex === "male") fields.gender = "MALE"
        else if (f.sex === "female") fields.gender = "FEMALE"
        if (f.nationality) {
          const countryMap = { VNM:"ベトナム",PHL:"フィリピン",BRA:"ブラジル",CHN:"中国",KOR:"韓国",IDN:"インドネシア",THA:"タイ",MMR:"ミャンマー",NPL:"ネパール",PER:"ペルー",JPN:"日本",USA:"アメリカ",IND:"インド",BGD:"バングラデシュ",LKA:"スリランカ",PAK:"パキスタン",TWN:"台湾",MNG:"モンゴル",KHM:"カンボジア",LAO:"ラオス" }
          if (!fields.nationality) fields.nationality = countryMap[f.nationality] || f.nationality
        }
        if (f.documentNumber && !fields.residenceCardNumber) fields.residenceCardNumber = f.documentNumber
        if (f.expirationDate && !fields.visaExpiry) fields.visaExpiry = f.expirationDate
      }
    } catch {}
  }
}

const hasData = Object.values(fields).some(v => v !== undefined && v !== "")

const result = {
  success: hasData || fullText.trim().length > 10,
  provider: "PaddleOCR",
  documentType,
  fields,
  confidence: avgConfidence,
  rawText: fullText,
  ocrLines: lines,
  error: (!hasData && fullText.trim().length <= 10)
    ? "テキストを抽出できませんでした。画像の品質を確認してください。"
    : undefined,
}

process.stdout.write(JSON.stringify(result))
process.exit(0)
