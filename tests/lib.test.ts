import { describe, expect, it } from 'vitest'
import { luhn, paymentSchema } from '~/lib/booking/validation'
import { buildCabin } from '~/lib/booking/seats'
import { ApiError, parseErrorResponse } from '~/lib/api/errors'
import { classifyConflict } from '~/components/booking/ConflictView'
import { resolveDestination } from '~/lib/content/destinations'
import { formatDuration } from '~/lib/format/duration'
import { formatDistance } from '~/lib/format/money'
import { parseServerDate } from '~/lib/format/date'
import { buildCustomerRows, buildFlightRows, buildOverview } from '~/lib/admin/stats'
import type { AdminOrder, Flight } from '~/lib/api/types'

describe('luhn', () => {
  it('מאשר מספר כרטיס תקין ודוחה שגוי', () => {
    expect(luhn('4242 4242 4242 4242')).toBe(true)
    expect(luhn('4242 4242 4242 4241')).toBe(false)
    expect(luhn('1234')).toBe(false)
  })
  it('סכמת התשלום דוחה כרטיס לא תקין', () => {
    const bad = paymentSchema.safeParse({ cardNumber: '4242424242424241', cardName: 'A B', expiry: '12/30', cvc: '123' })
    expect(bad.success).toBe(false)
  })
})

describe('buildCabin', () => {
  it.each([
    { id: 1, numOfSeats: 12, availableSeats: 12 },
    { id: 2, numOfSeats: 12, availableSeats: 5 },
    { id: 4, numOfSeats: 8, availableSeats: 1 },
    { id: 9, numOfSeats: 20, availableSeats: 0 },
  ])('מספר המושבים הפנויים תואם את השרת %o', (f) => {
    const c = buildCabin(f)
    expect(c.seats.length).toBe(f.numOfSeats)
    expect(c.seats.filter((s) => !s.taken).length).toBe(f.availableSeats)
  })
  it('יציבה: אותה טיסה, אותה מפה', () => {
    const f = { id: 7, numOfSeats: 12, availableSeats: 6 }
    expect(buildCabin(f).seats.map((s) => s.taken)).toEqual(buildCabin(f).seats.map((s) => s.taken))
  })
})

describe('ApiError', () => {
  it('ממפה סטטוס לסוג', () => {
    expect(new ApiError({ status: 409, message: 'x' }).kind).toBe('conflict')
    expect(new ApiError({ status: 401, message: 'x' }).kind).toBe('unauthorized')
    expect(new ApiError({ status: 0, message: 'x' }).kind).toBe('network')
    expect(new ApiError({ status: 503, message: 'x' }).kind).toBe('server')
  })
  it('מפענח את גוף השגיאה של ה-middleware בשרת', async () => {
    const res = new Response(JSON.stringify({ statusCode: 409, message: 'No seats available', correlationId: 'abc' }), {
      status: 409,
      headers: { 'content-type': 'application/json' },
    })
    const e = await parseErrorResponse(res)
    expect(e.kind).toBe('conflict')
    expect(e.serverMessage).toBe('No seats available')
    expect(e.correlationId).toBe('abc')
  })
})

describe('classifyConflict', () => {
  const mk = (m: string) => new ApiError({ status: 409, message: 'x', serverMessage: m })
  it('מזהה את סוג ההתנגשות', () => {
    expect(classifyConflict(mk('No seats available on this flight'))).toBe('seats')
    expect(classifyConflict(mk('You already have an active order'))).toBe('duplicate')
    expect(classifyConflict(mk('Flight was cancelled'))).toBe('unavailable')
    expect(classifyConflict(mk('weird'))).toBe('changed')
  })
})

describe('resolveDestination', () => {
  it('מתאים שם עברי, אנגלי ומשתנה כתיב', () => {
    expect(resolveDestination('הירח')?.slug).toBe('moon')
    expect(resolveDestination('Mars')?.slug).toBe('mars')
    expect(resolveDestination('')).toBeUndefined()
    expect(resolveDestination('Betelgeuse-9')).toBeUndefined()
  })
})

describe('פורמט', () => {
  it('משך', () => {
    expect(formatDuration(3 * 86_400_000)).toBe('3 ימים')
    expect(formatDuration(4 * 3_600_000)).toBe('4 שעות')
    expect(formatDuration(18 * 30.44 * 86_400_000)).toBe('18 חודשים')
  })
  it('מרחק בעברית', () => {
    expect(formatDistance(384_400)).toBe('384 אלף')
    expect(formatDistance(78_000_000)).toBe('78 מיליון')
  })
  it('תאריך ללא אזור זמן נחשב UTC', () => {
    expect(parseServerDate('2027-04-18T06:30:00').toISOString()).toBe('2027-04-18T06:30:00.000Z')
  })
})

describe('נתוני ממשק הניהול', () => {
  const flight = (id: number, over: Partial<Flight> = {}): Flight => ({
    id, flightNumber: `ES ${id}`, departureAirport: 'תל אביב', arrivalAirport: 'הירח',
    departureTime: '2099-01-01T06:00:00Z', arrivalTime: '2099-01-04T06:00:00Z',
    numOfSeats: 10, availableSeats: 10, amenities: [], flightStatus: 'Scheduled', price: 1000, ...over,
  })
  const order = (id: number, f: Flight, passengerId: number, status = 'Confirmed'): AdminOrder => ({
    id, flight: f, status, orderDateTime: '2026-10-01T10:00:00Z', passenger: { id: passengerId, name: `נוסע ${passengerId}`, email: `p${passengerId}@x.il` },
  })

  it('סופר נוסעים לפי מונה המושבים, ומפריד מושבים בלי הזמנה באתר', () => {
    const f = flight(1, { availableSeats: 6 })
    const [row] = buildFlightRows([f], [order(1, f, 1), order(2, f, 2), order(3, f, 3, 'Cancelled')])
    expect(row.booked).toBe(4)
    expect(row.orders).toHaveLength(2)
    expect(row.offline).toBe(2)
    expect(row.occupancy).toBeCloseTo(0.4)
    expect(row.revenue).toBe(2000)
  })

  it('מסע שבוטל לא נספר במסעות המתוכננים', () => {
    const rows = buildFlightRows([flight(1, { availableSeats: 5 }), flight(2, { flightStatus: 'Cancelled', availableSeats: 3 })], [])
    const o = buildOverview(rows, 7)
    expect(o.upcomingFlights).toBe(1)
    expect(o.travelers).toBe(5)
    expect(o.customers).toBe(7)
    expect(rows[1].booked).toBe(0)
  })

  it('מחשב לכל לקוח הזמנות פעילות, סכום והמסע הקרוב', () => {
    const near = flight(1, { departureTime: '2099-01-01T06:00:00Z' })
    const far = flight(2, { departureTime: '2099-06-01T06:00:00Z', price: 500 })
    const rows = buildCustomerRows(
      [{ id: 1, name: 'א', email: 'a@x.il' }, { id: 2, name: 'ב', email: 'b@x.il' }],
      [order(1, far, 1), order(2, near, 1), order(3, near, 2, 'Cancelled')],
    )
    expect(rows[0].active).toHaveLength(2)
    expect(rows[0].next?.flight.id).toBe(1)
    expect(rows[0].spent).toBe(1500)
    expect(rows[1].active).toHaveLength(0)
    expect(rows[1].next).toBeUndefined()
  })
})
