"use server"

import { revalidatePath } from "next/cache"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/rbac"
import type { UserRole } from "@prisma/client"

// ============================================================
// LIST USERS
// ============================================================

export async function getUsers() {
  const session = await requireRole("ADMIN")

  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

// ============================================================
// CREATE USER
// ============================================================

export async function createUser(data: {
  email: string
  name: string
  password: string
  role: UserRole
}) {
  const session = await requireRole("ADMIN")

  if (!data.email || !data.name || !data.password) {
    return { error: "全ての必須項目を入力してください" }
  }

  try {
    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (existing) {
      return { error: "このメールアドレスは既に使用されています" }
    }

    const hashedPassword = await hash(data.password, 12)

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          hashedPassword,
          role: data.role,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE",
          tableName: "User",
          recordId: created.id,
          newValues: { email: data.email, name: data.name, role: data.role },
        },
      })

      return created
    })

    revalidatePath("/settings/users")
    return { success: true, id: user.id }
  } catch (error) {
    console.error("Failed to create user:", error)
    return { error: "ユーザーの作成に失敗しました" }
  }
}

// ============================================================
// UPDATE USER ROLE
// ============================================================

export async function updateUserRole(userId: string, role: UserRole) {
  const session = await requireRole("ADMIN")

  // Cannot change own role
  if (userId === session.user.id) {
    return { error: "自分自身のロールは変更できません" }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const old = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true, name: true },
      })

      await tx.user.update({
        where: { id: userId },
        data: { role },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          tableName: "User",
          recordId: userId,
          oldValues: { role: old?.role, name: old?.name },
          newValues: { role },
        },
      })
    })

    revalidatePath("/settings/users")
    return { success: true }
  } catch (error) {
    console.error("Failed to update user role:", error)
    return { error: "ロールの更新に失敗しました" }
  }
}

// ============================================================
// TOGGLE USER ACTIVE STATUS
// ============================================================

export async function toggleUserActive(userId: string) {
  const session = await requireRole("ADMIN")

  if (userId === session.user.id) {
    return { error: "自分自身を無効化できません" }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { isActive: true, name: true },
      })

      if (!user) throw new Error("ユーザーが見つかりません")

      await tx.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          tableName: "User",
          recordId: userId,
          oldValues: { isActive: user.isActive },
          newValues: { isActive: !user.isActive, name: user.name },
        },
      })
    })

    revalidatePath("/settings/users")
    return { success: true }
  } catch (error) {
    console.error("Failed to toggle user status:", error)
    return { error: "ステータスの変更に失敗しました" }
  }
}

// ============================================================
// GET AUDIT LOG
// ============================================================

export async function getAuditLog(params: {
  page?: number
  pageSize?: number
  tableName?: string
}) {
  await requireRole("ADMIN")

  const { page = 1, pageSize = 50, tableName } = params
  const skip = (page - 1) * pageSize

  const where = tableName ? { tableName } : {}

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        tableName: true,
        recordId: true,
        oldValues: true,
        newValues: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, total }
}
