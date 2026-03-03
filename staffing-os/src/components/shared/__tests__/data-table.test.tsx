import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DataTable } from '../data-table'
import type { ColumnDef } from '@tanstack/react-table'

type TestRow = { id: string; name: string; age: number }

const columns: ColumnDef<TestRow>[] = [
  { accessorKey: 'name', header: '氏名' },
  { accessorKey: 'age', header: '年齢' },
]

const data: TestRow[] = [
  { id: '1', name: '田中太郎', age: 30 },
  { id: '2', name: '鈴木花子', age: 25 },
]

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('氏名')).toBeInTheDocument()
    expect(screen.getByText('年齢')).toBeInTheDocument()
  })

  it('renders row data', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('田中太郎')).toBeInTheDocument()
    expect(screen.getByText('鈴木花子')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('shows empty message when no data', () => {
    render(<DataTable columns={columns} data={[]} />)
    expect(screen.getByText('データがありません')).toBeInTheDocument()
  })

  it('shows custom empty message', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="候補者がいません" />)
    expect(screen.getByText('候補者がいません')).toBeInTheDocument()
  })

  it('renders correct number of rows', () => {
    render(<DataTable columns={columns} data={data} />)
    const rows = screen.getAllByRole('row')
    // 1 header row + 2 data rows
    expect(rows).toHaveLength(3)
  })
})
