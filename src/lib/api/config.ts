/**
 * הגדרות כתובת השרת ומצב הנתונים.
 * כל מה שקשור לסביבה נמצא כאן, ובשום מקום אחר.
 */
type DataMode = 'auto' | 'live' | 'demo'

const raw = (import.meta.env.VITE_DATA_MODE ?? 'auto') as string

export const DATA_MODE: DataMode = raw === 'live' || raw === 'demo' ? raw : 'auto'

/** ריק = אותו origin (ב-dev עובר דרך ה-proxy של Vite). */
export const API_BASE_URL: string = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export const API_PREFIX = '/api'

export const REQUEST_TIMEOUT_MS = 12_000

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${API_PREFIX}${path}`
}
