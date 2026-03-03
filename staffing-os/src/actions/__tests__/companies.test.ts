import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    clientCompany: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => {
      return fn({
        clientCompany: {
          create: vi.fn().mockResolvedValue({ id: 'comp-1', name: 'テスト企業' }),
          findUnique: vi.fn().mockResolvedValue({ name: '旧名' }),
          update: vi.fn(),
        },
        auditLog: { create: vi.fn() },
      })
    }),
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('createCompany', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws if not authenticated', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce(null)

    const { createCompany } = await import('../companies')
    await expect(createCompany({ name: 'Test' } as never)).rejects.toThrow('認証が必要です')
  })

  it('returns validation error for empty name', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '1', email: 't@t.com', name: 'T', role: 'TANTOSHA' },
      expires: '',
    } as never)

    const { createCompany } = await import('../companies')
    const result = await createCompany({ name: '' } as never)
    expect(result).toHaveProperty('error', 'バリデーションエラー')
  })

  it('creates company with valid data', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '1', email: 't@t.com', name: 'T', role: 'TANTOSHA' },
      expires: '',
    } as never)

    const { createCompany } = await import('../companies')
    const result = await createCompany({ name: 'テスト株式会社' } as never)
    expect(result).toHaveProperty('success', true)
  })
})

describe('getCompanies', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws if not authenticated', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce(null)

    const { getCompanies } = await import('../companies')
    await expect(getCompanies({})).rejects.toThrow('認証が必要です')
  })

  it('returns companies list', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '1', email: 't@t.com', name: 'T', role: 'COORDINATOR' },
      expires: '',
    } as never)

    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.clientCompany.findMany).mockResolvedValueOnce([
      { id: '1', name: 'テスト企業' },
    ] as never)
    vi.mocked(prisma.clientCompany.count).mockResolvedValueOnce(1)

    const { getCompanies } = await import('../companies')
    const result = await getCompanies({})
    expect(result.companies).toHaveLength(1)
    expect(result.total).toBe(1)
  })
})

describe('updateCompany', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws if not authenticated', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce(null)

    const { updateCompany } = await import('../companies')
    await expect(updateCompany('id', { name: 'New' } as never)).rejects.toThrow('認証が必要です')
  })

  it('updates company and returns success', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '1', email: 't@t.com', name: 'T', role: 'TANTOSHA' },
      expires: '',
    } as never)

    const { updateCompany } = await import('../companies')
    const result = await updateCompany('comp-1', { name: '新テスト企業' } as never)
    expect(result).toHaveProperty('success', true)
  })
})
