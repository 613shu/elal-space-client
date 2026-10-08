/**
 * שרת מדומה שמחקה את חוזה ה-API של שרת ה-C# (ElAlProject): אותם נתיבים, אותם צורות JSON,
 * אותם קודי סטטוס (401/403/404/409) ואותה עטיפת עימוד { items, totalCount }.
 * מיועד לפיתוח ולבדיקות של הלקוח כשהשרת האמיתי לא רץ.  הרצה:  node scripts/mock-server.mjs
 *
 * משתמשים: passenger@example.com / Passw0rd!   ו-   admin@example.com / Passw0rd!
 * נתיבי מנהל: GET /api/orders, GET /api/passengers, GET /api/amenities, POST/PUT/DELETE /api/flights, DELETE /api/passengers/:id
 * נתיבי נוסע: GET /api/passengers/me, GET /api/orders/my. ציבורי: GET /api/flights/available
 * בדיקת תחרות: POST /__mock/take-last-seat/<flightId>  (נוסע אחר "גונב" את המושב האחרון)
 */
import http from 'node:http'
import crypto from 'node:crypto'

const PORT = Number(process.env.MOCK_PORT ?? 5254)
const SECRET = 'mock-secret-key-that-is-long-enough-for-hs256'
const AUTH_REQUIRED_FOR_FLIGHTS = process.env.MOCK_PUBLIC_FLIGHTS !== '1'

const amenities = [
  { id: 1, name: 'חלון פרטי' },
  { id: 2, name: 'כבידה מדומה' },
  { id: 3, name: 'ארוחות שף' },
  { id: 4, name: 'ציוד אישי כלול' },
  { id: 5, name: 'הכשרה לפני ההמראה' },
  { id: 6, name: 'סלון משותף' },
]

const mk = (id, n, from, to, dep, arr, seats, avail, price, am) => ({
  id, flightNumber: n, departureAirport: from, arrivalAirport: to, departureTime: dep, arrivalTime: arr,
  numOfSeats: seats, availableSeats: avail, passengers: [], amenities: am.map((i) => amenities[i - 1]),
  flightStatus: 'Scheduled', price,
})

const flights = [
  mk(1, 'ES 001', 'תל אביב', 'הירח', '2027-04-18T06:30:00Z', '2027-04-21T16:10:00Z', 24, 12, 184000, [1, 2, 3, 4, 5]),
  mk(2, 'ES 002', 'תל אביב', 'הירח', '2027-05-09T07:00:00Z', '2027-05-12T15:00:00Z', 24, 20, 192000, [1, 2, 3, 4, 5]),
  mk(3, 'ES 204', 'תל אביב', 'מאדים', '2027-06-03T21:00:00Z', '2028-01-05T08:40:00Z', 20, 7, 780000, [1, 2, 3, 4, 5, 6]),
  mk(4, 'ES 316', 'מסלול הירח', 'שבתאי', '2027-09-12T11:45:00Z', '2029-03-14T05:20:00Z', 12, 1, 1260000, [1, 2, 3, 4, 5, 6]),
  mk(5, 'ES 400', 'תל אביב', 'תחנת המסלול', '2027-03-05T07:00:00Z', '2027-03-05T10:30:00Z', 8, 0, 96000, [1, 3, 4]),
  { ...mk(6, 'ES 099', 'תל אביב', 'הירח', '2027-02-01T07:00:00Z', '2027-02-04T07:00:00Z', 10, 5, 170000, [1]), flightStatus: 'Cancelled' },
]

