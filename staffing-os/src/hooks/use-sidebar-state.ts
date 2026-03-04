"use client"

import { useState, useCallback, useSyncExternalStore } from "react"

function getStoredCollapsed() {
  if (typeof window === "undefined") return false
  return localStorage.getItem("staffing-os-sidebar-collapsed") === "true"
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}

export function useSidebarState() {
  const storedCollapsed = useSyncExternalStore(
    subscribeToStorage,
    getStoredCollapsed,
    () => false
  )
  const [isCollapsed, setIsCollapsed] = useState(storedCollapsed)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const newVal = !prev
      localStorage.setItem("staffing-os-sidebar-collapsed", String(newVal))
      return newVal
    })
  }, [])

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev)
  }, [])

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  return {
    isCollapsed,
    isMobileOpen,
    toggleCollapse,
    toggleMobile,
    closeMobile,
  }
}
