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

interface HeaderProps {
  toggleMobile?: () => void
}

export function Header({ toggleMobile }: HeaderProps) {
  const pathname = usePathname()

  // Find matching title (check exact match first, then prefix)
  const title =
    PAGE_TITLES[pathname] ||
    Object.entries(PAGE_TITLES).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ||
    "Staffing OS"

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        {toggleMobile && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMobile} aria-label="メニューを開く">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
          </Button>
        )}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" aria-label="通知">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
