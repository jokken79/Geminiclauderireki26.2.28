"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { ukeoiSchema, type UkeoiFormData } from "@/lib/validators/ukeoi"
import type { AssignmentStatus, Prisma } from "@prisma/client"

// ============================================================
// CREATE
// ============================================================

export async function createUkeoi(data: UkeoiFormData) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const parsed = ukeoiSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "バリデーションエラー", details: parsed.error.flatten() }
  }

  const { candidateId, ...fields } = parsed.data

  try {
    const ukeoi = await prisma.$transaction(async (tx) => {
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

      const created = await tx.ukeoiAssignment.create({
        data: {
          candidateId,
          companyId: fields.companyId,
          hireDate: new Date(fields.hireDate),
          contractEndDate: fields.contractEndDate ? new Date(fields.contractEndDate) : null,
          monthlySalary: fields.monthlySalary,
          position: fields.position || null,
          projectName: fields.projectName || null,
          internalSupervisor: fields.internalSupervisor,
          bankName: fields.bankName || null,
          bankBranch: fields.bankBranch || null,
          bankAccountType: fields.bankAccountType || null,
          bankAccountNumber: fields.bankAccountNumber || null,
          emergencyName: fields.emergencyName || candidate.emergencyContactName || null,
          emergencyPhone: fields.emergencyPhone || candidate.emergencyContactPhone || null,
          emergencyRelation: fields.emergencyRelation || candidate.emergencyContactRelation || null,
          photoDataUrl: candidate.photoDataUrl || null,
          notes: fields.notes || null,
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
          tableName: "UkeoiAssignment",
          recordId: created.id,
          newValues: {
            candidateName: `${candidate.lastNameKanji} ${candidate.firstNameKanji}`,
            companyId: fields.companyId,
            monthlySalary: fields.monthlySalary,
            internalSupervisor: fields.internalSupervisor,
          },
        },
      })

      return created
    })

    revalidatePath("/ukeoi")
    revalidatePath("/candidates")
    return { success: true, id: ukeoi.id }
  } catch (error) {
    console.error("Failed to create ukeoi:", error)
    const message = error instanceof Error ? error.message : "請負社員の登録に失敗しました"
    return { error: message }
  }
}

// ============================================================
// READ (List)
// ============================================================

export type UkeoiListItem = {
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
  monthlySalary: number
  position: string | null
  internalSupervisor: string
  photoDataUrl: string | null
}

export async function getUkeoiList(params: {
  search?: string
  status?: AssignmentStatus
  page?: number
  pageSize?: number
}): Promise<{ ukeoi: UkeoiListItem[]; total: number }> {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const { search, status, page = 1, pageSize = 20 } = params
  const skip = (page - 1) * pageSize

  const where: Prisma.UkeoiAssignmentWhereInput = {}

  if (status) {
    where.status = status
  }

  if (search) {
    where.candidate = {
      OR: [
        { lastNameKanji: { contains: search, mode: "insensitive" } },
        { firstNameKanji: { contains: search, mode: "insensitive" } },
        { lastNameFurigana: { contains: search, mode: "insensitive" } },
        { firstNameFurigana: { contains: search, mode: "insensitive" } },
      ],
    }
  }

  const [ukeoi, total] = await Promise.all([
    prisma.ukeoiAssignment.findMany({
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
        company: { select: { id: true, name: true } },
        status: true,
        hireDate: true,
        contractEndDate: true,
        monthlySalary: true,
        position: true,
        internalSupervisor: true,
        photoDataUrl: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.ukeoiAssignment.count({ where }),
  ])

  return { ukeoi, total }
}

// ============================================================
// READ (Single)
// ============================================================

export async function getUkeoi(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const ukeoi = await prisma.ukeoiAssignment.findUnique({
    where: { id },
    include: {
      candidate: {
        include: {
          workHistory: { orderBy: { sortOrder: "asc" } },
          qualifications: { orderBy: { sortOrder: "asc" } },
        },
      },
      company: true,
    },
  })

  if (!ukeoi) return null
  return ukeoi
}

// ============================================================
// UPDATE STATUS
// ============================================================

export async function updateUkeoiStatus(id: string, status: AssignmentStatus) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  try {
    await prisma.$transaction(async (tx) => {
      const old = await tx.ukeoiAssignment.findUnique({
        where: { id },
        select: { status: true },
      })

      await tx.ukeoiAssignment.update({
        where: { id },
        data: { status, version: { increment: 1 } },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "STATUS_CHANGE",
          tableName: "UkeoiAssignment",
          recordId: id,
          oldValues: { status: old?.status },
          newValues: { status },
        },
      })
    })

    revalidatePath("/ukeoi")
    revalidatePath(`/ukeoi/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update ukeoi status:", error)
    return { error: "ステータスの更新に失敗しました" }
  }
}
