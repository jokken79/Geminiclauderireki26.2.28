"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { nyushaSchema, type NyushaFormData } from "@/lib/validators/hakenshain"
import { calculateTeishokubi } from "@/lib/teishokubi"
import type { AssignmentStatus, Prisma } from "@prisma/client"

// ============================================================
// CREATE (入社連絡票 — Candidate → Haken conversion)
// ============================================================

export async function createHakenshain(data: NyushaFormData) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const parsed = nyushaSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "バリデーションエラー", details: parsed.error.flatten() }
  }

  const { candidateId, ...employmentFields } = parsed.data

  try {
    const hakenshain = await prisma.$transaction(async (tx) => {
      // Verify candidate exists and is APPROVED
      const candidate = await tx.candidate.findUnique({
        where: { id: candidateId },
        select: {
          id: true,
          status: true,
          lastNameKanji: true,
          firstNameKanji: true,
          photoDataUrl: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          emergencyContactRelation: true,
        },
      })

      if (!candidate) {
        throw new Error("候補者が見つかりません")
      }

      if (candidate.status !== "APPROVED") {
        throw new Error("候補者のステータスが「承認済み」ではありません")
      }

      // Calculate 抵触日
      const hireDate = new Date(employmentFields.hireDate)
      const teishokubiDate = calculateTeishokubi(hireDate)

      // Create Haken assignment with copied data
      const created = await tx.hakenshainAssignment.create({
        data: {
          candidateId,
          companyId: employmentFields.companyId,
          hireDate,
          contractEndDate: employmentFields.contractEndDate
            ? new Date(employmentFields.contractEndDate)
            : null,
          jikyu: employmentFields.jikyu,
          position: employmentFields.position || null,
          productionLine: employmentFields.productionLine || null,
          shift: employmentFields.shift || null,
          teishokubiDate,
          dispatchSupervisor: employmentFields.dispatchSupervisor || null,
          clientSupervisor: employmentFields.clientSupervisor || null,
          // Bank account
          bankName: employmentFields.bankName || null,
          bankBranch: employmentFields.bankBranch || null,
          bankAccountType: employmentFields.bankAccountType || null,
          bankAccountNumber: employmentFields.bankAccountNumber || null,
          // Emergency contact — use form data or copy from candidate
          emergencyName: employmentFields.emergencyName || candidate.emergencyContactName || null,
          emergencyPhone: employmentFields.emergencyPhone || candidate.emergencyContactPhone || null,
          emergencyRelation: employmentFields.emergencyRelation || candidate.emergencyContactRelation || null,
          // Copy photo from candidate
          photoDataUrl: candidate.photoDataUrl || null,
          notes: employmentFields.notes || null,
        },
      })

      // Update candidate status to HIRED
      await tx.candidate.update({
        where: { id: candidateId },
        data: { status: "HIRED", version: { increment: 1 } },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE",
          tableName: "HakenshainAssignment",
          recordId: created.id,
          newValues: {
            candidateName: `${candidate.lastNameKanji} ${candidate.firstNameKanji}`,
            companyId: employmentFields.companyId,
            hireDate: employmentFields.hireDate,
            jikyu: employmentFields.jikyu,
          },
        },
      })

      return created
    })

    revalidatePath("/hakenshain")
    revalidatePath("/candidates")
    return { success: true, id: hakenshain.id }
  } catch (error) {
    console.error("Failed to create hakenshain:", error)
    const message = error instanceof Error ? error.message : "派遣社員の登録に失敗しました"
    return { error: message }
  }
}

// ============================================================
// READ (List)
// ============================================================

export type HakenshainListItem = {
  id: string
  candidate: {
    id: string
    lastNameKanji: string
    firstNameKanji: string
    lastNameFurigana: string
    firstNameFurigana: string
    nationality: string
  }
  company: {
    id: string
    name: string
  }
  status: AssignmentStatus
  hireDate: Date
  contractEndDate: Date | null
  jikyu: number
  position: string | null
  teishokubiDate: Date | null
  photoDataUrl: string | null
}

export async function getHakenshainList(params: {
  search?: string
  status?: AssignmentStatus
  companyId?: string
  page?: number
  pageSize?: number
}): Promise<{ hakenshain: HakenshainListItem[]; total: number }> {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const { search, status, companyId, page = 1, pageSize = 20 } = params
  const skip = (page - 1) * pageSize

  const where: Prisma.HakenshainAssignmentWhereInput = {}

  if (status) {
    where.status = status
  }

  if (companyId) {
    where.companyId = companyId
  }

  if (search) {
    where.candidate = {
      OR: [
        { lastNameKanji: { contains: search, mode: "insensitive" } },
        { firstNameKanji: { contains: search, mode: "insensitive" } },
        { lastNameFurigana: { contains: search, mode: "insensitive" } },
        { firstNameFurigana: { contains: search, mode: "insensitive" } },
        { lastNameRomaji: { contains: search, mode: "insensitive" } },
        { firstNameRomaji: { contains: search, mode: "insensitive" } },
      ],
    }
  }

  const [hakenshain, total] = await Promise.all([
    prisma.hakenshainAssignment.findMany({
      where,
      select: {
        id: true,
        candidate: {
          select: {
            id: true,
            lastNameKanji: true,
            firstNameKanji: true,
            lastNameFurigana: true,
            firstNameFurigana: true,
            nationality: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        status: true,
        hireDate: true,
        contractEndDate: true,
        jikyu: true,
        position: true,
        teishokubiDate: true,
        photoDataUrl: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.hakenshainAssignment.count({ where }),
  ])

  return { hakenshain, total }
}

// ============================================================
// READ (Single)
// ============================================================

export async function getHakenshain(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const hakenshain = await prisma.hakenshainAssignment.findUnique({
    where: { id },
    include: {
      candidate: {
        include: {
          workHistory: { orderBy: { sortOrder: "asc" } },
          qualifications: { orderBy: { sortOrder: "asc" } },
          familyMembers: { orderBy: { sortOrder: "asc" } },
          educationHistory: { orderBy: { sortOrder: "asc" } },
        },
      },
      company: true,
    },
  })

  if (!hakenshain) return null
  return hakenshain
}

// ============================================================
// UPDATE STATUS
// ============================================================

export async function updateHakenshainStatus(id: string, status: AssignmentStatus) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  try {
    await prisma.$transaction(async (tx) => {
      const old = await tx.hakenshainAssignment.findUnique({
        where: { id },
        select: { status: true },
      })

      await tx.hakenshainAssignment.update({
        where: { id },
        data: { status, version: { increment: 1 } },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "STATUS_CHANGE",
          tableName: "HakenshainAssignment",
          recordId: id,
          oldValues: { status: old?.status },
          newValues: { status },
        },
      })
    })

    revalidatePath("/hakenshain")
    revalidatePath(`/hakenshain/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update hakenshain status:", error)
    return { error: "ステータスの更新に失敗しました" }
  }
}

// ============================================================
// GET APPROVED CANDIDATES (for Nyusha wizard)
// ============================================================

export async function getApprovedCandidates() {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  return prisma.candidate.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true,
      lastNameKanji: true,
      firstNameKanji: true,
      lastNameFurigana: true,
      firstNameFurigana: true,
      nationality: true,
      birthDate: true,
      phone: true,
      photoDataUrl: true,
      visaStatus: true,
      visaExpiry: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

// ============================================================
// GET COMPANIES (for Nyusha wizard)
// ============================================================

export async function getActiveCompanies() {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  return prisma.clientCompany.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      industry: true,
      prefecture: true,
    },
    orderBy: { name: "asc" },
  })
}
