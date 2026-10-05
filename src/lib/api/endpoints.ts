import { http } from './client'
import { DATA_MODE } from './config'
import {
  DEMO_FLIGHTS,
  DEMO_PROFILE,
  DEMO_RACE_FLIGHT_IDS,
  loadDemoOrders,
  saveDemoOrders,
} from './demo-data'
import { ApiError, type ErrorKind, isApiError } from './errors'
import type {
  AuthResponse,
  Flight,
  LoginRequest,
  Order,
  Paged,
  RegisterRequest,
} from './types'
import { getSession } from '~/lib/auth/store'

export type DataSource = 'live' | 'demo'

export interface FlightsResult {
  flights: Flight[]
  source: DataSource
  /** למה עברנו להדגמה (רק כש-source = demo ומצב auto) */
  reason?: ErrorKind
}

export const DEMO_TOKEN = 'demo-token'
export const isDemoSession = () => getSession()?.token === DEMO_TOKEN

const PAGE_SIZE = 50

async function getAllPages<T>(path: string, signal?: AbortSignal): Promise<T[]> {
  const all: T[] = []
  for (let page = 1; page <= 20; page++) {
    const res = await http.get<Paged<T>>(path, { query: { page, pageSize: PAGE_SIZE }, signal })
    all.push(...res.items)
    if (all.length >= res.totalCount || res.items.length === 0) break
  }
  return all
}

/** שגיאות שבהן הגיוני לעבור לנתוני הדגמה במצב auto */
const FALLBACK_KINDS: ErrorKind[] = ['network', 'unauthorized', 'forbidden', 'server']

function demoTaken(flightId: number): number {
  return loadDemoOrders().filter((o) => o.flight.id === flightId && o.status === 'Confirmed').length
}

function demoFlights(): Flight[] {
  return DEMO_FLIGHTS.map((f) => ({ ...f, availableSeats: Math.max(0, f.availableSeats - demoTaken(f.id)) }))
}

/* ------------------------------ טיסות ------------------------------ */

export async function fetchFlights(signal?: AbortSignal): Promise<FlightsResult> {
  if (DATA_MODE === 'demo') return { flights: demoFlights(), source: 'demo' }
  try {
    const flights = await getAllPages<Flight>('/flights', signal)
    return { flights, source: 'live' }
  } catch (e) {
    if (DATA_MODE === 'auto' && isApiError(e) && FALLBACK_KINDS.includes(e.kind)) {
      return { flights: demoFlights(), source: 'demo', reason: e.kind }
    }
    throw e
  }
}

export async function fetchFlight(id: number, signal?: AbortSignal): Promise<{ flight: Flight; source: DataSource; reason?: ErrorKind }> {
  const fromDemo = () => {
    const f = demoFlights().find((x) => x.id === id)
    if (!f) throw new ApiError({ status: 404, message: 'לא מצאנו את הטיסה שביקשתם.' })
    return f
  }
  if (DATA_MODE === 'demo') return { flight: fromDemo(), source: 'demo' }
  try {
    const flight = await http.get<Flight>(`/flights/${id}`, { signal })
    return { flight, source: 'live' }
  } catch (e) {
    if (DATA_MODE === 'auto' && isApiError(e) && FALLBACK_KINDS.includes(e.kind)) {
      return { flight: fromDemo(), source: 'demo', reason: e.kind }
    }
    throw e
  }
}

/* ------------------------------ התחברות ------------------------------ */

export async function login(req: LoginRequest): Promise<AuthResponse> {
  if (DATA_MODE === 'demo') return demoAuth(req.email)
  return http.post<AuthResponse>('/auth/login', req, { auth: false })
}

export async function register(req: RegisterRequest): Promise<AuthResponse> {
  if (DATA_MODE === 'demo') return demoAuth(req.email, req.name)
  return http.post<AuthResponse>('/auth/register', req, { auth: false })
}

export function demoAuth(email?: string, name?: string): AuthResponse {
  const display = name?.trim() || DEMO_PROFILE.name
  return {
    token: DEMO_TOKEN,
    profile: {
      ...DEMO_PROFILE,
      name: display,
      email: email?.trim() || DEMO_PROFILE.email,
      passengerProfile: { ...DEMO_PROFILE.passengerProfile!, name: display, email: email?.trim() || DEMO_PROFILE.email },
    },
  }
}

/* ------------------------------ הזמנות ------------------------------ */

export async function fetchMyOrders(signal?: AbortSignal): Promise<{ orders: Order[]; source: DataSource }> {
  if (isDemoSession()) return { orders: loadDemoOrders(), source: 'demo' }
  const orders = await getAllPages<Order>('/orders/my', signal)
  return { orders, source: 'live' }
}

let demoRaceUsed = new Set<number>()

export async function createOrder(flight: Flight): Promise<Order> {
  if (flight.isDemo || isDemoSession()) {
    await new Promise((r) => setTimeout(r, 900))
    if (DEMO_RACE_FLIGHT_IDS.has(flight.id) && !demoRaceUsed.has(flight.id)) {
      demoRaceUsed = new Set(demoRaceUsed).add(flight.id)
      throw new ApiError({
        status: 409,
        message: 'המצב השתנה מרגע שהתחלתם. רעננו ונסו שוב.',
        serverMessage: 'No seats available',
        correlationId: 'demo-' + Math.random().toString(16).slice(2, 10),
      })
    }
    const orders = loadDemoOrders()
    if (orders.some((o) => o.flight.id === flight.id && o.status === 'Confirmed')) {
      throw new ApiError({ status: 409, message: 'המצב השתנה מרגע שהתחלתם. רעננו ונסו שוב.', serverMessage: 'Passenger already has an active order for this flight' })
    }
    const order: Order = {
      id: 9000 + orders.length + 1,
      flight: { ...flight, availableSeats: Math.max(0, flight.availableSeats - 1) },
      orderDateTime: new Date().toISOString(),
      status: 'Confirmed',
    }
    saveDemoOrders([order, ...orders])
    return order
  }
  return http.post<Order>('/orders', { flightId: flight.id })
}

export async function cancelOrder(order: Order): Promise<void> {
  if (order.flight.isDemo || isDemoSession()) {
    saveDemoOrders(loadDemoOrders().map((o) => (o.id === order.id ? { ...o, status: 'Cancelled' } : o)))
    return
  }
  await http.del(`/orders/${order.id}`)
}
