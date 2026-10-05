import type { Flight, LoginResult, Order } from './types'

/**
 * נתוני הדגמה. משמשים רק כשהשרת לא זמין או כשצפייה בטיסות דורשת התחברות (מצב auto),
 * או תמיד כש-VITE_DATA_MODE=demo. הטיסה 205 מדמה "המושב האחרון נלקח": ההזמנה הראשונה בה נדחית ב-409.
 */
const A = {
  window: { id: 1, name: 'חלון פרטי' },
  gravity: { id: 2, name: 'כבידה מדומה' },
  meals: { id: 3, name: 'ארוחות שף' },
  gear: { id: 4, name: 'ציוד אישי כלול' },
  training: { id: 5, name: 'הכשרה לפני ההמראה' },
  lounge: { id: 6, name: 'סלון משותף' },
  library: { id: 7, name: 'ספרייה וגינה' },
}

const base = { flightStatus: 'Scheduled', isDemo: true } as const

export const DEMO_FLIGHTS: Flight[] = [
  {
    ...base, id: 101, flightNumber: 'ES 001', departureAirport: 'תל אביב', arrivalAirport: 'הירח',
    departureTime: '2027-04-18T06:30:00Z', arrivalTime: '2027-04-21T16:10:00Z',
    numOfSeats: 24, availableSeats: 12, price: 184000,
    amenities: [A.window, A.gravity, A.meals, A.gear, A.training],
  },
  {
    ...base, id: 102, flightNumber: 'ES 002', departureAirport: 'תל אביב', arrivalAirport: 'הירח',
    departureTime: '2027-05-09T07:00:00Z', arrivalTime: '2027-05-12T15:00:00Z',
    numOfSeats: 24, availableSeats: 20, price: 192000,
    amenities: [A.window, A.gravity, A.meals, A.gear, A.training],
  },
  {
    ...base, id: 103, flightNumber: 'ES 003', departureAirport: 'תל אביב', arrivalAirport: 'הירח',
    departureTime: '2027-06-27T06:30:00Z', arrivalTime: '2027-06-30T14:30:00Z',
    numOfSeats: 24, availableSeats: 8, price: 205000,
    amenities: [A.window, A.gravity, A.meals, A.gear, A.training, A.lounge],
  },
  {
    ...base, id: 204, flightNumber: 'ES 204', departureAirport: 'תל אביב', arrivalAirport: 'מאדים',
    departureTime: '2027-06-03T21:00:00Z', arrivalTime: '2028-01-05T08:40:00Z',
    numOfSeats: 20, availableSeats: 7, price: 780000,
    amenities: [A.window, A.gravity, A.meals, A.gear, A.training, A.library],
  },
  {
    ...base, id: 205, flightNumber: 'ES 205', departureAirport: 'תל אביב', arrivalAirport: 'מאדים',
    departureTime: '2027-09-18T05:00:00Z', arrivalTime: '2028-04-20T07:00:00Z',
    numOfSeats: 20, availableSeats: 1, price: 810000,
    amenities: [A.window, A.gravity, A.meals, A.gear, A.training, A.lounge, A.library],
  },
  {
    ...base, id: 316, flightNumber: 'ES 316', departureAirport: 'מסלול הירח', arrivalAirport: 'שבתאי',
    departureTime: '2027-09-12T11:45:00Z', arrivalTime: '2029-03-14T05:20:00Z',
    numOfSeats: 12, availableSeats: 4, price: 1260000,
    amenities: [A.window, A.gravity, A.meals, A.gear, A.training, A.lounge, A.library],
  },
  {
    ...base, id: 401, flightNumber: 'ES 401', departureAirport: 'מסלול הירח', arrivalAirport: 'אירופה',
    departureTime: '2027-11-02T06:00:00Z', arrivalTime: '2030-01-05T06:00:00Z',
    numOfSeats: 12, availableSeats: 9, price: 1980000,
    amenities: [A.window, A.gravity, A.meals, A.gear, A.training, A.library],
  },
  {
    ...base, id: 501, flightNumber: 'ES 501', departureAirport: 'תל אביב', arrivalAirport: 'תחנת המסלול',
    departureTime: '2027-03-05T07:00:00Z', arrivalTime: '2027-03-05T10:30:00Z',
    numOfSeats: 30, availableSeats: 18, price: 96000,
    amenities: [A.window, A.meals, A.gear, A.training],
  },
]

/** טיסות שבהן ההזמנה הראשונה תיכשל ב-409, כדי להדגים את מסך ה"המושב האחרון נלקח" */
export const DEMO_RACE_FLIGHT_IDS = new Set([205])

export const DEMO_PROFILE: LoginResult = {
  id: 9001,
  name: 'ישי',
  email: 'demo@elal-space.example',
  role: 'Passenger',
  passengerProfile: { id: 9001, name: 'ישי', email: 'demo@elal-space.example', isActive: true },
}

const ORDERS_KEY = 'elal.demo.orders.v1'

export function loadDemoOrders(): Order[] {
  try {
    return JSON.parse(window.localStorage.getItem(ORDERS_KEY) ?? '[]') as Order[]
  } catch {
    return []
  }
}

export function saveDemoOrders(orders: Order[]) {
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  } catch {
    /* ignore */
  }
}
