"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { candidateSchema, type CandidateFormData } from "@/lib/validators/candidate"
import { saveBase64File } from "@/lib/file-storage"
import type { CandidateStatus, Prisma } from "@prisma/client"

// ============================================================
// CREATE
// ============================================================

export async function createCandidate(data: CandidateFormData) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const parsed = candidateSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "バリデーションエラー", details: parsed.error.flatten() }
  }

  const {
    workHistory,
    qualifications,
    familyMembers,
    education,
    birthDate,
    passportExpiry,
    residenceCardExpiry,
    visaExpiry,
    visaStatus,
    gender,
    photoDataUrl,
    ...candidateFields
  } = parsed.data as CandidateFormData & { education?: { year: number; month: number; schoolName: string; faculty?: string; eventType: string }[] }

  try {
    const photoUrl = await saveBase64File(photoDataUrl, "candidates")

    const candidate = await prisma.$transaction(async (tx) => {
      const created = await tx.candidate.create({
        data: {
          ...candidateFields,
          photoDataUrl: photoUrl,
          birthDate: new Date(birthDate),
          passportExpiry: passportExpiry ? new Date(passportExpiry) : null,
          residenceCardExpiry: residenceCardExpiry ? new Date(residenceCardExpiry) : null,
          visaExpiry: visaExpiry ? new Date(visaExpiry) : null,
          visaStatus: visaStatus || null,
          gender: gender || null,
          // Create related records
          workHistory: workHistory?.length
            ? { create: workHistory.map((wh, i) => ({ ...wh, sortOrder: i })) }
            : undefined,
          qualifications: qualifications?.length
            ? { create: qualifications.map((q, i) => ({ ...q, sortOrder: i })) }
            : undefined,
          familyMembers: familyMembers?.length
            ? { create: familyMembers.map((fm, i) => ({ ...fm, sortOrder: i })) }
            : undefined,
          education: education?.length
            ? { create: education.map((ed, i) => ({ ...ed, sortOrder: i })) }
            : undefined,
        },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE",
          tableName: "Candidate",
          recordId: created.id,
          newValues: { name: `${candidateFields.lastNameKanji} ${candidateFields.firstNameKanji}` },
        },
      })

      return created
    })

    revalidatePath("/candidates")
    return { success: true, id: candidate.id }
  } catch (error) {
    console.error("Failed to create candidate:", error)
    return { error: "候補者の作成に失敗しました" }
  }
}

// ============================================================
// READ (List)
// ============================================================

export type CandidateListItem = {
  id: string
  lastNameKanji: string
  firstNameKanji: string
  lastNameFurigana: string
  firstNameFurigana: string
  nationality: string
  status: CandidateStatus
  phone: string | null
  visaExpiry: Date | null
  createdAt: Date
  photoDataUrl: string | null
}

export async function getCandidates(params: {
  search?: string
  status?: CandidateStatus
  page?: number
  pageSize?: number
}): Promise<{ candidates: CandidateListItem[]; total: number }> {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const { search, status, page = 1, pageSize = 20 } = params
  const skip = (page - 1) * pageSize

  const where: Prisma.CandidateWhereInput = {}

  if (status) {
    where.status = status
  }

  if (search) {
    where.OR = [
      { lastNameKanji: { contains: search, mode: "insensitive" } },
      { firstNameKanji: { contains: search, mode: "insensitive" } },
      { lastNameFurigana: { contains: search, mode: "insensitive" } },
      { firstNameFurigana: { contains: search, mode: "insensitive" } },
      { lastNameRomaji: { contains: search, mode: "insensitive" } },
      { firstNameRomaji: { contains: search, mode: "insensitive" } },
      { nationality: { contains: search, mode: "insensitive" } },
    ]
  }

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      select: {
        id: true,
        lastNameKanji: true,
        firstNameKanji: true,
        lastNameFurigana: true,
        firstNameFurigana: true,
        nationality: true,
        status: true,
        phone: true,
        visaExpiry: true,
        createdAt: true,
        photoDataUrl: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.candidate.count({ where }),
  ])

  return { candidates, total }
}

// ============================================================
// READ (Single)
// ============================================================

export async function getCandidate(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      education: { orderBy: { sortOrder: "asc" } },
      workHistory: { orderBy: { sortOrder: "asc" } },
      qualifications: { orderBy: { sortOrder: "asc" } },
      familyMembers: { orderBy: { sortOrder: "asc" } },
      documents: { orderBy: { createdAt: "desc" } },
      hakenshain: { include: { company: true } },
      ukeoi: { include: { company: true } },
    },
  })

  if (!candidate) return null
  return candidate
}

