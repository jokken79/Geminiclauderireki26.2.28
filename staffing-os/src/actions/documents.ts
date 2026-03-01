"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { saveBase64File } from "@/lib/file-storage"
import type { DocumentType, Prisma } from "@prisma/client"

// ============================================================
// CREATE
// ============================================================

export async function createDocument(data: {
  candidateId: string
  type: DocumentType
  fileName: string
  fileData: string
  mimeType: string
  expiryDate?: string
  notes?: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  try {
    const fileUrl = await saveBase64File(data.fileData, "documents")

    const document = await prisma.$transaction(async (tx) => {
      // Verify candidate exists
      const candidate = await tx.candidate.findUnique({
        where: { id: data.candidateId },
        select: { id: true, lastNameKanji: true, firstNameKanji: true },
      })
      if (!candidate) throw new Error("候補者が見つかりません")

      const created = await tx.document.create({
        data: {
          candidateId: data.candidateId,
          type: data.type,
          fileName: data.fileName,
          fileData: fileUrl || data.fileData,
          mimeType: data.mimeType,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          notes: data.notes || null,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE",
          tableName: "Document",
          recordId: created.id,
          newValues: {
            candidateName: `${candidate.lastNameKanji} ${candidate.firstNameKanji}`,
            type: data.type,
            fileName: data.fileName,
          },
        },
      })

      return created
    })

    revalidatePath("/documents")
    revalidatePath(`/candidates/${data.candidateId}`)
    return { success: true, id: document.id }
  } catch (error) {
    console.error("Failed to create document:", error)
    const message = error instanceof Error ? error.message : "書類のアップロードに失敗しました"
    return { error: message }
  }
}

// ============================================================
// READ (List — all documents with filters)
// ============================================================

export type DocumentListItem = {
  id: string
  type: DocumentType
  fileName: string
  mimeType: string
  expiryDate: Date | null
  createdAt: Date
  candidate: {
    id: string
    lastNameKanji: string
    firstNameKanji: string
  }
}

export async function getDocuments(params: {
  search?: string
  type?: DocumentType
  expiringSoon?: boolean
  page?: number
  pageSize?: number
}): Promise<{ documents: DocumentListItem[]; total: number }> {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const { search, type, expiringSoon, page = 1, pageSize = 20 } = params
  const skip = (page - 1) * pageSize

  const where: Prisma.DocumentWhereInput = {}

  if (type) {
    where.type = type
  }

  if (expiringSoon) {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    where.expiryDate = {
      not: null,
      lte: thirtyDaysFromNow,
    }
  }

  if (search) {
    where.candidate = {
      OR: [
        { lastNameKanji: { contains: search, mode: "insensitive" } },
        { firstNameKanji: { contains: search, mode: "insensitive" } },
      ],
    }
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      select: {
        id: true,
        type: true,
        fileName: true,
        mimeType: true,
        expiryDate: true,
        createdAt: true,
        candidate: {
          select: {
            id: true,
            lastNameKanji: true,
            firstNameKanji: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.document.count({ where }),
  ])

  return { documents, total }
}

// ============================================================
// READ (Single — includes file data for download)
// ============================================================

export async function getDocument(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  return prisma.document.findUnique({
    where: { id },
    include: {
      candidate: {
        select: {
          lastNameKanji: true,
          firstNameKanji: true,
        },
      },
    },
  })
}

// ============================================================
// DELETE
// ============================================================

export async function deleteDocument(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  try {
    await prisma.$transaction(async (tx) => {
      const doc = await tx.document.findUnique({
        where: { id },
        select: { fileName: true, type: true, candidateId: true },
      })

      if (!doc) throw new Error("書類が見つかりません")

      await tx.document.delete({ where: { id } })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DELETE",
          tableName: "Document",
          recordId: id,
          oldValues: { fileName: doc.fileName, type: doc.type },
        },
      })
    })

    revalidatePath("/documents")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete document:", error)
    return { error: "書類の削除に失敗しました" }
  }
}

// ============================================================
// GET EXPIRING DOCUMENTS (for dashboard alerts)
// ============================================================

export async function getExpiringDocuments(daysAhead: number = 30) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysAhead)

  return prisma.document.findMany({
    where: {
      expiryDate: {
        not: null,
        lte: targetDate,
      },
    },
    select: {
      id: true,
      type: true,
      fileName: true,
      expiryDate: true,
      candidate: {
        select: {
          id: true,
          lastNameKanji: true,
          firstNameKanji: true,
        },
      },
    },
    orderBy: { expiryDate: "asc" },
    take: 50,
  })
}
