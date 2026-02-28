/**
 * 抵触日 (Teishokubi) calculation utilities
 *
 * Under the Worker Dispatch Act (労働者派遣法), dispatched workers
 * cannot work at the same client company for more than 3 years.
 */

/** Calculate 抵触日 (3 years from hire date) */
export function calculateTeishokubi(hireDate: Date): Date {
  const teishokubi = new Date(hireDate)
  teishokubi.setFullYear(teishokubi.getFullYear() + 3)
  return teishokubi
}

/** Get days remaining until 抵触日 */
export function getDaysUntilTeishokubi(teishokubiDate: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(teishokubiDate)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/** Get severity level based on days remaining */
export function getTeishokubiSeverity(daysRemaining: number): "safe" | "warning" | "danger" | "expired" {
  if (daysRemaining < 0) return "expired"
  if (daysRemaining <= 90) return "danger"
  if (daysRemaining <= 180) return "warning"
  return "safe"
}

/** Get label for severity */
export function getTeishokubiLabel(daysRemaining: number): string {
  if (daysRemaining < 0) return `${Math.abs(daysRemaining)}日超過`
  if (daysRemaining === 0) return "本日期限"
  return `残り${daysRemaining}日`
}
