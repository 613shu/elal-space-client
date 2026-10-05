import { parseServerDate } from './date'

const DAY = 86_400_000

export function durationMs(depIso: string, arrIso: string): number {
  return Math.max(0, parseServerDate(arrIso).getTime() - parseServerDate(depIso).getTime())
}

/** 3 ימים · 7 חודשים · 18 שעות */
export function formatDuration(ms: number): string {
  const days = ms / DAY
  if (days >= 60) {
    const months = Math.round(days / 30.44)
    return months === 1 ? 'חודש' : `${months} חודשים`
  }
  if (days >= 1.5) {
    const d = Math.round(days)
    return d === 1 ? 'יום' : d === 2 ? 'יומיים' : `${d} ימים`
  }
  const hours = Math.max(1, Math.round(ms / 3_600_000))
  return hours === 1 ? 'שעה' : `${hours} שעות`
}

export function formatDurationBetween(depIso: string, arrIso: string) {
  return formatDuration(durationMs(depIso, arrIso))
}

/** שניות -> "1.3 שניות" / "12 דקות" / "מעל שעה" */
export function formatSignalDelay(seconds: number): string {
  if (seconds < 0.01) return 'פחות מאלפית שנייה'
  if (seconds < 60) return `${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)} שניות`
  const m = seconds / 60
  if (m < 90) return `${Math.round(m)} דקות`
  return `${(m / 60).toFixed(1)} שעות`
}
