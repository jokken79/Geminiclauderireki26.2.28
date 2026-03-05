"use server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/rbac"

export async function getDashboardStats() {
  await requireRole("COORDINATOR")

  const now = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  // Start of current month for trend calculations
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

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
    // New this month (for trend calculations)
    newCandidatesThisMonth,
    newHakenThisMonth,
    newUkeoiThisMonth,
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
    // New this month (for trend calculations)
    prisma.candidate.count({
      where: { createdAt: { gte: startOfCurrentMonth } },
    }),
    prisma.hakenshainAssignment.count({
      where: {
        status: "ACTIVE",
        startDate: { gte: startOfCurrentMonth },
      },
    }),
    prisma.ukeoiAssignment.count({
      where: {
        status: "ACTIVE",
        startDate: { gte: startOfCurrentMonth },
      },
    }),
  ])

  const totalAlerts = expiringVisas.length + expiringDocuments.length + nearTeishokubi.length

  // Calculate month-over-month trend percentages
  function calcTrend(current: number, previous: number): { percent: number; direction: "up" | "down" | "flat" } {
    if (previous === 0) {
      return current > 0 ? { percent: 100, direction: "up" } : { percent: 0, direction: "flat" }
    }
    const change = ((current - previous) / previous) * 100
    const rounded = Math.round(Math.abs(change))
    if (change > 0) return { percent: rounded, direction: "up" }
    if (change < 0) return { percent: rounded, direction: "down" }
    return { percent: 0, direction: "flat" }
  }

  const prevMonthCandidates = totalCandidates - newCandidatesThisMonth
  const prevMonthHaken = activeHaken - newHakenThisMonth
  const prevMonthUkeoi = activeUkeoi - newUkeoiThisMonth

  return {
    stats: {
      totalCandidates,
      pendingCandidates,
      activeHaken,
      activeUkeoi,
      totalCompanies,
      totalAlerts,
      trends: {
        candidates: calcTrend(totalCandidates, prevMonthCandidates),
        haken: calcTrend(activeHaken, prevMonthHaken),
        ukeoi: calcTrend(activeUkeoi, prevMonthUkeoi),
      },
    },
    alerts: {
      expiringVisas,
      expiringDocuments,
      nearTeishokubi,
    },
    recentActivity,
  }
}
