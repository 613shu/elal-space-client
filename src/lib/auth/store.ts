import { useSyncExternalStore } from 'react'
import type { LoginResult } from '~/lib/api/types'
import { decodeJwtExp } from './jwt'

export interface Session {
  token: string
  profile: LoginResult
  /** מילישניות; null אם לא ניתן לקרוא */
  expiresAt: number | null
}

const KEY = 'elal.session.v1'

/** למה הסשן האחרון הסתיים: התנתקות יזומה, או שפג תוקף / השרת דחה את האסימון */
export type SessionEnd = 'logout' | 'expired'

let session: Session | null = null
let lastEnd: { reason: SessionEnd; at: number } | null = null
let hydrated = false
let expiryTimer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function scheduleExpiry() {
  if (expiryTimer) clearTimeout(expiryTimer)
  if (!session?.expiresAt) return
  const ms = session.expiresAt - Date.now()
  if (ms <= 0) return void clearSession()
  // setTimeout מוגבל ל-~24.8 ימים; הטוקן חי שעה, אבל נגן בכל זאת
  expiryTimer = setTimeout(() => clearSession(), Math.min(ms, 2 ** 31 - 1))
}

function hydrate() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Session
    if (parsed.expiresAt && parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem(KEY)
      return
    }
    session = parsed
    scheduleExpiry()
  } catch {
    /* אחסון חסום או פגום: ממשיכים כאורח */
  }
}

export function setSession(token: string, profile: LoginResult) {
  session = { token, profile, expiresAt: decodeJwtExp(token) }
  lastEnd = null
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    /* ignore */
  }
  scheduleExpiry()
  emit()
}

export function clearSession(reason: SessionEnd = 'expired') {
  if (session) lastEnd = { reason, at: Date.now() }
  session = null
  if (expiryTimer) clearTimeout(expiryTimer)
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  emit()
}

export function getSession(): Session | null {
  hydrate()
  return session
}

/** הסיבה שבגללה הסשן הסתיים, אם זה קרה ממש עכשיו (בשניות האחרונות); אחרת null */
export function getRecentSessionEnd(withinMs = 3000): SessionEnd | null {
  return lastEnd && Date.now() - lastEnd.at <= withinMs ? lastEnd.reason : null
}

export function getToken(): string | null {
  return getSession()?.token ?? null
}

function subscribe(cb: () => void) {
  hydrate()
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return
    // התנתקות בלשונית אחרת: גם כאן זו התנתקות יזומה, לא תקלה
    if (session && !e.newValue) lastEnd = { reason: 'logout', at: Date.now() }
    session = e.newValue ? (JSON.parse(e.newValue) as Session) : null
    scheduleExpiry()
    emit()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

/** בשרת (SSR) תמיד null, כך שאין אי־התאמה בהידרציה. */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, () => null)
}

export function useIsAuthed() {
  return useSession() !== null
}

export const isAdminProfile = (s: Session | null) => s?.profile.role === 'Admin'

export function useIsAdmin() {
  return isAdminProfile(useSession())
}
