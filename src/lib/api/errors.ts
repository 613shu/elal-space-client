import type { ApiErrorBody } from './types'

export type ErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'validation'
  | 'server'
  | 'unknown'

/**
 * שגיאה אחידה מכל קריאה לשרת.
 * status 0 = לא הצלחנו להגיע לשרת בכלל (רשת, CORS, שרת כבוי).
 */
export class ApiError extends Error {
  readonly status: number
  readonly kind: ErrorKind
  readonly correlationId?: string
  readonly fieldErrors?: Record<string, string[]>
  /** ההודעה הגולמית מהשרת (באנגלית בדרך כלל): לא להציג למשתמש כמות שהיא */
  readonly serverMessage?: string

  constructor(init: {
    status: number
    message: string
    serverMessage?: string
    correlationId?: string
    fieldErrors?: Record<string, string[]>
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.status = init.status
    this.kind = kindOf(init.status)
    this.correlationId = init.correlationId
    this.fieldErrors = init.fieldErrors
    this.serverMessage = init.serverMessage
  }
}

function kindOf(status: number): ErrorKind {
  if (status === 0) return 'network'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not-found'
  if (status === 409) return 'conflict'
  if (status === 400 || status === 422) return 'validation'
  if (status >= 500) return 'server'
  return 'unknown'
}

const FRIENDLY: Record<ErrorKind, string> = {
  network: 'לא הצלחנו ליצור קשר עם מרכז הבקרה. בדקו את החיבור ונסו שוב.',
  unauthorized: 'ההתחברות פגה. היכנסו מחדש כדי להמשיך.',
  forbidden: 'אין לכם הרשאה לבצע פעולה זו.',
  'not-found': 'לא מצאנו את מה שחיפשתם.',
  conflict: 'המצב השתנה מרגע שהתחלתם. רעננו ונסו שוב.',
  validation: 'חלק מהפרטים אינם תקינים. בדקו את השדות המסומנים.',
  server: 'משהו השתבש אצלנו. הצוות כבר יודע. נסו שוב בעוד רגע.',
  unknown: 'אירעה תקלה בלתי צפויה.',
}

export function friendlyMessage(kind: ErrorKind): string {
  return FRIENDLY[kind]
}

/** פירוק גוף שגיאה של השרת: JSON אחיד, ProblemDetails של [ApiController], או טקסט פשוט */
export async function parseErrorResponse(res: Response): Promise<ApiError> {
  const text = await res.text().catch(() => '')
  let body: unknown = text
  try {
    body = text ? JSON.parse(text) : undefined
  } catch {
    body = text
  }

  let serverMessage: string | undefined
  let correlationId: string | undefined
  let fieldErrors: Record<string, string[]> | undefined

  if (typeof body === 'string') {
    serverMessage = body || undefined
  } else if (body && typeof body === 'object') {
    const b = body as Partial<ApiErrorBody> & {
      title?: string
      detail?: string
      errors?: Record<string, string[]>
    }
    serverMessage = b.message ?? b.detail ?? b.title
    correlationId = b.correlationId
    if (b.errors && typeof b.errors === 'object') fieldErrors = b.errors
  }

  correlationId ??= res.headers.get('X-Correlation-ID') ?? undefined
  const kind = kindOf(res.status)

  return new ApiError({
    status: res.status,
    message: friendlyMessage(kind),
    serverMessage,
    correlationId,
    fieldErrors,
  })
}

export function networkError(cause?: unknown): ApiError {
  const e = new ApiError({ status: 0, message: friendlyMessage('network') })
  if (cause) (e as { cause?: unknown }).cause = cause
  return e
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError
}
