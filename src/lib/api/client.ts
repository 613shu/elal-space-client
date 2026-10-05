import { apiUrl, REQUEST_TIMEOUT_MS } from './config'
import { ApiError, networkError, parseErrorResponse } from './errors'
import { clearSession, getToken } from '~/lib/auth/store'

interface RequestOptions {
  body?: unknown
  /** ברירת מחדל: שולחים Authorization אם יש טוקן */
  auth?: boolean
  signal?: AbortSignal
  query?: Record<string, string | number | boolean | undefined>
}

function withTimeout(external?: AbortSignal) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(new DOMException('timeout', 'TimeoutError')), REQUEST_TIMEOUT_MS)
  const onAbort = () => ctrl.abort(external?.reason)
  external?.addEventListener('abort', onAbort, { once: true })
  return {
    signal: ctrl.signal,
    done: () => {
      clearTimeout(timer)
      external?.removeEventListener('abort', onAbort)
    },
  }
}

export async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const qs = opts.query
    ? '?' +
      Object.entries(opts.query)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : ''

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = opts.auth === false ? null : getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const t = withTimeout(opts.signal)
  let res: Response
  try {
    res = await fetch(apiUrl(path) + (qs === '?' ? '' : qs), {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: t.signal,
    })
  } catch (e) {
    t.done()
    if (opts.signal?.aborted) throw e
    throw networkError(e)
  }
  t.done()

  if (!res.ok) {
    const err = await parseErrorResponse(res)
    // טוקן שנדחה = סשן שפג. מנקים כדי שהממשק יחזור למצב אורח.
    if (err.status === 401 && token) clearSession()
    throw err
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    throw new ApiError({ status: res.status, message: 'התקבלה תשובה לא צפויה מהשרת.' })
  }
}

export const http = {
  get: <T>(path: string, o?: RequestOptions) => request<T>('GET', path, o),
  post: <T>(path: string, body?: unknown, o?: RequestOptions) => request<T>('POST', path, { ...o, body }),
  del: <T = void>(path: string, o?: RequestOptions) => request<T>('DELETE', path, o),
}
