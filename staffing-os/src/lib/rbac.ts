import { auth } from "@/lib/auth"
import { ROLE_HIERARCHY } from "@/lib/constants"
import type { UserRole } from "@prisma/client"

/**
 * Check if a role has at least the minimum required permission level.
 */
export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]
}

/**
 * Server-side role guard. Throws if user doesn't have the required role.
 */
export async function requireRole(minRole: UserRole) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("認証が必要です")
  }

  if (!hasMinRole(session.user.role, minRole)) {
    throw new Error("権限がありません")
  }

  return session
}

/**
 * Permission matrix — maps actions to minimum required roles
 */
export const PERMISSIONS = {
  // Candidates
  "candidates:read": "COORDINATOR" as UserRole,
  "candidates:create": "TANTOSHA" as UserRole,
  "candidates:update": "TANTOSHA" as UserRole,
  "candidates:delete": "ADMIN" as UserRole,
  "candidates:approve": "TANTOSHA" as UserRole,

  // Hakenshain
  "hakenshain:read": "KANRININSHA" as UserRole,
  "hakenshain:create": "TANTOSHA" as UserRole,
  "hakenshain:update": "TANTOSHA" as UserRole,

  // Ukeoi
  "ukeoi:read": "KANRININSHA" as UserRole,
  "ukeoi:create": "TANTOSHA" as UserRole,

  // Companies
  "companies:read": "COORDINATOR" as UserRole,
  "companies:create": "TANTOSHA" as UserRole,
  "companies:update": "TANTOSHA" as UserRole,

  // Documents
  "documents:read": "KANRININSHA" as UserRole,
  "documents:create": "TANTOSHA" as UserRole,
  "documents:delete": "TANTOSHA" as UserRole,

  // Settings
  "settings:read": "ADMIN" as UserRole,
  "users:manage": "ADMIN" as UserRole,
  "audit:read": "ADMIN" as UserRole,
} as const

export type Permission = keyof typeof PERMISSIONS
