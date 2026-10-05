import { queryOptions } from '@tanstack/react-query'
import { fetchFlight, fetchFlights, fetchMyOrders } from './endpoints'

export const qk = {
  flights: (authed: boolean) => ['flights', { authed }] as const,
  flight: (id: number, authed: boolean) => ['flight', id, { authed }] as const,
  myOrders: (userId: number | null) => ['orders', 'my', userId] as const,
}

export const flightsQuery = (authed: boolean) =>
  queryOptions({
    queryKey: qk.flights(authed),
    queryFn: ({ signal }) => fetchFlights(signal),
    staleTime: 30_000,
    retry: (count, err) => count < 1 && !(err as { status?: number }).status,
  })

export const flightQuery = (id: number, authed: boolean) =>
  queryOptions({
    queryKey: qk.flight(id, authed),
    queryFn: ({ signal }) => fetchFlight(id, signal),
    // לפני הזמנה חשוב לראות מצב עדכני של המושבים
    staleTime: 5_000,
    refetchOnWindowFocus: true,
    retry: (count, err) => count < 1 && !(err as { status?: number }).status,
  })

export const myOrdersQuery = (userId: number | null) =>
  queryOptions({
    queryKey: qk.myOrders(userId),
    queryFn: ({ signal }) => fetchMyOrders(signal),
    enabled: userId !== null,
    staleTime: 10_000,
  })
