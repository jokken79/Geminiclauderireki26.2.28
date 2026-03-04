"use client"

import { useState, useEffect } from "react"

export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("staffing-os-sidebar-collapsed")
    if (stored) {
      setIsCollapsed(stored === "true")
    }
  }, [])

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newVal = !prev
      localStorage.setItem("staffing-os-sidebar-collapsed", String(newVal))
      return newVal
    })
  }

  const toggleMobile = () => {
    setIsMobileOpen((prev) => !prev)
  }

  const closeMobile = () => {
    setIsMobileOpen(false)
  }

  return {
    isCollapsed,
    isMobileOpen,
    toggleCollapse,
    toggleMobile,
    closeMobile,
  }
}
