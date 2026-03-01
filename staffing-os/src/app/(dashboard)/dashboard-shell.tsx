"use client"

import type { UserRole } from "@prisma/client"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

interface DashboardShellProps {
  children: React.ReactNode
  userRole: UserRole
  userName: string
}

export function DashboardShell({ children, userRole, userName }: DashboardShellProps) {
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] focus:p-4 focus:bg-background">
        メインコンテンツへスキップ
      </a>
      <div className="flex h-screen overflow-hidden">
        <Sidebar userRole={userRole} userName={userName} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main id="main-content" className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
