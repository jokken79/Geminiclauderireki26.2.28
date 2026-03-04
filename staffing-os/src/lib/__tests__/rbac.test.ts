import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hasMinRole, PERMISSIONS, type Permission } from '../rbac'
import { ROLE_HIERARCHY, ROLE_LABELS } from '../constants'
import type { UserRole } from '@prisma/client'

// Mock auth module
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// All roles in order from lowest to highest
const ROLES_ASC: UserRole[] = [
  'CONTRACT_WORKER',
  'EMPLOYEE',
  'KANRININSHA',
  'COORDINATOR',
  'TANTOSHA',
  'KEITOSAN',
  'ADMIN',
  'SUPER_ADMIN',
]

describe('ROLE_HIERARCHY', () => {
  it('has all 8 roles defined', () => {
    expect(Object.keys(ROLE_HIERARCHY)).toHaveLength(8)
  })

  it('has strictly increasing hierarchy values', () => {
    for (let i = 1; i < ROLES_ASC.length; i++) {
      expect(ROLE_HIERARCHY[ROLES_ASC[i]]).toBeGreaterThan(ROLE_HIERARCHY[ROLES_ASC[i - 1]])
    }
  })

  it('SUPER_ADMIN has the highest value', () => {
    const maxValue = Math.max(...Object.values(ROLE_HIERARCHY))
    expect(ROLE_HIERARCHY['SUPER_ADMIN']).toBe(maxValue)
  })

  it('CONTRACT_WORKER has the lowest value', () => {
    const minValue = Math.min(...Object.values(ROLE_HIERARCHY))
    expect(ROLE_HIERARCHY['CONTRACT_WORKER']).toBe(minValue)
  })

  it('has matching keys with ROLE_LABELS', () => {
    const hierarchyKeys = Object.keys(ROLE_HIERARCHY).sort()
    const labelKeys = Object.keys(ROLE_LABELS).sort()
    expect(hierarchyKeys).toEqual(labelKeys)
  })
})

describe('hasMinRole', () => {
  it('returns true when user role equals required role', () => {
    for (const role of ROLES_ASC) {
      expect(hasMinRole(role, role)).toBe(true)
    }
  })

  it('returns true when user role is higher than required', () => {
    expect(hasMinRole('SUPER_ADMIN', 'ADMIN')).toBe(true)
    expect(hasMinRole('ADMIN', 'TANTOSHA')).toBe(true)
    expect(hasMinRole('TANTOSHA', 'COORDINATOR')).toBe(true)
    expect(hasMinRole('COORDINATOR', 'KANRININSHA')).toBe(true)
    expect(hasMinRole('KANRININSHA', 'EMPLOYEE')).toBe(true)
    expect(hasMinRole('EMPLOYEE', 'CONTRACT_WORKER')).toBe(true)
  })

  it('returns false when user role is lower than required', () => {
    expect(hasMinRole('CONTRACT_WORKER', 'ADMIN')).toBe(false)
    expect(hasMinRole('EMPLOYEE', 'TANTOSHA')).toBe(false)
    expect(hasMinRole('COORDINATOR', 'TANTOSHA')).toBe(false)
    expect(hasMinRole('KANRININSHA', 'COORDINATOR')).toBe(false)
  })

  it('SUPER_ADMIN can access everything', () => {
    for (const role of ROLES_ASC) {
      expect(hasMinRole('SUPER_ADMIN', role)).toBe(true)
    }
  })

  it('CONTRACT_WORKER can only access CONTRACT_WORKER level', () => {
    expect(hasMinRole('CONTRACT_WORKER', 'CONTRACT_WORKER')).toBe(true)
    for (const role of ROLES_ASC.slice(1)) {
      expect(hasMinRole('CONTRACT_WORKER', role)).toBe(false)
    }
  })

  it('each role can access itself and all roles below it', () => {
    for (let i = 0; i < ROLES_ASC.length; i++) {
      // Can access itself and all lower roles
      for (let j = 0; j <= i; j++) {
        expect(hasMinRole(ROLES_ASC[i], ROLES_ASC[j])).toBe(true)
      }
      // Cannot access higher roles
      for (let k = i + 1; k < ROLES_ASC.length; k++) {
        expect(hasMinRole(ROLES_ASC[i], ROLES_ASC[k])).toBe(false)
      }
    }
  })

  it('is reflexive (every role has at least its own level)', () => {
    for (const role of ROLES_ASC) {
      expect(hasMinRole(role, role)).toBe(true)
    }
  })

  it('adjacent roles: higher can access lower but not vice versa', () => {
    for (let i = 0; i < ROLES_ASC.length - 1; i++) {
      const lower = ROLES_ASC[i]
      const higher = ROLES_ASC[i + 1]
      expect(hasMinRole(higher, lower)).toBe(true)
      expect(hasMinRole(lower, higher)).toBe(false)
    }
  })
})

