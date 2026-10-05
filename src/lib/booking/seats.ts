import type { Flight } from '~/lib/api/types'

export type SeatSide = 'earth' | 'destination'

export interface Seat {
  id: string
  row: number
  col: 'A' | 'B' | 'C' | 'D'
  /** A,B פונים אל כדור הארץ בתחילת המסע; C,D אל היעד */
  side: SeatSide
  taken: boolean
}

export interface Cabin {
  rows: Array<{ row: number; seats: Array<Seat | null> }>
  seats: Seat[]
}

const COLS = ['A', 'B', 'C', 'D'] as const

function rng(seed: number) {
  let a = seed >>> 0 || 1
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * מפת תא הנוסעים. השרת מכיר רק מונה מושבים (numOfSeats / availableSeats),
 * ולכן מפת המושבים נגזרת ממנו באופן יציב: אותה טיסה תיראה תמיד אותו דבר,
 * ומספר המושבים התפוסים תמיד תואם את מה שהשרת מדווח.
 */
export function buildCabin(flight: Pick<Flight, 'id' | 'numOfSeats' | 'availableSeats'>): Cabin {
  const total = Math.max(0, flight.numOfSeats)
  const takenCount = Math.min(total, Math.max(0, total - flight.availableSeats))
  const random = rng(flight.id * 2654435761)

  const ids: number[] = Array.from({ length: total }, (_, i) => i)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }
  const takenSet = new Set(ids.slice(0, takenCount))

  const rows: Cabin['rows'] = []
  const seats: Seat[] = []
  const rowCount = Math.ceil(total / 4)
  for (let r = 0; r < rowCount; r++) {
    const row: Array<Seat | null> = []
    for (let c = 0; c < 4; c++) {
      const idx = r * 4 + c
      if (idx >= total) {
        row.push(null)
        continue
      }
      const col = COLS[c]
      const seat: Seat = { id: `${r + 1}${col}`, row: r + 1, col, side: c < 2 ? 'earth' : 'destination', taken: takenSet.has(idx) }
      row.push(seat)
      seats.push(seat)
    }
    rows.push({ row: r + 1, seats: row })
  }
  return { rows, seats }
}

export const sideLabel = (s: SeatSide) => (s === 'earth' ? 'מבט אל כדור הארץ' : 'מבט אל היעד')
