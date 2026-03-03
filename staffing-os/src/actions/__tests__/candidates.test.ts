import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    candidate: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    workHistory: { deleteMany: vi.fn() },
    qualification: { deleteMany: vi.fn() },
    familyMember: { deleteMany: vi.fn() },
    educationHistory: { deleteMany: vi.fn() },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => {
      return fn({
        candidate: {
          create: vi.fn().mockResolvedValue({ id: 'new-id' }),
          findUnique: vi.fn().mockResolvedValue({ lastNameKanji: '田中', status: 'PENDING' }),
          update: vi.fn(),
          delete: vi.fn(),
        },
        auditLog: { create: vi.fn() },
        workHistory: { deleteMany: vi.fn() },
        qualification: { deleteMany: vi.fn() },
        familyMember: { deleteMany: vi.fn() },
        educationHistory: { deleteMany: vi.fn() },
      })
    }),
  },
}))

vi.mock('@/lib/file-storage', () => ({
  saveBase64File: vi.fn().mockResolvedValue(null),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('createCandidate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws if not authenticated', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce(null)

    const { createCandidate } = await import('../candidates')
    await expect(createCandidate({
      lastNameKanji: '田中',
      birthDate: '1990-01-15',
      nationality: '日本',
    } as never)).rejects.toThrow('認証が必要です')
  })

  it('returns validation error for invalid data', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '1', email: 't@t.com', name: 'T', role: 'TANTOSHA' },
      expires: '',
    } as never)

    const { createCandidate } = await import('../candidates')
    const result = await createCandidate({} as never)
    expect(result).toHaveProperty('error', 'バリデーションエラー')
  })

  it('creates candidate with valid data', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '1', email: 't@t.com', name: 'T', role: 'TANTOSHA' },
      expires: '',
    } as never)

    const { createCandidate } = await import('../candidates')
    const result = await createCandidate({
      lastNameKanji: '田中',
      birthDate: '1990-01-15',
      nationality: '日本',
    } as never)

    expect(result).toHaveProperty('success', true)
    expect(result).toHaveProperty('id')
  })
})

describe('getCandidates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws if not authenticated', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce(null)

    const { getCandidates } = await import('../candidates')
    await expect(getCandidates({})).rejects.toThrow('認証が必要です')
  })

  it('returns candidates list with total', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '1', email: 't@t.com', name: 'T', role: 'COORDINATOR' },
      expires: '',
    } as never)

    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.candidate.findMany).mockResolvedValueOnce([
      { id: '1', lastNameKanji: '田中', firstNameKanji: '太郎' },
    ] as never)
    vi.mocked(prisma.candidate.count).mockResolvedValueOnce(1)

    const { getCandidates } = await import('../candidates')
    const result = await getCandidates({})
    expect(result.candidates).toHaveLength(1)
    expect(result.total).toBe(1)
  })
})

describe('updateCandidateStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws if not authenticated', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce(null)

    const { updateCandidateStatus } = await import('../candidates')
    await expect(updateCandidateStatus('id', 'APPROVED')).rejects.toThrow('認証が必要です')
  })

  it('updates status and returns success', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '1', email: 't@t.com', name: 'T', role: 'TANTOSHA' },
      expires: '',
    } as never)

    const { updateCandidateStatus } = await import('../candidates')
    const result = await updateCandidateStatus('cand-1', 'APPROVED')
    expect(result).toHaveProperty('success', true)
  })
})

describe('deleteCandidate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws if not authenticated', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce(null)

    const { deleteCandidate } = await import('../candidates')
    await expect(deleteCandidate('id')).rejects.toThrow('認証が必要です')
  })

  it('deletes candidate and returns success', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '1', email: 't@t.com', name: 'T', role: 'ADMIN' },
      expires: '',
    } as never)

    const { deleteCandidate } = await import('../candidates')
    const result = await deleteCandidate('cand-1')
    expect(result).toHaveProperty('success', true)
  })
})
