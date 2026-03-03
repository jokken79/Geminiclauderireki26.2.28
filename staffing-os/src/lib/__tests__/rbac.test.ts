import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hasMinRole, PERMISSIONS } from '../rbac'

// Mock auth module
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

describe('hasMinRole', () => {
  it('returns true when user role equals required role', () => {
    expect(hasMinRole('ADMIN', 'ADMIN')).toBe(true)
  })

  it('returns true when user role is higher than required', () => {
    expect(hasMinRole('SUPER_ADMIN', 'ADMIN')).toBe(true)
    expect(hasMinRole('ADMIN', 'TANTOSHA')).toBe(true)
    expect(hasMinRole('TANTOSHA', 'COORDINATOR')).toBe(true)
  })

  it('returns false when user role is lower than required', () => {
    expect(hasMinRole('CONTRACT_WORKER', 'ADMIN')).toBe(false)
    expect(hasMinRole('EMPLOYEE', 'TANTOSHA')).toBe(false)
    expect(hasMinRole('COORDINATOR', 'TANTOSHA')).toBe(false)
  })

  it('SUPER_ADMIN can access everything', () => {
    expect(hasMinRole('SUPER_ADMIN', 'SUPER_ADMIN')).toBe(true)
    expect(hasMinRole('SUPER_ADMIN', 'ADMIN')).toBe(true)
    expect(hasMinRole('SUPER_ADMIN', 'CONTRACT_WORKER')).toBe(true)
  })

  it('CONTRACT_WORKER can only access CONTRACT_WORKER level', () => {
    expect(hasMinRole('CONTRACT_WORKER', 'CONTRACT_WORKER')).toBe(true)
    expect(hasMinRole('CONTRACT_WORKER', 'EMPLOYEE')).toBe(false)
    expect(hasMinRole('CONTRACT_WORKER', 'ADMIN')).toBe(false)
  })
})

describe('requireRole', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('throws if no session exists', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce(null)

    const { requireRole } = await import('../rbac')
    await expect(requireRole('ADMIN')).rejects.toThrow('認証が必要です')
  })

  it('throws if user has insufficient role', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'EMPLOYEE' },
      expires: '',
    } as never)

    const { requireRole } = await import('../rbac')
    await expect(requireRole('ADMIN')).rejects.toThrow('権限がありません')
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
})

describe('PERMISSIONS', () => {
  it('has correct permissions for candidates', () => {
    expect(PERMISSIONS['candidates:read']).toBe('COORDINATOR')
    expect(PERMISSIONS['candidates:create']).toBe('TANTOSHA')
    expect(PERMISSIONS['candidates:delete']).toBe('ADMIN')
  })

  it('has correct permissions for settings', () => {
    expect(PERMISSIONS['settings:read']).toBe('ADMIN')
    expect(PERMISSIONS['users:manage']).toBe('ADMIN')
    expect(PERMISSIONS['audit:read']).toBe('ADMIN')
  })

  it('has correct permissions for hakenshain', () => {
    expect(PERMISSIONS['hakenshain:read']).toBe('KANRININSHA')
    expect(PERMISSIONS['hakenshain:create']).toBe('TANTOSHA')
  })

  it('has correct permissions for documents', () => {
    expect(PERMISSIONS['documents:read']).toBe('KANRININSHA')
    expect(PERMISSIONS['documents:create']).toBe('TANTOSHA')
    expect(PERMISSIONS['documents:delete']).toBe('TANTOSHA')
  })
})
