import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('processOcr', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    // Clear all provider env vars
    delete process.env.AZURE_VISION_ENDPOINT
    delete process.env.AZURE_VISION_KEY
    delete process.env.GOOGLE_GEMINI_API_KEY
    delete process.env.OPENAI_API_KEY
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('returns error when no providers are configured', async () => {
    const { processOcr } = await import('../ocr-service')
    const result = await processOcr('data:image/jpeg;base64,/9j/test')
    expect(result.success).toBe(false)
    expect(result.provider).toBe('none')
    expect(result.error).toContain('OCRプロバイダーが設定されていません')
  })

  it('tries Gemini when configured and succeeds', async () => {
    process.env.GOOGLE_GEMINI_API_KEY = 'test-key'

    const mockResponse = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              lastNameKanji: '田中',
              firstNameKanji: '太郎',
              birthDate: '1990-01-15',
            }),
          }],
        },
      }],
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))

    const { processOcr } = await import('../ocr-service')
    const result = await processOcr('data:image/jpeg;base64,/9j/test')

    expect(result.success).toBe(true)
    expect(result.provider).toBe('Google Gemini')
    expect(result.fields.lastNameKanji).toBe('田中')
    expect(result.confidence).toBe(0.9)
  })

  it('falls through to next provider when first fails', async () => {
    process.env.GOOGLE_GEMINI_API_KEY = 'test-key'
    process.env.OPENAI_API_KEY = 'test-openai-key'

    const openAIResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            lastNameKanji: '鈴木',
            firstNameKanji: '花子',
          }),
        },
      }],
    }

    vi.stubGlobal('fetch', vi.fn()
      // Gemini fails
      .mockResolvedValueOnce({ ok: false, status: 500 })
      // OpenAI succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(openAIResponse),
      }))

    const { processOcr } = await import('../ocr-service')
    const result = await processOcr('data:image/jpeg;base64,/9j/test')

    expect(result.success).toBe(true)
    expect(result.provider).toBe('OpenAI GPT-4o')
    expect(result.fields.lastNameKanji).toBe('鈴木')
  })

  it('returns all-failed error when all providers fail', async () => {
    process.env.GOOGLE_GEMINI_API_KEY = 'test-key'

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    const { processOcr } = await import('../ocr-service')
    const result = await processOcr('data:image/jpeg;base64,/9j/test')

    expect(result.success).toBe(false)
    expect(result.provider).toBe('all-failed')
    expect(result.error).toContain('全てのOCRプロバイダーが失敗しました')
  })
})