describe('requireRole', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('throws "認証が必要です" if no session exists', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce(null)

    const { requireRole } = await import('../rbac')
    await expect(requireRole('ADMIN')).rejects.toThrow('認証が必要です')
  })

  it('throws "認証が必要です" if session has no user', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce({ user: undefined, expires: '' } as never)

    const { requireRole } = await import('../rbac')
    await expect(requireRole('ADMIN')).rejects.toThrow('認証が必要です')
  })

  it('throws "権限がありません" if user has insufficient role', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'EMPLOYEE' },
      expires: '',
    } as never)

    const { requireRole } = await import('../rbac')
    await expect(requireRole('ADMIN')).rejects.toThrow('権限がありません')
  })

  it('throws "権限がありません" for COORDINATOR trying TANTOSHA action', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '2', email: 'coord@test.com', name: 'Coord', role: 'COORDINATOR' },
      expires: '',
    } as never)

    const { requireRole } = await import('../rbac')
    await expect(requireRole('TANTOSHA')).rejects.toThrow('権限がありません')
  })

  it('returns session if user has sufficient role', async () => {
    const mockSession = {
      user: { id: '1', email: 'admin@test.com', name: 'Admin', role: 'SUPER_ADMIN' },
      expires: '',
    }
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce(mockSession as never)

    const { requireRole } = await import('../rbac')
    const session = await requireRole('ADMIN')
    expect(session.user.role).toBe('SUPER_ADMIN')
  })

  it('returns session when role exactly matches', async () => {
    const mockSession = {
      user: { id: '3', email: 'tantosha@test.com', name: 'Tantosha', role: 'TANTOSHA' },
      expires: '',
    }
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce(mockSession as never)

    const { requireRole } = await import('../rbac')
    const session = await requireRole('TANTOSHA')
    expect(session.user.email).toBe('tantosha@test.com')
  })

  it('returns session with full user data intact', async () => {
    const mockSession = {
      user: { id: '99', email: 'keitosan@test.com', name: 'Keitosan User', role: 'KEITOSAN' },
      expires: '2024-12-31',
    }
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce(mockSession as never)

    const { requireRole } = await import('../rbac')
    const session = await requireRole('COORDINATOR')
    expect(session.user.id).toBe('99')
    expect(session.user.name).toBe('Keitosan User')
    expect(session.expires).toBe('2024-12-31')
  })
})

