import { z } from "zod"

// Postal code validation (XXX-XXXX format)
export const postalCodeSchema = z
  .string()
  .regex(/^\d{3}-?\d{4}$/, "郵便番号の形式が正しくありません（例: 123-4567）")
  .transform((val) => {
    // Normalize to XXX-XXXX format
    const digits = val.replace("-", "")
    return `${digits.slice(0, 3)}-${digits.slice(3)}`
  })
  .optional()
  .or(z.literal(""))

// Japanese phone number
export const phoneSchema = z
  .string()
  .regex(/^[\d\-+()]{8,15}$/, "電話番号の形式が正しくありません")
  .optional()
  .or(z.literal(""))

// Email
export const emailSchema = z
  .string()
  .email("メールアドレスの形式が正しくありません")
  .optional()
  .or(z.literal(""))

// Date string (YYYY-MM-DD)
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません")

// Optional date string
export const optionalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません")
  .optional()
  .or(z.literal(""))

// Positive integer
export const positiveIntSchema = z.coerce
  .number()
  .int()
  .positive("正の整数を入力してください")

// Optional positive number (for height, weight, etc.)
export const optionalPositiveNumberSchema = z.coerce
  .number()
  .positive("正の数値を入力してください")
  .optional()
  .or(z.literal("").transform(() => undefined))
