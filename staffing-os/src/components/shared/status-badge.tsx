import { Badge } from "@/components/ui/badge"
import { CANDIDATE_STATUS_LABELS, ASSIGNMENT_STATUS_LABELS } from "@/lib/constants"
import type { CandidateStatus, AssignmentStatus } from "@prisma/client"

const CANDIDATE_VARIANTS: Record<CandidateStatus, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  HIRED: "default",
  WITHDRAWN: "secondary",
}

const ASSIGNMENT_VARIANTS: Record<AssignmentStatus, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  ACTIVE: "success",
  EXPIRED: "warning",
  TERMINATED: "destructive",
  ON_LEAVE: "secondary",
}

export function CandidateStatusBadge({ status }: { status: CandidateStatus }) {
  return (
    <Badge variant={CANDIDATE_VARIANTS[status]}>
      {CANDIDATE_STATUS_LABELS[status]}
    </Badge>
  )
}

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  return (
    <Badge variant={ASSIGNMENT_VARIANTS[status]}>
      {ASSIGNMENT_STATUS_LABELS[status]}
    </Badge>
  )
}