describe('PERMISSIONS', () => {
  it('has correct permissions for candidates', () => {
    expect(PERMISSIONS['candidates:read']).toBe('COORDINATOR')
    expect(PERMISSIONS['candidates:create']).toBe('TANTOSHA')
    expect(PERMISSIONS['candidates:update']).toBe('TANTOSHA')
    expect(PERMISSIONS['candidates:delete']).toBe('ADMIN')
    expect(PERMISSIONS['candidates:approve']).toBe('TANTOSHA')
  })

  it('has correct permissions for hakenshain', () => {
    expect(PERMISSIONS['hakenshain:read']).toBe('KANRININSHA')
    expect(PERMISSIONS['hakenshain:create']).toBe('TANTOSHA')
    expect(PERMISSIONS['hakenshain:update']).toBe('TANTOSHA')
  })

  it('has correct permissions for ukeoi', () => {
    expect(PERMISSIONS['ukeoi:read']).toBe('KANRININSHA')
    expect(PERMISSIONS['ukeoi:create']).toBe('TANTOSHA')
  })

  it('has correct permissions for companies', () => {
    expect(PERMISSIONS['companies:read']).toBe('COORDINATOR')
    expect(PERMISSIONS['companies:create']).toBe('TANTOSHA')
    expect(PERMISSIONS['companies:update']).toBe('TANTOSHA')
  })

  it('has correct permissions for documents', () => {
    expect(PERMISSIONS['documents:read']).toBe('KANRININSHA')
    expect(PERMISSIONS['documents:create']).toBe('TANTOSHA')
    expect(PERMISSIONS['documents:delete']).toBe('TANTOSHA')
  })

  it('has correct permissions for settings and admin actions', () => {
    expect(PERMISSIONS['settings:read']).toBe('ADMIN')
    expect(PERMISSIONS['users:manage']).toBe('ADMIN')
    expect(PERMISSIONS['audit:read']).toBe('ADMIN')
  })

  it('all permission values are valid UserRole values', () => {
    const validRoles = Object.keys(ROLE_HIERARCHY)
    for (const role of Object.values(PERMISSIONS)) {
      expect(validRoles).toContain(role)
    }
  })

  it('read permissions are always lower or equal to write permissions for the same domain', () => {
    const domains = ['candidates', 'hakenshain', 'companies', 'documents'] as const
    for (const domain of domains) {
      const readPerm = `${domain}:read` as Permission
      const createPerm = `${domain}:create` as Permission
      if (PERMISSIONS[readPerm] && PERMISSIONS[createPerm]) {
        expect(ROLE_HIERARCHY[PERMISSIONS[readPerm]]).toBeLessThanOrEqual(
          ROLE_HIERARCHY[PERMISSIONS[createPerm]]
        )
      }
    }
  })

  it('delete permissions require at least the same role as create', () => {
    const domainsWithDelete = ['candidates', 'documents'] as const
    for (const domain of domainsWithDelete) {
      const createPerm = `${domain}:create` as Permission
      const deletePerm = `${domain}:delete` as Permission
      expect(ROLE_HIERARCHY[PERMISSIONS[deletePerm]]).toBeGreaterThanOrEqual(
        ROLE_HIERARCHY[PERMISSIONS[createPerm]]
      )
    }
  })
})

describe('PERMISSIONS + hasMinRole integration', () => {
  it('COORDINATOR can read candidates but not create them', () => {
    expect(hasMinRole('COORDINATOR', PERMISSIONS['candidates:read'])).toBe(true)
    expect(hasMinRole('COORDINATOR', PERMISSIONS['candidates:create'])).toBe(false)
  })

  it('TANTOSHA can create candidates but not delete them', () => {
    expect(hasMinRole('TANTOSHA', PERMISSIONS['candidates:create'])).toBe(true)
    expect(hasMinRole('TANTOSHA', PERMISSIONS['candidates:delete'])).toBe(false)
  })

  it('ADMIN can do all candidate operations', () => {
    expect(hasMinRole('ADMIN', PERMISSIONS['candidates:read'])).toBe(true)
    expect(hasMinRole('ADMIN', PERMISSIONS['candidates:create'])).toBe(true)
    expect(hasMinRole('ADMIN', PERMISSIONS['candidates:update'])).toBe(true)
    expect(hasMinRole('ADMIN', PERMISSIONS['candidates:delete'])).toBe(true)
  })

  it('KANRININSHA can read hakenshain but not create', () => {
    expect(hasMinRole('KANRININSHA', PERMISSIONS['hakenshain:read'])).toBe(true)
    expect(hasMinRole('KANRININSHA', PERMISSIONS['hakenshain:create'])).toBe(false)
  })

  it('EMPLOYEE cannot access settings or user management', () => {
    expect(hasMinRole('EMPLOYEE', PERMISSIONS['settings:read'])).toBe(false)
    expect(hasMinRole('EMPLOYEE', PERMISSIONS['users:manage'])).toBe(false)
    expect(hasMinRole('EMPLOYEE', PERMISSIONS['audit:read'])).toBe(false)
  })

  it('CONTRACT_WORKER cannot access any permission', () => {
    for (const minRole of Object.values(PERMISSIONS)) {
      expect(hasMinRole('CONTRACT_WORKER', minRole)).toBe(false)
    }
  })

  it('SUPER_ADMIN can access every permission', () => {
    for (const minRole of Object.values(PERMISSIONS)) {
      expect(hasMinRole('SUPER_ADMIN', minRole)).toBe(true)
    }
  })
})
