"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { updateHakenshainStatus } from "@/actions/hakenshain"
import type { AssignmentStatus } from "@prisma/client"

interface HakenshainStatusActionsProps {
  id: string
  status: AssignmentStatus
}

export function HakenshainStatusActions({ id, status }: HakenshainStatusActionsProps) {
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (newStatus: AssignmentStatus) => {
    if (!confirm(`ステータスを変更しますか？`)) return

    startTransition(async () => {
      const result = await updateHakenshainStatus(id, newStatus)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success("ステータスを更新しました")
      }
    })
  }

  return (
    <div className="flex gap-2">
      {status === "ACTIVE" && (
        <>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleStatusChange("ON_LEAVE")}
          >
            休職
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => handleStatusChange("TERMINATED")}
          >
            契約終了
          </Button>
        </>
      )}
      {status === "ON_LEAVE" && (
        <Button
          variant="default"
          size="sm"
          disabled={isPending}
          onClick={() => handleStatusChange("ACTIVE")}
        >
          復帰
        </Button>
      )}
      {status === "EXPIRED" && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleStatusChange("TERMINATED")}
        >
          契約終了
        </Button>
      )}
    </div>
  )
}
