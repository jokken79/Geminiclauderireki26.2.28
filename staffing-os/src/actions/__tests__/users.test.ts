import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/rbac', () => ({
  requireRole: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({ id: 'user-1' }),
          findUnique: vi.fn().mockResolvedValue({ role: 'EMPLOYEE', name: 'Test', isActive: true }),
          update: vi.fn(),
        },
        auditLog: { create: vi.fn() },
      })
    }),
  },
}))

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('getUsers', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls requireRole with ADMIN', async () => {
    const { requireRole } = await import('@/lib/rbac')
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: { id: '1', email: 'a@a.com', name: 'Admin', role: 'ADMIN' },
      expires: '',
    } as never)

    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([] as never)

    const { getUsers } = await import('../users')
    await getUsers()
    expect(requireRole).toHaveBeenCalledWith('ADMIN')
  })
})

describe('createUser', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns error if required fields are missing', async () => {
    const { requireRole } = await import('@/lib/rbac')
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: { id: '1', email: 'a@a.com', name: 'Admin', role: 'ADMIN' },
      expires: '',
    } as never)

    const { createUser } = await import('../users')
    const result = await createUser({ email: '', name: '', password: '', role: 'EMPLOYEE' })
    expect(result).toHaveProperty('error', '全ての必須項目を入力してください')
  })

  it('returns error if email already exists', async () => {
    const { requireRole } = await import('@/lib/rbac')
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: { id: '1', email: 'a@a.com', name: 'Admin', role: 'ADMIN' },
      expires: '',
    } as never)

    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'existing' } as never)

    const { createUser } = await import('../users')
    const result = await createUser({
      email: 'existing@test.com',
      name: 'Test',
      password: 'password123',
      role: 'EMPLOYEE',
    })
    expect(result).toHaveProperty('error', 'このメールアドレスは既に使用されています')
  })

  it('creates user successfully', async () => {
    const { requireRole } = await import('@/lib/rbac')
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: { id: '1', email: 'a@a.com', name: 'Admin', role: 'ADMIN' },
      expires: '',
    } as never)

    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

    const { createUser } = await import('../users')
    const result = await createUser({
      email: 'new@test.com',
      name: '新ユーザー',
      password: 'password123',
      role: 'TANTOSHA',
    })
    expect(result).toHaveProperty('success', true)
  })
})

describe('updateUserRole', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('prevents changing own role', async () => {
    const { requireRole } = await import('@/lib/rbac')
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: { id: 'user-1', email: 'a@a.com', name: 'Admin', role: 'ADMIN' },
      expires: '',
    } as never)

    const { updateUserRole } = await import('../users')
    const result = await updateUserRole('user-1', 'SUPER_ADMIN')
    expect(result).toHaveProperty('error', '自分自身のロールは変更できません')
  })

  it('updates role for other users', async () => {
    const { requireRole } = await import('@/lib/rbac')
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'a@a.com', name: 'Admin', role: 'ADMIN' },
      expires: '',
    } as never)

    const { updateUserRole } = await import('../users')
    const result = await updateUserRole('user-2', 'TANTOSHA')
    expect(result).toHaveProperty('success', true)
  })
})

describe('toggleUserActive', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('prevents deactivating self', async () => {
    const { requireRole } = await import('@/lib/rbac')
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: { id: 'user-1', email: 'a@a.com', name: 'Admin', role: 'ADMIN' },
      expires: '',
    } as never)

    const { toggleUserActive } = await import('../users')
    const result = await toggleUserActive('user-1')
    expect(result).toHaveProperty('error', '自分自身を無効化できません')
  })

  it('toggles active status for other users', async () => {
    const { requireRole } = await import('@/lib/rbac')
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'a@a.com', name: 'Admin', role: 'ADMIN' },
      expires: '',
    } as never)

    const { toggleUserActive } = await import('../users')
    const result = await toggleUserActive('user-2')
    expect(result).toHaveProperty('success', true)
  })
})