const users = [
  { id: 1, name: 'ישי כהן', email: 'passenger@example.com', password: 'Passw0rd!', role: 'Passenger' },
  { id: 2, name: 'מנהלת מערכת', email: 'admin@example.com', password: 'Passw0rd!', role: 'Admin' },
]
users.push(
  { id: 3, name: 'נועה לוי', email: 'noa@example.com', password: 'Passw0rd!', role: 'Passenger' },
  { id: 4, name: 'אברהם פרידמן', email: 'avraham@example.com', password: 'Passw0rd!', role: 'Passenger' },
  { id: 5, name: 'רחל שטרן', email: 'rachel@example.com', password: 'Passw0rd!', role: 'Passenger' },
  { id: 6, name: 'משה גולדברג', email: 'moshe@example.com', password: 'Passw0rd!', role: 'Passenger', isActive: false },
)
// הזמנות התחלתיות, כדי שלממשק המנהל יהיה מה להציג (המושבים שלהן כבר מנוכים מ-availableSeats)
const orders = [
  { id: 91, flightId: 1, passengerId: 3, orderDateTime: '2026-09-28T09:12:00Z', status: 'Confirmed' },
  { id: 92, flightId: 1, passengerId: 4, orderDateTime: '2026-09-30T18:40:00Z', status: 'Confirmed' },
  { id: 93, flightId: 3, passengerId: 3, orderDateTime: '2026-10-01T07:05:00Z', status: 'Confirmed' },
  { id: 94, flightId: 4, passengerId: 5, orderDateTime: '2026-10-02T12:30:00Z', status: 'Confirmed' },
  { id: 95, flightId: 2, passengerId: 5, orderDateTime: '2026-10-03T15:00:00Z', status: 'Cancelled' },
  { id: 96, flightId: 5, passengerId: 4, orderDateTime: '2026-10-04T08:20:00Z', status: 'Confirmed' },
]
let orderSeq = 100

const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url')
function sign(payload) {
  const h = b64({ alg: 'HS256', typ: 'JWT' })
  const p = b64(payload)
  const s = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')
  return `${h}.${p}.${s}`
}
function verify(token) {
  const [h, p, s] = (token ?? '').split('.')
  if (!s) return null
  const ok = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url') === s
  if (!ok) return null
  const pl = JSON.parse(Buffer.from(p, 'base64url').toString())
  return pl.exp * 1000 > Date.now() ? pl : null
}
const profileOf = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role,
  adminProfile: u.role === 'Admin' ? { id: u.id, name: u.name, email: u.email, isActive: true } : null,
  passengerProfile: u.role === 'Passenger' ? { id: u.id, name: u.name, email: u.email, isActive: true } : null,
})
const tokenFor = (u) => sign({ nameid: String(u.id), name: u.name, email: u.email, role: u.role, exp: Math.floor(Date.now() / 1000) + 3600 })

