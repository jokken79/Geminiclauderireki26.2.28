import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Sidebar } from '../sidebar'

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

describe('Sidebar', () => {
  it('renders logo and app name', () => {
    render(<Sidebar userRole="SUPER_ADMIN" userName="管理者" />)
    expect(screen.getByText('Staffing OS')).toBeInTheDocument()
    expect(screen.getByText('人材派遣管理')).toBeInTheDocument()
  })

  it('shows all nav items for SUPER_ADMIN', () => {
    render(<Sidebar userRole="SUPER_ADMIN" userName="管理者" />)
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument()
    expect(screen.getByText('候補者')).toBeInTheDocument()
    expect(screen.getByText('派遣社員')).toBeInTheDocument()
    expect(screen.getByText('請負')).toBeInTheDocument()
    expect(screen.getByText('企業')).toBeInTheDocument()
    expect(screen.getByText('書類')).toBeInTheDocument()
    expect(screen.getByText('OCRスキャン')).toBeInTheDocument()
    expect(screen.getByText('設定')).toBeInTheDocument()
  })

  it('hides high-level items for low-role users', () => {
    render(<Sidebar userRole="CONTRACT_WORKER" userName="社員" />)
    // CONTRACT_WORKER (level 1) should only see ダッシュボード (minRole=1)
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument()
    expect(screen.queryByText('候補者')).not.toBeInTheDocument() // minRole=4
    expect(screen.queryByText('設定')).not.toBeInTheDocument()   // minRole=7
  })

  it('shows appropriate items for COORDINATOR (level 4)', () => {
    render(<Sidebar userRole="COORDINATOR" userName="コーディネーター" />)
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument() // minRole=1
    expect(screen.getByText('候補者')).toBeInTheDocument()          // minRole=4
    expect(screen.getByText('派遣社員')).toBeInTheDocument()        // minRole=3
    expect(screen.getByText('企業')).toBeInTheDocument()            // minRole=4
    expect(screen.queryByText('OCRスキャン')).not.toBeInTheDocument() // minRole=5
    expect(screen.queryByText('設定')).not.toBeInTheDocument()       // minRole=7
  })

  it('shows TANTOSHA-level items (level 5)', () => {
    render(<Sidebar userRole="TANTOSHA" userName="担当者" />)
    expect(screen.getByText('OCRスキャン')).toBeInTheDocument()              // minRole=5
    expect(screen.getByText('インポート/エクスポート')).toBeInTheDocument()  // minRole=5
    expect(screen.queryByText('設定')).not.toBeInTheDocument()               // minRole=7
  })

  it('displays user name', () => {
    render(<Sidebar userRole="ADMIN" userName="山田太郎" />)
    expect(screen.getByText('山田太郎')).toBeInTheDocument()
  })

  it('shows 管理者 label for ADMIN role', () => {
    render(<Sidebar userRole="ADMIN" userName="テストユーザー" />)
    expect(screen.getByText('管理者')).toBeInTheDocument()
  })

  it('shows ユーザー label for non-admin roles', () => {
    render(<Sidebar userRole="TANTOSHA" userName="担当者" />)
    expect(screen.getByText('ユーザー')).toBeInTheDocument()
  })

  it('has logout button', () => {
    render(<Sidebar userRole="ADMIN" userName="管理者" />)
    expect(screen.getByTitle('ログアウト')).toBeInTheDocument()
  })
})
