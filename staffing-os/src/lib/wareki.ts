/**
 * Japanese era (和暦) conversion utilities
 */

type EraInfo = {
  name: string
  shortName: string
  startYear: number
}

const ERAS: EraInfo[] = [
  { name: "令和", shortName: "R", startYear: 2019 },
  { name: "平成", shortName: "H", startYear: 1989 },
  { name: "昭和", shortName: "S", startYear: 1926 },
  { name: "大正", shortName: "T", startYear: 1912 },
  { name: "明治", shortName: "M", startYear: 1868 },
]

/**
 * Convert a Date to Japanese era format
 * @example toWareki(new Date(2024, 0, 1)) → "令和6年"
 */
export function toWareki(date: Date): string {
  const year = date.getFullYear()
  for (const era of ERAS) {
    if (year >= era.startYear) {
      const eraYear = year - era.startYear + 1
      return `${era.name}${eraYear === 1 ? "元" : eraYear}年`
    }
  }
  return `${year}年`
}

/**
 * Convert a Date to full Japanese era format with month/day
 * @example toWarekiFull(new Date(2024, 5, 15)) → "令和6年6月15日"
 */
export function toWarekiFull(date: Date): string {
  return `${toWareki(date)}${date.getMonth() + 1}月${date.getDate()}日`
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: Date, referenceDate: Date = new Date()): number {
  let age = referenceDate.getFullYear() - birthDate.getFullYear()
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

/**
 * Get age range string for anonymized Skill Sheet
 * @example getAgeRange(33) → "30代前半"
 */
export function getAgeRange(age: number): string {
  const decade = Math.floor(age / 10) * 10
  const half = age % 10 < 5 ? "前半" : "後半"
  return `${decade}代${half}`
}

/**
 * Get initials for anonymized Skill Sheet
 * @example getInitials("田中", "太郎") → "T.T."
 */
export function getInitials(lastNameRomaji?: string | null, firstNameRomaji?: string | null): string {
  const last = lastNameRomaji?.charAt(0)?.toUpperCase() || "X"
  const first = firstNameRomaji?.charAt(0)?.toUpperCase() || "X"
  return `${last}.${first}.`
}
