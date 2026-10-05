import type { Flight } from '~/lib/api/types'
import { resolveDestination } from '~/lib/content/destinations'
import { parseServerDate } from '~/lib/format/date'

export const LAST_SEATS_THRESHOLD = 5

export const isScheduled = (f: Flight) => f.flightStatus === 'Scheduled'
export const hasDeparted = (f: Flight) => parseServerDate(f.departureTime).getTime() <= Date.now()
export const isSoldOut = (f: Flight) => f.availableSeats <= 0
export const isBookable = (f: Flight) => isScheduled(f) && !hasDeparted(f) && !isSoldOut(f)
export const isLastSeats = (f: Flight) => f.availableSeats > 0 && f.availableSeats <= LAST_SEATS_THRESHOLD

export const destinationOf = (f: Flight) => resolveDestination(f.arrivalAirport)

export function seatsLabel(f: Flight): string {
  if (isSoldOut(f)) return 'אזלו המקומות'
  if (isLastSeats(f)) return f.availableSeats === 1 ? 'נותר מקום אחרון' : 'נותרו מקומות אחרונים'
  return `${f.availableSeats} מקומות`
}

export function amenityNames(f: Flight): string[] {
  return (f.amenities ?? []).map((a) => a.name)
}

export function sortByDeparture(a: Flight, b: Flight) {
  return parseServerDate(a.departureTime).getTime() - parseServerDate(b.departureTime).getTime()
}
