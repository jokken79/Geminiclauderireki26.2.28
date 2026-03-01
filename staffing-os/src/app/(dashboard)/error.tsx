"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex h-[80vh] flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="rounded-full bg-destructive/10 p-3 text-destructive">
                <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold">エラーが発生しました</h2>
            <p className="text-muted-foreground max-w-md">
                データの読み込み中に問題が発生しました。しばらく経ってから再度お試しください。
            </p>
            <Button onClick={() => reset()} variant="default">
                再読み込み
            </Button>
        </div>
    )
}
