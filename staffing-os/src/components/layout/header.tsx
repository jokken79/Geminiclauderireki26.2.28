"use client"

import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "ダッシュボード",
  "/candidates": "候補者管理",
  "/hakenshain": "派遣社員管理",
  "/ukeoi": "請負管理",
  "/companies": "企業管理",
  "/documents": "書類管理",
  "/ocr": "OCRスキャン",
  "/import-export": "インポート/エクスポート",
  "/reports": "レポート",
  "/settings": "設定",
}

export function Header() {
  const pathname = usePathname()

  // Find matching title (check exact match first, then prefix)
  const title =
    PAGE_TITLES[pathname] ||
    Object.entries(PAGE_TITLES).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ||
    "Staffing OS"

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            3
          </span>
        </Button>
      </div>
    </header>
  )
}
