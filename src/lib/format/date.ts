/**
 * כל התאריכים מגיעים מהשרת ב-UTC. מציגים בשעון ישראל, באופן קבוע,
 * כדי שה-SSR וה-Client יפיקו בדיוק את אותו טקסט (בלי אי־התאמת הידרציה).
 */
const TZ = 'Asia/Jerusalem'

export function parseServerDate(value: string): Date {
  // DateTime בלי אזור זמן ב-JSON: השרת עובד ב-UTC, אז מניחים UTC
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value)
  return new Date(hasZone ? value : `${value}Z`)
}

const fmt = {
  date: new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }),
  dateShort: new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short', timeZone: TZ }),
  monthYear: new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric', timeZone: TZ }),
  time: new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }),
  weekday: new Intl.DateTimeFormat('he-IL', { weekday: 'long', timeZone: TZ }),
  hebrew: new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }),
  dateTime: new Intl.DateTimeFormat('he-IL', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ,
  }),
}

export const formatDate = (iso: string) => fmt.date.format(parseServerDate(iso))
export const formatDateShort = (iso: string) => fmt.dateShort.format(parseServerDate(iso))
export const formatMonthYear = (iso: string) => fmt.monthYear.format(parseServerDate(iso))
export const formatTime = (iso: string) => fmt.time.format(parseServerDate(iso))
export const formatWeekday = (iso: string) => fmt.weekday.format(parseServerDate(iso))
export const formatHebrewDate = (iso: string) => fmt.hebrew.format(parseServerDate(iso))
export const formatDateTime = (iso: string) => fmt.dateTime.format(parseServerDate(iso))

/** "2027-04" לשימוש בסינון לפי חודש */
export function monthKey(iso: string): string {
  const d = parseServerDate(iso)
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: TZ }).formatToParts(d)
  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  return `${y}-${m}`
}

export function monthKeyLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return fmt.monthYear.format(new Date(Date.UTC(y, m - 1, 15)))
}
