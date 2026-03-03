import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AlertsPanel } from '../alerts-panel'

const emptyProps = {
  expiringVisas: [],
  expiringDocuments: [],
  nearTeishokubi: [],
}

describe('AlertsPanel', () => {
  it('shows "no alerts" message when everything is empty', () => {
    render(<AlertsPanel {...emptyProps} />)
    expect(screen.getByText('アラートはありません')).toBeInTheDocument()
  })

  it('renders visa expiry alerts', () => {
    const props = {
      ...emptyProps,
      expiringVisas: [
        {
          id: '1',
          lastNameKanji: '田中',
          firstNameKanji: '太郎',
          visaExpiry: new Date('2025-01-15'),
        },
      ],
    }
    render(<AlertsPanel {...props} />)
    expect(screen.getByText('ビザ期限切れ間近 (1件)')).toBeInTheDocument()
    expect(screen.getByText('田中 太郎')).toBeInTheDocument()
  })

  it('renders document expiry alerts', () => {
    const props = {
      ...emptyProps,
      expiringDocuments: [
        {
          id: 'd1',
          type: 'PASSPORT' as const,
          fileName: 'passport.pdf',
          expiryDate: new Date('2025-02-01'),
          candidate: {
            id: 'c1',
            lastNameKanji: '鈴木',
            firstNameKanji: '花子',
          },
        },
      ],
    }
    render(<AlertsPanel {...props} />)
    expect(screen.getByText('書類期限切れ間近 (1件)')).toBeInTheDocument()
    expect(screen.getByText('鈴木 花子')).toBeInTheDocument()
    expect(screen.getByText('(パスポート)')).toBeInTheDocument()
  })

  it('renders teishokubi alerts', () => {
    const props = {
      ...emptyProps,
      nearTeishokubi: [
        {
          id: 'h1',
          teishokubiDate: new Date('2025-06-01'),
          candidate: {
            lastNameKanji: '佐藤',
            firstNameKanji: '一郎',
          },
          company: {
            name: 'トヨタ自動車',
          },
        },
      ],
    }
    render(<AlertsPanel {...props} />)
    expect(screen.getByText('抵触日接近 (1件)')).toBeInTheDocument()
    expect(screen.getByText('佐藤 一郎')).toBeInTheDocument()
    expect(screen.getByText('→ トヨタ自動車')).toBeInTheDocument()
  })

  it('renders the main title', () => {
    render(<AlertsPanel {...emptyProps} />)
    expect(screen.getByText('コンプライアンスアラート')).toBeInTheDocument()
  })

  it('shows multiple alert sections simultaneously', () => {
    const props = {
      expiringVisas: [
        { id: '1', lastNameKanji: 'A', firstNameKanji: 'B', visaExpiry: new Date('2025-01-15') },
      ],
      expiringDocuments: [
        {
          id: 'd1', type: 'RESIDENCE_CARD' as const, fileName: 'card.pdf',
          expiryDate: new Date('2025-02-01'),
          candidate: { id: 'c1', lastNameKanji: 'C', firstNameKanji: 'D' },
        },
      ],
      nearTeishokubi: [
        {
          id: 'h1', teishokubiDate: new Date('2025-06-01'),
          candidate: { lastNameKanji: 'E', firstNameKanji: 'F' },
          company: { name: 'Test Co' },
        },
      ],
    }
    render(<AlertsPanel {...props} />)
    expect(screen.getByText('ビザ期限切れ間近 (1件)')).toBeInTheDocument()
    expect(screen.getByText('書類期限切れ間近 (1件)')).toBeInTheDocument()
    expect(screen.getByText('抵触日接近 (1件)')).toBeInTheDocument()
  })
})
