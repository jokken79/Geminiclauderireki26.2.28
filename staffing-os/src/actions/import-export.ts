"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { generateSkillSheet, type SkillSheetData } from "@/services/skill-sheet-service"

// ============================================================
// EXPORT CANDIDATES CSV
// ============================================================

export async function exportCandidatesCsv() {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const candidates = await prisma.candidate.findMany({
    select: {
      lastNameKanji: true,
      firstNameKanji: true,
      lastNameFurigana: true,
      firstNameFurigana: true,
      birthDate: true,
      nationality: true,
      gender: true,
      status: true,
      phone: true,
      email: true,
      postalCode: true,
      prefecture: true,
      city: true,
      addressLine1: true,
      visaStatus: true,
      visaExpiry: true,
      jlptLevel: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  // Build CSV with BOM for Excel compatibility
  const BOM = "\uFEFF"
  const headers = [
    "姓（漢字）", "名（漢字）", "姓（ふりがな）", "名（ふりがな）",
    "生年月日", "国籍", "性別", "ステータス",
    "電話番号", "メール", "郵便番号", "都道府県", "市区町村", "住所",
    "在留資格", "ビザ期限", "JLPT", "登録日",
  ]

  const rows = candidates.map((c) => [
    c.lastNameKanji,
    c.firstNameKanji,
    c.lastNameFurigana,
    c.firstNameFurigana,
    c.birthDate.toISOString().split("T")[0],
    c.nationality,
    c.gender || "",
    c.status,
    c.phone || "",
    c.email || "",
    c.postalCode || "",
    c.prefecture || "",
    c.city || "",
    c.addressLine1 || "",
    c.visaStatus || "",
    c.visaExpiry?.toISOString().split("T")[0] || "",
    c.jlptLevel,
    c.createdAt.toISOString().split("T")[0],
  ])

  const csvContent = BOM + [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n")

  return csvContent
}

// ============================================================
// EXPORT HAKENSHAIN CSV
// ============================================================

export async function exportHakenshainCsv() {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const hakenshain = await prisma.hakenshainAssignment.findMany({
    include: {
      candidate: {
        select: {
          lastNameKanji: true,
          firstNameKanji: true,
          nationality: true,
        },
      },
      company: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const BOM = "\uFEFF"
  const headers = [
    "姓", "名", "国籍", "派遣先", "入社日", "契約終了日",
    "時給", "職種", "ステータス", "抵触日",
  ]

  const rows = hakenshain.map((h) => [
    h.candidate.lastNameKanji,
    h.candidate.firstNameKanji,
    h.candidate.nationality,
    h.company.name,
    h.hireDate.toISOString().split("T")[0],
    h.contractEndDate?.toISOString().split("T")[0] || "",
    h.jikyu,
    h.position || "",
    h.status,
    h.teishokubiDate?.toISOString().split("T")[0] || "",
  ])

  const csvContent = BOM + [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n")

  return csvContent
}

// ============================================================
// GENERATE SKILL SHEET
// ============================================================

export async function generateCandidateSkillSheet(candidateId: string): Promise<SkillSheetData | null> {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      qualifications: { orderBy: { sortOrder: "asc" } },
      workHistory: { orderBy: { sortOrder: "asc" } },
    },
  })

  if (!candidate) return null

  return generateSkillSheet({
    lastNameRomaji: candidate.lastNameRomaji,
    firstNameRomaji: candidate.firstNameRomaji,
    lastNameKanji: candidate.lastNameKanji,
    firstNameKanji: candidate.firstNameKanji,
    birthDate: candidate.birthDate,
    prefecture: candidate.prefecture,
    gender: candidate.gender,
    nationality: candidate.nationality,
    jlptLevel: candidate.jlptLevel,
    expWelding: candidate.expWelding,
    expForklift: candidate.expForklift,
    expLineWork: candidate.expLineWork,
    expAssembly: candidate.expAssembly,
    expPacking: candidate.expPacking,
    expInspection: candidate.expInspection,
    expPainting: candidate.expPainting,
    expMachining: candidate.expMachining,
    expCleaning: candidate.expCleaning,
    expCooking: candidate.expCooking,
    height: candidate.height,
    weight: candidate.weight,
    dominantHand: candidate.dominantHand,
    bloodType: candidate.bloodType,
    visionLeft: candidate.visionLeft,
    visionRight: candidate.visionRight,
    qualifications: candidate.qualifications.map((q) => ({
      name: q.name,
      year: q.year,
      month: q.month,
    })),
    workHistory: candidate.workHistory.map((wh) => ({
      startYear: wh.startYear,
      startMonth: wh.startMonth,
      endYear: wh.endYear,
      endMonth: wh.endMonth,
      companyName: wh.companyName,
      position: wh.position,
      jobContent: wh.jobContent,
    })),
  })
}
