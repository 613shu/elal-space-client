/**
 * טיפוסים שמשקפים אחד לאחד את ה-DTOs של שרת ה-C# (ElAlProjectCore/DTOs).
 * ASP.NET מסריאל ל-camelCase כברירת מחדל, ולכן השמות כאן באותיות קטנות בהתחלה.
 */

export type FlightStatus = 'Scheduled' | 'Cancelled' | 'Completed'
export type OrderStatus = 'Confirmed' | 'Cancelled'
export type UserRole = 'Admin' | 'Passenger'

/** AdminResponse_AmenityDTO */
export interface Amenity {
  id: number
  name: string
}

/** AdminResponse_PassengerDTO (נחשף כרגע בתוך AdminResponse_FlightDTO) */
export interface FlightPassenger {
  id: number
  name?: string
  email?: string
  isActive?: boolean
}

/**
 * AdminResponse_FlightDTO: זה מה ש-GET /api/flights מחזיר כיום.
 * שימו לב: passengers מגיע גם ללקוחות רגילים, ראו README, סעיף "מה כדאי לתקן בשרת".
 */
export interface Flight extends ClientFlightMeta {
  id: number
  flightNumber: string
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
  numOfSeats: number
  availableSeats: number
  passengers?: FlightPassenger[]
  /** ב-PassengerResponse_FlightDTO אין id לנוחות; ב-Admin יש */
  amenities: Array<{ id?: number; name: string }>
  flightStatus: FlightStatus | string
  price: number
}

/** PassengerResponse_OrderDTO */
export interface Order {
  id: number
  flight: Flight
  orderDateTime: string
  status: OrderStatus | string
}

/** AdminResponse_OrderDTO */
export interface AdminOrder extends Order {
  passenger?: FlightPassenger
}

/** AdminResponse_PassengerDTO כפי שחוזר מ-GET /api/passengers */
export interface AdminPassenger {
  id: number
  name: string
  email: string
  flights?: Flight[] | null
}

/** AdminRequest_FlightDTO */
export interface FlightRequest {
  flightNumber: string
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
  numOfSeats: number
  price: number
  amenityIds: number[]
}

/** עטיפת העימוד: Ok(new { items, totalCount }) */
export interface Paged<T> {
  items: T[]
  totalCount: number
}

/** LoginModel */
export interface LoginRequest {
  email: string
  password: string
}

/** AuthRequestDTO */
export interface RegisterRequest {
  name: string
  email: string
  password: string
}

/** PassengerResponse_PassengerDTO / AdminResponse_AdminDTO */
export interface UserProfile {
  id: number
  name: string
  email: string
  isActive?: boolean
}

/** LoginResultDTO */
export interface LoginResult {
  id: number
  name: string
  email: string
  role: UserRole | string
  adminProfile?: UserProfile | null
  passengerProfile?: UserProfile | null
}

/** AuthResponseDTO<LoginResultDTO> */
export interface AuthResponse {
  token: string | null
  profile: LoginResult
}

/** PassengerRequest_OrderDTO */
export interface CreateOrderRequest {
  flightId: number
}

/** ApiErrorResponse של ה-ExceptionHandlingMiddleware */
export interface ApiErrorBody {
  statusCode: number
  message: string
  correlationId: string
}

/** שדה צד־לקוח בלבד: טיסה שמגיעה מנתוני ההדגמה ולא מהשרת */
export interface ClientFlightMeta {
  isDemo?: boolean
}
