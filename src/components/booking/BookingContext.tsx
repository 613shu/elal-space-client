import { createContext, useContext } from 'react'
import type { Flight } from '~/lib/api/types'
import type { DataSource } from '~/lib/api/endpoints'

export interface BookingCtx {
  flight: Flight
  source: DataSource
  refetch: () => Promise<unknown>
  refetching: boolean
}

export const BookingContext = createContext<BookingCtx | null>(null)

export function useBooking(): BookingCtx {
  const v = useContext(BookingContext)
  if (!v) throw new Error('useBooking must be used inside the booking layout')
  return v
}
