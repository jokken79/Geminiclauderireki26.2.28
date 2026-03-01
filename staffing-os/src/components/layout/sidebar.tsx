"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Briefcase,
  Building2,
  FileText,
  ScanLine,
  ArrowUpDown,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { ROLE_HIERARCHY } from "@/lib/constants"
import type { UserRole } from "@prisma/client"

const ICONS = {
  LayoutDashboard,
  Users,
  UserCheck,
  Briefcase,
  Building2,
  FileText,
  ScanLine,
  ArrowUpDown,
  BarChart3,
  Settings,
} as const

type NavItem = {
  href: string
  label: string
  icon: keyof typeof ICONS
  minRole: number
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "ダッシュボード", icon: "LayoutDashboard", minRole: 1 },
  { href: "/candidates", label: "候補者", icon: "Users", minRole: 4 },
  { href: "/hakenshain", label: "派遣社員", icon: "UserCheck", minRole: 3 },
  { href: "/ukeoi", label: "請負", icon: "Briefcase", minRole: 3 },
  { href: "/companies", label: "企業", icon: "Building2", minRole: 4 },
  { href: "/documents", label: "書類", icon: "FileText", minRole: 3 },
  { href: "/ocr", label: "OCRスキャン", icon: "ScanLine", minRole: 5 },
  { href: "/import-export", label: "インポート/エクスポート", icon: "ArrowUpDown", minRole: 5 },
  { href: "/reports", label: "レポート", icon: "BarChart3", minRole: 5 },
  { href: "/settings", label: "設定", icon: "Settings", minRole: 7 },
]

interface SidebarProps {
  userRole: UserRole
  userName: string
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname()
  const userRoleLevel = ROLE_HIERARCHY[userRole]

  const visibleItems = NAV_ITEMS.filter((item) => userRoleLevel >= item.minRole)

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <span className="text-sm font-bold">S</span>
        </div>
        <div>
          <h1 className="text-sm font-bold">Staffing OS</h1>
          <p className="text-xs text-muted-foreground">人材派遣管理</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const Icon = ICONS[item.icon]
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="border-t p-3">
        <div className="flex items-center justify-between rounded-lg px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {ROLE_HIERARCHY[userRole] >= 7 ? "管理者" : "ユーザー"}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            title="ログアウト"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
