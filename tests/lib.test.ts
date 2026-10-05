import { describe, expect, it } from 'vitest'
import { luhn, paymentSchema } from '~/lib/booking/validation'
import { buildCabin } from '~/lib/booking/seats'
import { ApiError, parseErrorResponse } from '~/lib/api/errors'
import { classifyConflict } from '~/components/booking/ConflictView'
import { resolveDestination } from '~/lib/content/destinations'
import { formatDuration } from '~/lib/format/duration'
import { formatDistance } from '~/lib/format/money'
import { parseServerDate } from '~/lib/format/date'

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
