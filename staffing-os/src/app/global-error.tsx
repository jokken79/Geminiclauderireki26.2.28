"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
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
        <html lang="ja">
            <body>
                <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-background text-foreground">
                    <h2 className="text-2xl font-bold">致命的なエラーが発生しました</h2>
                    <p className="text-muted-foreground">システム全体に関わるエラーが発生しました。</p>
                    <Button onClick={() => reset()}>再試行する</Button>
                </div>
            </body>
        </html>
    )
}
