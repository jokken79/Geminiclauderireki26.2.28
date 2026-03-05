import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock tesseract.js
vi.mock("tesseract.js", () => ({
  createWorker: vi.fn().mockResolvedValue({
    recognize: vi.fn().mockResolvedValue({
      data: { text: "", confidence: 0 },
    }),
    terminate: vi.fn(),
  }),
}))

// Mock mrz
vi.mock("mrz", () => ({
  parse: vi.fn().mockReturnValue({ valid: false, fields: {} }),
}))

describe("processOcr", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("extracts data from 在留カード text", async () => {
    const { createWorker } = await import("tesseract.js")
    const mockWorker = {
      recognize: vi.fn().mockResolvedValue({
        data: {
          text: `在留カード
氏名 グエン バン
国籍・地域 ベトナム
生年月日 1995年03月15日
性別 男
在留資格 技術・人文知識・国際業務
在留期間 2028年05月20日
AB12345678CD
住居地 愛知県名古屋市東区徳川2丁目`,
          confidence: 75,
        },
      }),
      terminate: vi.fn(),
    }
    vi.mocked(createWorker).mockResolvedValue(mockWorker as never)

    const { processOcr } = await import("../ocr-service")
    const result = await processOcr("data:image/jpeg;base64,/9j/test")

    expect(result.success).toBe(true)
    expect(result.provider).toBe("Tesseract.js")
    expect(result.documentType).toBe("zairyu_card")
    expect(result.fields.lastNameKanji).toBe("グエン")
    expect(result.fields.nationality).toBe("ベトナム")
    expect(result.fields.birthDate).toBe("1995-03-15")
    expect(result.fields.gender).toBe("MALE")
    expect(result.fields.visaStatus).toBe("ENGINEER_HUMANITIES")
    expect(result.fields.residenceCardNumber).toBe("AB12345678CD")
    expect(result.fields.prefecture).toBe("愛知県")
  })

  it("extracts data from 免許証 text", async () => {
    const { createWorker } = await import("tesseract.js")
    const mockWorker = {
      recognize: vi.fn().mockResolvedValue({
        data: {
          text: `運転免許証
氏名 田中 太郎
生年月日 平成2年05月10日
住所 東京都新宿区西新宿1-1-1
普通
012345678901`,
          confidence: 80,
        },
      }),
      terminate: vi.fn(),
    }
    vi.mocked(createWorker).mockResolvedValue(mockWorker as never)

    const { processOcr } = await import("../ocr-service")
    const result = await processOcr("data:image/jpeg;base64,/9j/test")

    expect(result.success).toBe(true)
    expect(result.documentType).toBe("driver_license")
    expect(result.fields.lastNameKanji).toBe("田中")
    expect(result.fields.firstNameKanji).toBe("太郎")
    expect(result.fields.prefecture).toBe("東京都")
    expect(result.fields.driverLicenseType).toBe("普通自動車免許")
  })

  it("returns error when no text is extracted", async () => {
    const { createWorker } = await import("tesseract.js")
    const mockWorker = {
      recognize: vi.fn().mockResolvedValue({
        data: { text: "", confidence: 0 },
      }),
      terminate: vi.fn(),
    }
    vi.mocked(createWorker).mockResolvedValue(mockWorker as never)

    const { processOcr } = await import("../ocr-service")
    const result = await processOcr("data:image/jpeg;base64,/9j/test")

    expect(result.success).toBe(false)
    expect(result.error).toContain("テキストを抽出できませんでした")
  })

  it("handles processing errors gracefully", async () => {
    const { createWorker } = await import("tesseract.js")
    vi.mocked(createWorker).mockRejectedValue(new Error("Worker failed"))

    const { processOcr } = await import("../ocr-service")
    const result = await processOcr("data:image/jpeg;base64,/9j/test")

    expect(result.success).toBe(false)
    expect(result.error).toContain("OCR処理中にエラーが発生しました")
  })
})
