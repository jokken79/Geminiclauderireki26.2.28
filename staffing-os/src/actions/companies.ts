"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { companySchema, type CompanyFormData } from "@/lib/validators/company"

// ============================================================
// CREATE
// ============================================================

export async function createCompany(data: CompanyFormData) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const parsed = companySchema.safeParse(data)
  if (!parsed.success) {
    return { error: "バリデーションエラー", details: parsed.error.flatten() }
  }

  try {
    const company = await prisma.$transaction(async (tx) => {
      const created = await tx.clientCompany.create({
        data: {
          name: parsed.data.name,
          nameKana: parsed.data.nameKana || null,
          industry: parsed.data.industry || null,
          postalCode: parsed.data.postalCode || null,
          prefecture: parsed.data.prefecture || null,
          city: parsed.data.city || null,
          address: parsed.data.address || null,
          phone: parsed.data.phone || null,
          fax: parsed.data.fax || null,
          contactName: parsed.data.contactName || null,
          contactEmail: parsed.data.contactEmail || null,
          notes: parsed.data.notes || null,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE",
          tableName: "ClientCompany",
          recordId: created.id,
          newValues: { name: created.name },
        },
      })

      return created
    })

    revalidatePath("/companies")
    return { success: true, id: company.id }
  } catch (error) {
    console.error("Failed to create company:", error)
    return { error: "企業の作成に失敗しました" }
  }
}

// ============================================================
// READ (List)
// ============================================================

export async function getCompanies(params: {
  search?: string
  page?: number
  pageSize?: number
}) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const { search, page = 1, pageSize = 20 } = params
  const skip = (page - 1) * pageSize

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { nameKana: { contains: search, mode: "insensitive" as const } },
          { industry: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}

  const [companies, total] = await Promise.all([
    prisma.clientCompany.findMany({
      where,
      select: {
        id: true,
        name: true,
        nameKana: true,
        industry: true,
        prefecture: true,
        phone: true,
        contactName: true,
        isActive: true,
        _count: {
          select: {
            hakenshain: { where: { status: "ACTIVE" } },
            ukeoi: { where: { status: "ACTIVE" } },
          },
        },
      },
      orderBy: { name: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.clientCompany.count({ where }),
  ])

  return { companies, total }
}

// ============================================================
// READ (Single)
// ============================================================

export async function getCompany(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  return prisma.clientCompany.findUnique({
    where: { id },
    include: {
      hakenshain: {
        include: {
          candidate: {
            select: {
              lastNameKanji: true,
              firstNameKanji: true,
              nationality: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      ukeoi: {
        include: {
          candidate: {
            select: {
              lastNameKanji: true,
              firstNameKanji: true,
              nationality: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })
}

// ============================================================
// UPDATE
// ============================================================

export async function updateCompany(id: string, data: CompanyFormData) {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const parsed = companySchema.safeParse(data)
  if (!parsed.success) {
    return { error: "バリデーションエラー", details: parsed.error.flatten() }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const old = await tx.clientCompany.findUnique({
        where: { id },
        select: { name: true },
      })

      await tx.clientCompany.update({
        where: { id },
        data: {
          name: parsed.data.name,
          nameKana: parsed.data.nameKana || null,
          industry: parsed.data.industry || null,
          postalCode: parsed.data.postalCode || null,
          prefecture: parsed.data.prefecture || null,
          city: parsed.data.city || null,
          address: parsed.data.address || null,
          phone: parsed.data.phone || null,
          fax: parsed.data.fax || null,
          contactName: parsed.data.contactName || null,
          contactEmail: parsed.data.contactEmail || null,
          notes: parsed.data.notes || null,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          tableName: "ClientCompany",
          recordId: id,
          oldValues: old ?? undefined,
          newValues: { name: parsed.data.name },
        },
      })
    })

    revalidatePath("/companies")
    revalidatePath(`/companies/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update company:", error)
    return { error: "企業の更新に失敗しました" }
  }
}
