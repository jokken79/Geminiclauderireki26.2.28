import type { UserRole } from "@prisma/client"

// Role hierarchy — higher index = more permissions
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 8,
  ADMIN: 7,
  KEITOSAN: 6,
  TANTOSHA: 5,
  COORDINATOR: 4,
  KANRININSHA: 3,
  EMPLOYEE: 2,
  CONTRACT_WORKER: 1,
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "スーパー管理者",
  ADMIN: "管理者",
  KEITOSAN: "経理担当",
  TANTOSHA: "担当者",
  COORDINATOR: "コーディネーター",
  KANRININSHA: "管理人者",
  EMPLOYEE: "派遣元社員",
  CONTRACT_WORKER: "請負社員",
}

// Sidebar navigation items
export const NAV_ITEMS = [
  { href: "/dashboard", label: "ダッシュボード", icon: "LayoutDashboard", minRole: 1 },
  { href: "/candidates", label: "候補者", icon: "Users", minRole: 4 },
  { href: "/hakenshain", label: "派遣社員", icon: "UserCheck", minRole: 3 },
  { href: "/ukeoi", label: "請負", icon: "Briefcase", minRole: 3 },
  { href: "/companies", label: "企業", icon: "Building2", minRole: 4 },
  { href: "/documents", label: "書類", icon: "FileText", minRole: 3 },
  { href: "/ocr", label: "OCRスキャン", icon: "ScanLine", minRole: 5 },
  { href: "/import-export", label: "インポート/エクスポート", icon: "ArrowUpDown", minRole: 5 },
  { href: "/reports", label: "レポート", icon: "BarChart3", minRole: 5 },
  { href: "/settings", label: "設定", icon: "Settings", minRole: 7 },
] as const

// Japanese prefectures (47)
export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
] as const

// Candidate status labels
export const CANDIDATE_STATUS_LABELS = {
  PENDING: "審査中",
  APPROVED: "承認済み",
  REJECTED: "不合格",
  HIRED: "採用済み",
  WITHDRAWN: "辞退",
} as const

// Assignment status labels
export const ASSIGNMENT_STATUS_LABELS = {
  ACTIVE: "稼働中",
  EXPIRED: "期間満了",
  TERMINATED: "契約終了",
  ON_LEAVE: "休職中",
} as const

// Document type labels
export const DOCUMENT_TYPE_LABELS = {
  RESIDENCE_CARD: "在留カード",
  PASSPORT: "パスポート",
  DRIVER_LICENSE: "運転免許証",
  FORKLIFT_LICENSE: "フォークリフト免許",
  CRANE_LICENSE: "クレーン免許",
  WELDING_CERT: "溶接資格証",
  HEALTH_CHECK: "健康診断書",
  CONTRACT: "契約書",
  OTHER: "その他",
} as const

// Blood types
export const BLOOD_TYPES = ["A", "B", "O", "AB"] as const

// JLPT level labels
export const JLPT_LABELS = {
  N1: "N1（ビジネスレベル）",
  N2: "N2（日常会話レベル）",
  N3: "N3（基本的な会話）",
  N4: "N4（初級）",
  N5: "N5（入門）",
  NONE: "なし",
} as const