// ============================================================
// UPDATE
// ============================================================

export async function updateCandidate(id: string, data: CandidateFormData) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const parsed = candidateSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "バリデーションエラー", details: parsed.error.flatten() }
  }

  const {
    workHistory,
    qualifications,
    familyMembers,
    education,
    birthDate,
    passportExpiry,
    residenceCardExpiry,
    visaExpiry,
    visaStatus,
    gender,
    photoDataUrl,
    ...candidateFields
  } = parsed.data as CandidateFormData & { education?: { year: number; month: number; schoolName: string; faculty?: string; eventType: string }[] }

  try {
    const photoUrl = await saveBase64File(photoDataUrl, "candidates")

    await prisma.$transaction(async (tx) => {
      // Get old values for audit
      const old = await tx.candidate.findUnique({ where: { id }, select: { lastNameKanji: true, firstNameKanji: true, status: true, photoDataUrl: true } })

      // Maintain old photo if the new photo base64 is null/empty and an old one exists
      const finalPhotoUrl = photoUrl || old?.photoDataUrl

      // Delete existing related records to replace them
      await tx.workHistory.deleteMany({ where: { candidateId: id } })
      await tx.qualification.deleteMany({ where: { candidateId: id } })
      await tx.familyMember.deleteMany({ where: { candidateId: id } })
      await tx.educationHistory.deleteMany({ where: { candidateId: id } })

      // Update candidate and recreate related records
      await tx.candidate.update({
        where: { id },
        data: {
          ...candidateFields,
          photoDataUrl: finalPhotoUrl,
          birthDate: new Date(birthDate),
          passportExpiry: passportExpiry ? new Date(passportExpiry) : null,
          residenceCardExpiry: residenceCardExpiry ? new Date(residenceCardExpiry) : null,
          visaExpiry: visaExpiry ? new Date(visaExpiry) : null,
          visaStatus: visaStatus || null,
          gender: gender || null,
          version: { increment: 1 },
          workHistory: workHistory?.length
            ? { create: workHistory.map((wh, i) => ({ ...wh, sortOrder: i })) }
            : undefined,
          qualifications: qualifications?.length
            ? { create: qualifications.map((q, i) => ({ ...q, sortOrder: i })) }
            : undefined,
          familyMembers: familyMembers?.length
            ? { create: familyMembers.map((fm, i) => ({ ...fm, sortOrder: i })) }
            : undefined,
          education: education?.length
            ? { create: education.map((ed, i) => ({ ...ed, sortOrder: i })) }
            : undefined,
        },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          tableName: "Candidate",
          recordId: id,
          oldValues: old ?? undefined,
          newValues: { name: `${candidateFields.lastNameKanji} ${candidateFields.firstNameKanji}` },
        },
      })
    })

    revalidatePath("/candidates")
    revalidatePath(`/candidates/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update candidate:", error)
    return { error: "候補者の更新に失敗しました" }
  }
}

// ============================================================
// UPDATE STATUS
// ============================================================

export async function updateCandidateStatus(id: string, status: CandidateStatus) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  try {
    await prisma.$transaction(async (tx) => {
      const old = await tx.candidate.findUnique({ where: { id }, select: { status: true } })

      await tx.candidate.update({
        where: { id },
        data: { status, version: { increment: 1 } },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "STATUS_CHANGE",
          tableName: "Candidate",
          recordId: id,
          oldValues: { status: old?.status },
          newValues: { status },
        },
      })
    })

    revalidatePath("/candidates")
    revalidatePath(`/candidates/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update status:", error)
    return { error: "ステータスの更新に失敗しました" }
  }
}

// ============================================================
// DELETE
// ============================================================

export async function deleteCandidate(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  try {
    await prisma.$transaction(async (tx) => {
      const old = await tx.candidate.findUnique({
        where: { id },
        select: { lastNameKanji: true, firstNameKanji: true },
      })

      await tx.candidate.delete({ where: { id } })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DELETE",
          tableName: "Candidate",
          recordId: id,
          oldValues: old ?? undefined,
        },
      })
    })

    revalidatePath("/candidates")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete candidate:", error)
    return { error: "候補者の削除に失敗しました" }
  }
}
