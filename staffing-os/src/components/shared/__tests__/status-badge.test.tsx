import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CandidateStatusBadge } from '../status-badge'
import { CANDIDATE_STATUS_LABELS } from '@/lib/constants'

describe('CandidateStatusBadge', () => {
    it('renders PENDING status correctly', () => {
        render(<CandidateStatusBadge status="PENDING" />)
        expect(screen.getByText(CANDIDATE_STATUS_LABELS['PENDING'])).toBeInTheDocument()
    })

    it('renders APPROVED status correctly', () => {
        render(<CandidateStatusBadge status="APPROVED" />)
        expect(screen.getByText(CANDIDATE_STATUS_LABELS['APPROVED'])).toBeInTheDocument()
    })
})
