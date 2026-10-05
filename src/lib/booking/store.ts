import { useSyncExternalStore } from 'react'
import type { ApiError } from '~/lib/api/errors'

export interface Traveler {
  fullName: string
  idNumber: string
  birthDate: string
  phone: string
  emergencyName: string
  emergencyPhone: string
  meal: 'kosher' | 'vegetarian' | 'vegan' | 'gluten-free' | 'regular'
  health: boolean
  terms: boolean
}

export interface Draft {
  flightId: number
  seat?: string
  traveler?: Traveler
}

const KEY = (id: number) => `elal.booking.v1.${id}`
const EXTRAS = 'elal.order-extras.v1'

const cache = new Map<number, Draft>()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function read(id: number): Draft {
  const hit = cache.get(id)
  if (hit) return hit
  let d: Draft = { flightId: id }
  if (typeof window !== 'undefined') {
    try {
      const raw = window.sessionStorage.getItem(KEY(id))
      if (raw) d = JSON.parse(raw) as Draft
    } catch {
      /* ignore */
    }
  }
  cache.set(id, d)
  return d
}

export function updateDraft(id: number, patch: Partial<Draft>) {
  const next = { ...read(id), ...patch, flightId: id }
  cache.set(id, next)
  try {
    window.sessionStorage.setItem(KEY(id), JSON.stringify(next))
  } catch {
    /* ignore */
  }
  emit()
}

export function clearDraft(id: number) {
  cache.delete(id)
  try {
    window.sessionStorage.removeItem(KEY(id))
  } catch {
    /* ignore */
  }
  emit()
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => void listeners.delete(cb)
}

export function useDraft(id: number): Draft {
  return useSyncExternalStore(subscribe, () => read(id), () => ({ flightId: id }))
}

/** מושב והעדפות של הזמנה שהושלמה: נשמרים בדפדפן כי השרת עדיין לא מכיר מושבים */
export interface OrderExtras {
  seat?: string
  meal?: Traveler['meal']
  fullName?: string
}

export function saveOrderExtras(orderId: number, extras: OrderExtras) {
  try {
    const all = JSON.parse(window.localStorage.getItem(EXTRAS) ?? '{}') as Record<string, OrderExtras>
    all[orderId] = extras
    window.localStorage.setItem(EXTRAS, JSON.stringify(all))
  } catch {
    /* ignore */
  }
}

export function loadOrderExtras(orderId: number): OrderExtras | undefined {
  try {
    return (JSON.parse(window.localStorage.getItem(EXTRAS) ?? '{}') as Record<string, OrderExtras>)[orderId]
  } catch {
    return undefined
  }
}

export const MEAL_LABEL: Record<Traveler['meal'], string> = {
  kosher: 'כשרה',
  vegetarian: 'צמחונית',
  vegan: 'טבעונית',
  'gluten-free': 'ללא גלוטן',
  regular: 'רגילה',
}

/**
 * התנגשות בהזמנה (409) חיה מחוץ לרכיב התשלום: אחרי ההתנגשות נתוני הטיסה מתרעננים,
 * ואם המסע אזל מסך המסע החסום היה מחליף את מסך ההסבר וגורם לו להיעלם.
 */
const conflicts = new Map<number, ApiError>()
const conflictSubs = new Set<() => void>()

export function setConflict(flightId: number, err: ApiError | null) {
  if (err) conflicts.set(flightId, err)
  else conflicts.delete(flightId)
  conflictSubs.forEach((l) => l())
}

export function useConflict(flightId: number): ApiError | null {
  return useSyncExternalStore(
    (cb) => {
      conflictSubs.add(cb)
      return () => void conflictSubs.delete(cb)
    },
    () => conflicts.get(flightId) ?? null,
    () => null,
  )
}
