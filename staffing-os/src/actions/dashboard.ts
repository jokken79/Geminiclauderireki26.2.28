"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function getDashboardStats() {
  const session = await auth()
  if (!session?.user) throw new Error("認証が必要です")

  const now = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const [
    totalCandidates,
    pendingCandidates,
    activeHaken,
    activeUkeoi,
    totalCompanies,
    // Compliance alerts
    expiringVisas,
    expiringDocuments,
    nearTeishokubi,
    // Recent audit log
    recentActivity,
  ] = await Promise.all([
    prisma.candidate.count(),
    prisma.candidate.count({ where: { status: "PENDING" } }),
    prisma.hakenshainAssignment.count({ where: { status: "ACTIVE" } }),
    prisma.ukeoiAssignment.count({ where: { status: "ACTIVE" } }),
    prisma.clientCompany.count({ where: { isActive: true } }),
    // Visas expiring in 30 days
    prisma.candidate.findMany({
      where: {
        visaExpiry: { not: null, lte: thirtyDaysFromNow },
        status: { in: ["APPROVED", "HIRED"] },
      },
      select: {
        id: true,
        lastNameKanji: true,
        firstNameKanji: true,
        visaExpiry: true,
      },
      orderBy: { visaExpiry: "asc" },
      take: 10,
    }),
    // Documents expiring in 30 days
    prisma.document.findMany({
      where: {
        expiryDate: { not: null, lte: thirtyDaysFromNow },
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
      take: 10,
    }),
    // Haken near teishokubi (within 180 days)
    prisma.hakenshainAssignment.findMany({
      where: {
        status: "ACTIVE",
        teishokubiDate: { not: null, lte: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000) },
      },
      select: {
        id: true,
        teishokubiDate: true,
        candidate: {
          select: {
            lastNameKanji: true,
            firstNameKanji: true,
          },
        },
        company: {
          select: { name: true },
        },
      },
      orderBy: { teishokubiDate: "asc" },
      take: 10,
    }),
    // Recent audit log
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        tableName: true,
        recordId: true,
        createdAt: true,
        newValues: true,
        user: {
          select: { name: true },
        },
      },
    }),
  ])

  const totalAlerts = expiringVisas.length + expiringDocuments.length + nearTeishokubi.length

  return {
    stats: {
      totalCandidates,
      pendingCandidates,
      activeHaken,
      activeUkeoi,
      totalCompanies,
      totalAlerts,
    },
    alerts: {
      expiringVisas,
      expiringDocuments,
      nearTeishokubi,
    },
    recentActivity,
  }
}