const cid = () => crypto.randomUUID()
const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'Content-Type': type, 'X-Correlation-ID': cid() })
  res.end(body === undefined ? '' : type === 'application/json' ? JSON.stringify(body) : body)
}
const err = (res, status, message) => send(res, status, { statusCode: status, message, correlationId: cid() })
const page = (arr, url) => {
  const p = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const s = Math.max(1, Number(url.searchParams.get('pageSize') ?? 10))
  return { items: arr.slice((p - 1) * s, p * s), totalCount: arr.length }
}
const body = (req) => new Promise((resolve) => {
  let d = ''
  req.on('data', (c) => (d += c))
  req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}) } catch { resolve(null) } })
})
const orderDto = (o) => ({ id: o.id, flight: flights.find((f) => f.id === o.flightId), orderDateTime: o.orderDateTime, status: o.status })
const passengerDto = (u) => ({ id: u.id, name: u.name, email: u.email, flights: [] })
const adminOrderDto = (o) => ({ ...orderDto(o), passenger: passengerDto(users.find((u) => u.id === o.passengerId)) })

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname
  const method = req.method
  const auth = verify((req.headers.authorization ?? '').replace(/^Bearer /, ''))
  const needAuth = (roles) => {
    if (!auth) { res.writeHead(401, { 'WWW-Authenticate': 'Bearer' }); res.end(); return false }
    if (roles && !roles.includes(auth.role)) { res.writeHead(403); res.end(); return false }
    return true
  }
  console.log(method, path, auth ? `(${auth.role})` : '')

  try {
    if (path === '/api/auth/login' && method === 'POST') {
      const b = await body(req)
      const u = users.find((x) => x.email.toLowerCase() === String(b?.email ?? '').toLowerCase() && x.password === b?.password && x.isActive !== false)
      if (!u) return send(res, 401, 'Email or password is incorrect.', 'text/plain; charset=utf-8')
      return send(res, 200, { token: tokenFor(u), profile: profileOf(u) })
    }
    if (path === '/api/auth/register' && method === 'POST') {
      const b = await body(req)
      const errors = {}
      if (!b?.name) errors.Name = ['The Name field is required.']
      if (!/^\S+@\S+\.\S+$/.test(b?.email ?? '')) errors.Email = ['The Email field is not a valid e-mail address.']
      if (String(b?.password ?? '').length < 6) errors.Password = ["The field Password must be a string or array type with a minimum length of '6'."]
      if (Object.keys(errors).length) return send(res, 400, { type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1', title: 'One or more validation errors occurred.', status: 400, errors }, 'application/problem+json')
      if (users.some((u) => u.email.toLowerCase() === b.email.toLowerCase())) return err(res, 409, 'Email already exists')
      const u = { id: users.length + 1, name: b.name, email: b.email, password: b.password, role: 'Passenger' }
      users.push(u)
      return send(res, 201, { token: tokenFor(u), profile: profileOf(u) })
    }

    if (path === '/api/flights' && method === 'GET') {
      if (AUTH_REQUIRED_FOR_FLIGHTS && !needAuth()) return
      return send(res, 200, page(flights, url))
    }
    if (path === '/api/flights/available' && method === 'GET') {
      const now = Date.now()
      const open = flights
        .filter((f) => f.flightStatus === 'Scheduled' && f.availableSeats > 0 && new Date(f.departureTime).getTime() > now)
        .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime) || a.id - b.id)
      return send(res, 200, page(open, url))
    }
    const fm = path.match(/^\/api\/flights\/(\d+)$/)
    if (fm && method === 'GET') {
      if (AUTH_REQUIRED_FOR_FLIGHTS && !needAuth()) return
      const f = flights.find((x) => x.id === Number(fm[1]))
      return f ? send(res, 200, f) : err(res, 404, 'Flight not found')
    }

    if (path === '/api/flights' && method === 'POST') {
      if (!needAuth(['Admin'])) return
      const b = await body(req)
      if (!b?.flightNumber || !b?.arrivalAirport) return send(res, 400, { title: 'One or more validation errors occurred.', status: 400, errors: { FlightNumber: ['Required'] } }, 'application/problem+json')
      if (new Date(b.arrivalTime) <= new Date(b.departureTime)) return err(res, 400, 'Arrival time must be after departure time')
      const f = mk(Math.max(...flights.map((x) => x.id)) + 1, b.flightNumber, b.departureAirport, b.arrivalAirport, b.departureTime, b.arrivalTime, b.numOfSeats, b.numOfSeats, b.price, b.amenityIds ?? [])
      flights.push(f)
      return send(res, 201, f)
    }
    if (fm && method === 'PUT') {
      if (!needAuth(['Admin'])) return
      const f = flights.find((x) => x.id === Number(fm[1]))
      if (!f) return err(res, 404, 'Flight not found')
      const b = await body(req)
      if (!b?.flightNumber || !b?.arrivalAirport) return send(res, 400, { title: 'One or more validation errors occurred.', status: 400, errors: { FlightNumber: ['Required'] } }, 'application/problem+json')
      if (new Date(b.arrivalTime) <= new Date(b.departureTime)) return err(res, 400, 'Arrival time must be after departure time')
      const updated = mk(f.id, b.flightNumber, b.departureAirport, b.arrivalAirport, b.departureTime, b.arrivalTime, f.numOfSeats, f.availableSeats, b.price, b.amenityIds ?? [])
      Object.assign(f, { ...updated, flightStatus: f.flightStatus })
      return send(res, 200, f)
    }
    if (fm && method === 'DELETE') {
      if (!needAuth(['Admin'])) return
      const f = flights.find((x) => x.id === Number(fm[1]))
      if (!f) return err(res, 404, 'Flight not found')
      f.flightStatus = 'Cancelled'
      orders.filter((o) => o.flightId === f.id && o.status === 'Confirmed').forEach((o) => (o.status = 'Cancelled'))
      return send(res, 204)
    }

    if (path === '/api/amenities' && method === 'GET') {
      if (!needAuth()) return
      return send(res, 200, page(amenities, url))
    }

    if (path === '/api/passengers' && method === 'GET') {
      if (!needAuth(['Admin'])) return
      return send(res, 200, page(users.filter((u) => u.role === 'Passenger' && u.isActive !== false).map(passengerDto), url))
    }
    if (path === '/api/passengers/me' && method === 'GET') {
      if (!needAuth(['Passenger'])) return
      const u = users.find((x) => x.id === Number(auth.nameid) && x.isActive !== false)
      return u ? send(res, 200, { id: u.id, name: u.name, email: u.email, isActive: true, orders: null }) : err(res, 404, 'Passenger not found')
    }
    const pm = path.match(/^\/api\/passengers\/(\d+)$/)
    if (pm && method === 'DELETE') {
      if (!needAuth(['Admin'])) return
      const u = users.find((x) => x.id === Number(pm[1]) && x.role === 'Passenger')
      if (!u) return err(res, 404, 'Passenger not found')
      u.isActive = false
      return send(res, 204)
    }

    if (path === '/api/orders' && method === 'GET') {
      if (!needAuth(['Admin'])) return
      return send(res, 200, page(orders.map(adminOrderDto), url))
    }

    if (path === '/api/orders/my' && method === 'GET') {
      if (!needAuth(['Passenger'])) return
      const mine = orders.filter((o) => o.passengerId === Number(auth.nameid)).map(orderDto)
      return send(res, 200, page(mine, url))
    }
    if (path === '/api/orders' && method === 'POST') {
      if (!needAuth(['Passenger'])) return
      const b = await body(req)
      const f = flights.find((x) => x.id === b?.flightId)
      if (!f) return err(res, 404, 'Flight not found')
      if (f.flightStatus !== 'Scheduled' || new Date(f.departureTime) <= new Date()) return err(res, 409, 'Flight is not available for booking')
      if (orders.some((o) => o.flightId === f.id && o.passengerId === Number(auth.nameid) && o.status === 'Confirmed')) return err(res, 409, 'Passenger already has an active order for this flight')
      await new Promise((r) => setTimeout(r, Number(process.env.MOCK_LATENCY ?? 250)))
      if (f.availableSeats <= 0) return err(res, 409, 'No seats available')
      f.availableSeats -= 1
      const o = { id: ++orderSeq, flightId: f.id, passengerId: Number(auth.nameid), orderDateTime: new Date().toISOString(), status: 'Confirmed' }
      orders.push(o)
      res.writeHead(201, { 'Content-Type': 'application/json', Location: `/api/orders/${o.id}` })
      return res.end(JSON.stringify(orderDto(o)))
    }
    const om = path.match(/^\/api\/orders\/(\d+)$/)
    if (om && method === 'DELETE') {
      if (!needAuth(['Admin', 'Passenger'])) return
      const o = orders.find((x) => x.id === Number(om[1]))
      if (!o) return err(res, 404, 'Order not found')
      if (o.passengerId !== Number(auth.nameid) && auth.role !== 'Admin') return err(res, 401, 'Not your order')
      if (o.status === 'Cancelled') return err(res, 409, 'Order is already cancelled')
      o.status = 'Cancelled'
      flights.find((f) => f.id === o.flightId).availableSeats += 1
      return send(res, 204)
    }

    // כלי בדיקה: נוסע אחר לוקח את המושב האחרון
    const tm = path.match(/^\/__mock\/take-last-seat\/(\d+)$/)
    if (tm && method === 'POST') {
      const f = flights.find((x) => x.id === Number(tm[1]))
      if (f && f.availableSeats > 0) f.availableSeats = 0
      return send(res, 200, { ok: true, availableSeats: f?.availableSeats })
    }
    if (path === '/__mock/reset' && method === 'POST') {
      flights.find((f) => f.id === 4).availableSeats = 1
      flights.find((f) => f.id === 1).availableSeats = 12
      orders.length = 0
      return send(res, 200, { ok: true })
    }

    return err(res, 404, 'Not found')
  } catch (e) {
    console.error(e)
    return err(res, 500, 'An unexpected error occurred. Please try again later.')
  }
})

server.listen(PORT, () => console.log(`mock ElAlSpace API on http://localhost:${PORT}  (flights ${AUTH_REQUIRED_FOR_FLIGHTS ? 'require login' : 'public'})`))
