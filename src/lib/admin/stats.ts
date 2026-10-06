import type { AdminOrder, AdminPassenger, Flight } from '~/lib/api/types'
import { destinationFor } from '~/lib/content/generic'
import { hasDeparted, isScheduled } from '~/lib/flights'
import { parseServerDate } from '~/lib/format/date'

export type FlightPhase = 'upcoming' | 'departed' | 'cancelled' | 'completed'

export const isConfirmed = (o: AdminOrder) => o.status === 'Confirmed'

export function phaseOf(f: Flight): FlightPhase {
  if (f.flightStatus === 'Cancelled') return 'cancelled'
  if (f.flightStatus === 'Completed') return 'completed'
  return hasDeparted(f) ? 'departed' : 'upcoming'
}

export const PHASE_LABEL: Record<FlightPhase, string> = {
  upcoming: 'מתוכנן',
  departed: 'יצא לדרך',
  cancelled: 'בוטל',
  completed: 'הושלם',
}

export interface FlightRow {
  flight: Flight
  phase: FlightPhase
  /** הזמנות מאושרות דרך האתר */
  orders: AdminOrder[]
  /** מושבים תפוסים לפי השרת: המספר הקובע */
  booked: number
  /** מושבים תפוסים שאין מאחוריהם הזמנה באתר */
  offline: number
  /** 0..1 */
  occupancy: number
  revenue: number
}

export interface CustomerRow {
  passenger: AdminPassenger
  orders: AdminOrder[]
  active: AdminOrder[]
  next?: AdminOrder
  spent: number
}

const depTime = (f: Flight) => parseServerDate(f.departureTime).getTime()

export function buildFlightRows(flights: Flight[], orders: AdminOrder[]): FlightRow[] {
  const byFlight = new Map<number, AdminOrder[]>()
  for (const o of orders) {
    if (!isConfirmed(o) || !o.flight) continue
    const list = byFlight.get(o.flight.id) ?? []
    list.push(o)
    byFlight.set(o.flight.id, list)
  }
  return flights.map((flight) => {
    const own = byFlight.get(flight.id) ?? []
    const seats = Math.max(0, flight.numOfSeats)
    // מסע שבוטל: השרת מבטל את ההזמנות, ולכן אין בו נוסעים גם אם מונה המושבים לא התאפס
    const booked = flight.flightStatus === 'Cancelled' ? own.length : Math.max(own.length, Math.min(seats, seats - flight.availableSeats))
    return {
      flight,
      phase: phaseOf(flight),
      orders: own,
      booked,
      offline: Math.max(0, booked - own.length),
      occupancy: seats > 0 ? Math.min(1, booked / seats) : 0,
      revenue: own.length * flight.price,
    }
  })
}

export function buildCustomerRows(passengers: AdminPassenger[], orders: AdminOrder[], now = Date.now()): CustomerRow[] {
  const byPassenger = new Map<number, AdminOrder[]>()
  for (const o of orders) {
    if (!o.passenger) continue
    const list = byPassenger.get(o.passenger.id) ?? []
    list.push(o)
    byPassenger.set(o.passenger.id, list)
  }
  return passengers.map((passenger) => {
    const own = [...(byPassenger.get(passenger.id) ?? [])].sort((a, b) => depTime(a.flight) - depTime(b.flight))
    const active = own.filter(isConfirmed)
    return {
      passenger,
      orders: own,
      active,
      next: active.find((o) => isScheduled(o.flight) && depTime(o.flight) > now),
      spent: active.reduce((sum, o) => sum + o.flight.price, 0),
    }
  })
}

export interface Overview {
  customers: number
  upcomingFlights: number
  /** נוסעים רשומים במסעות שעוד לא יצאו */
  travelers: number
  /** 0..1, על פני המסעות שעוד לא יצאו */
  occupancy: number
  revenue: number
  soldOut: number
}

export function buildOverview(rows: FlightRow[], customers: number): Overview {
  const upcoming = rows.filter((r) => r.phase === 'upcoming')
  const seats = upcoming.reduce((s, r) => s + r.flight.numOfSeats, 0)
  const travelers = upcoming.reduce((s, r) => s + r.booked, 0)
  return {
    customers,
    upcomingFlights: upcoming.length,
    travelers,
    occupancy: seats > 0 ? travelers / seats : 0,
    revenue: rows.reduce((s, r) => s + r.revenue, 0),
    soldOut: upcoming.filter((r) => r.flight.availableSeats <= 0).length,
  }
}

export interface DestinationLoad {
  name: string
  planet: ReturnType<typeof destinationFor>['planet']
  flights: number
  booked: number
  seats: number
  occupancy: number
}

/** תפוסה לפי יעד, במסעות שעוד לא יצאו */
export function buildDestinationLoad(rows: FlightRow[]): DestinationLoad[] {
  const map = new Map<string, DestinationLoad>()
  for (const r of rows) {
    if (r.phase !== 'upcoming') continue
    const d = destinationFor(r.flight.arrivalAirport)
    const cur = map.get(d.name) ?? { name: d.name, planet: d.planet, flights: 0, booked: 0, seats: 0, occupancy: 0 }
    cur.flights += 1
    cur.booked += r.booked
    cur.seats += r.flight.numOfSeats
    cur.occupancy = cur.seats > 0 ? cur.booked / cur.seats : 0
    map.set(d.name, cur)
  }
  return [...map.values()].sort((a, b) => b.booked - a.booked)
}

export const matches = (query: string, ...fields: Array<string | number | undefined | null>) => {
  const q = query.trim().toLowerCase()
  return !q || fields.some((f) => String(f ?? '').toLowerCase().includes(q))
}
