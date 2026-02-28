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
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole={userRole} userName={userName} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
