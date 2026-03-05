"use client"

import type { UserRole } from "@prisma/client"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

import { useSidebarState } from "@/hooks/use-sidebar-state"

interface DashboardShellProps {
  children: React.ReactNode
  userRole: UserRole
  userName: string
}

export function DashboardShell({ children, userRole, userName }: DashboardShellProps) {
  const sidebarState = useSidebarState()

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] focus:p-4 focus:bg-background">
        メインコンテンツへスキップ
      </a>
      <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible print:block">
        <Sidebar
          userRole={userRole}
          userName={userName}
          isCollapsed={sidebarState.isCollapsed}
          isMobileOpen={sidebarState.isMobileOpen}
          toggleCollapse={sidebarState.toggleCollapse}
          closeMobile={sidebarState.closeMobile}
        />
        <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
          <Header toggleMobile={sidebarState.toggleMobile} />
          <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6 print:p-0 print:overflow-visible">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
