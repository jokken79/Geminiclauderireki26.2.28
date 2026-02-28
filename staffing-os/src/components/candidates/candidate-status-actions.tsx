"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateCandidateStatus } from "@/actions/candidates"
import type { CandidateStatus } from "@prisma/client"

interface CandidateStatusActionsProps {
  candidateId: string
  currentStatus: CandidateStatus
}

export function CandidateStatusActions({ candidateId, currentStatus }: CandidateStatusActionsProps) {
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (newStatus: CandidateStatus) => {
    const statusLabels: Record<string, string> = {
      APPROVED: "承認",
      REJECTED: "不合格",
    }
    if (!confirm(`この候補者を「${statusLabels[newStatus]}」にしますか？`)) return

    startTransition(async () => {
      const result = await updateCandidateStatus(candidateId, newStatus)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success(`ステータスを更新しました`)
      }
    })
  }

  if (currentStatus !== "PENDING") return null

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => handleStatusChange("APPROVED")}
        className="text-green-600 border-green-200 hover:bg-green-50"
      >
        <CheckCircle className="mr-1 h-4 w-4" />
        承認
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => handleStatusChange("REJECTED")}
        className="text-red-600 border-red-200 hover:bg-red-50"
      >
        <XCircle className="mr-1 h-4 w-4" />
        不合格
      </Button>
    </div>
  )
}
