import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Logo } from '~/components/brand/Logo'
import { Button } from '~/components/ui/Button'
import { TextField } from '~/components/ui/Field'
import { Lock } from '~/components/ui/Icons'
import { Tab, TabList, TabPanel, Tabs } from '~/components/ui/Tabs'
import { toast } from '~/components/ui/Toast'
import { DATA_MODE } from '~/lib/api/config'
import { demoAuth, login, register } from '~/lib/api/endpoints'
import { ApiError, isApiError } from '~/lib/api/errors'
import { setSession, useSession } from '~/lib/auth/store'
import { pageHead } from '~/lib/seo'
import { useEffect } from 'react'

interface AccountSearch {
  redirect?: string
  mode?: 'login' | 'register'
}

/** מונע redirect לאתר אחר: רק נתיבים פנימיים */
export const safeRedirect = (r?: string) => (r && r.startsWith('/') && !r.startsWith('//') && !r.startsWith('/account') ? r : undefined)

export const Route = createFileRoute('/account')({
  validateSearch: (s: Record<string, unknown>): AccountSearch => ({
    redirect: typeof s.redirect === 'string' ? s.redirect : undefined,
    mode: s.mode === 'register' ? 'register' : undefined,
  }),
  head: () => pageHead('כניסה', 'כניסה למרכז הבקרה האישי, להזמנות ולמסמכי הטיסה.'),
  component: AccountPage,
})

type Field = 'name' | 'email' | 'password' | 'confirm'

function mapServerErrors(err: unknown): Partial<Record<Field, string>> {
  if (!isApiError(err) || !err.fieldErrors) return {}
  const out: Partial<Record<Field, string>> = {}
  for (const [k, msgs] of Object.entries(err.fieldErrors)) {
    const key = k.toLowerCase().replace(/^\$\./, '')
    const f: Field | undefined = key.includes('email') ? 'email' : key.includes('password') ? 'password' : key.includes('name') ? 'name' : undefined
    if (f) out[f] = f === 'password' ? 'הסיסמה חייבת להכיל לפחות 6 תווים' : f === 'email' ? 'כתובת הדוא״ל אינה תקינה' : 'נא להזין שם'
    void msgs
  }
  return out
}

function AccountPage() {
  const search = Route.useSearch()
  const nav = useNavigate()
  const session = useSession()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'login' | 'register'>(search.mode ?? 'login')
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [formError, setFormError] = useState<ApiError | null>(null)
  const [vals, setVals] = useState({ name: '', email: '', password: '', confirm: '' })

  // מנהל נכנס תמיד לממשק הניהול: אין לו מה לחפש בתהליך ההזמנה שממנו אולי הופנה
  const wanted = safeRedirect(search.redirect)
  const target = session?.profile.role === 'Admin' ? (wanted?.startsWith('/admin') ? wanted : '/admin') : (wanted ?? '/dashboard')

  useEffect(() => {
    if (session) nav({ to: target, replace: true })
  }, [session, nav, target])

  const done = (token: string | null, profile: Parameters<typeof setSession>[1], welcome: string) => {
    if (!token) {
      setFormError(new ApiError({ status: 500, message: 'השרת לא החזיר אסימון התחברות.' }))
      return
    }
    qc.clear()
    setSession(token, profile)
    toast(welcome, 'success')
  }

  const auth = useMutation({
    mutationFn: async () => {
      if (tab === 'login') return login({ email: vals.email.trim(), password: vals.password })
      return register({ name: vals.name.trim(), email: vals.email.trim(), password: vals.password })
    },
    onSuccess: (r) => done(r.token, r.profile, tab === 'login' ? `ברוכים השבים, ${r.profile.name}.` : `ברוכים הבאים, ${r.profile.name}.`),
    onError: (e) => {
      setFormError(isApiError(e) ? e : null)
      const mapped = mapServerErrors(e)
      if (isApiError(e) && e.kind === 'conflict' && tab === 'register') mapped.email = 'כתובת הדוא״ל כבר רשומה. נסו להתחבר.'
      setErrors(mapped)
    },
  })

  const set = (k: Field, v: string) => {
    setVals((x) => ({ ...x, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Partial<Record<Field, string>> = {}
    if (tab === 'register' && vals.name.trim().length < 2) next.name = 'נא להזין שם'
    if (!/^\S+@\S+\.\S+$/.test(vals.email.trim())) next.email = 'נא להזין כתובת דוא״ל תקינה'
    if (!vals.password) next.password = 'נא להזין סיסמה'
    else if (tab === 'register' && vals.password.length < 6) next.password = 'הסיסמה חייבת להכיל לפחות 6 תווים'
    if (tab === 'register' && vals.confirm !== vals.password) next.confirm = 'הסיסמאות אינן זהות'
    setErrors(next)
    setFormError(null)
    const first = Object.keys(next)[0]
    if (first) return void document.querySelector<HTMLInputElement>(`[data-f="${first}"]`)?.focus()
    auth.mutate()
  }

  const message =
    formError &&
    (formError.kind === 'unauthorized' && tab === 'login'
      ? 'האימייל או הסיסמה שגויים.'
      : formError.kind === 'conflict' || formError.kind === 'validation'
        ? null
        : formError.message)

  return (
    <div className="mx-auto grid min-h-[100dvh] max-w-6xl items-center gap-12 px-5 pb-16 pt-32 sm:px-8 lg:grid-cols-[1fr_28rem] lg:gap-20">
      <div className="flex flex-col items-start gap-8">
        <Logo size={120} decorative={false} title="אל על חלל: לחצו וסובבו" />
        <div className="flex flex-col gap-4">
          <h1 className="text-headline">{tab === 'login' ? 'ברוכים השבים למסלול' : 'פותחים דרכון חלל'}</h1>
          <p className="max-w-md text-lead text-foreground-muted">
            {tab === 'login'
              ? 'היכנסו לצפייה במסעות, בהכשרות ובמסמכי הטיסה.'
              : 'חשבון אחד לכל ההזמנות, למסמכי הטיסה ולמרכז הבקרה האישי שלכם.'}
          </p>
        </div>
      </div>

      <div className="glass rounded-panel p-6 shadow-lift sm:p-8">
        <Tabs value={tab} onValueChange={(v) => { setTab(v as 'login' | 'register'); setErrors({}); setFormError(null) }}>
          <TabList label="כניסה או הרשמה" className="mb-7 w-full [&>*]:flex-1">
            <Tab value="login">כניסה</Tab>
            <Tab value="register">הרשמה</Tab>
          </TabList>
          <TabPanel value={tab} className="outline-none">
            <form onSubmit={submit} noValidate className="flex flex-col gap-5" aria-label={tab === 'login' ? 'טופס כניסה' : 'טופס הרשמה'}>
              {message && (
                <div role="alert" className="rounded-card border border-destructive/50 bg-destructive-soft p-4 text-destructive">
                  {message}
                  {formError?.kind === 'network' && DATA_MODE !== 'live' && (
                    <button
                      type="button"
                      className="mt-2 block text-foreground underline underline-offset-4"
                      onClick={() => {
                        const a = demoAuth(vals.email, vals.name)
                        done(a.token, a.profile, 'נכנסתם במצב הדגמה.')
                      }}
                    >
                      להמשיך במצב הדגמה (בלי שרת)
                    </button>
                  )}
                </div>
              )}
              {tab === 'register' && (
                <TextField label="שם מלא" autoComplete="name" data-f="name" value={vals.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
              )}
              <TextField label="דוא״ל" type="email" ltr autoComplete="email" data-f="email" value={vals.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
              <TextField
                label="סיסמה"
                type="password"
                ltr
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                data-f="password"
                value={vals.password}
                onChange={(e) => set('password', e.target.value)}
                error={errors.password}
                hint={tab === 'register' ? 'לפחות 6 תווים' : undefined}
              />
              {tab === 'register' && (
                <TextField label="אימות סיסמה" type="password" ltr autoComplete="new-password" data-f="confirm" value={vals.confirm} onChange={(e) => set('confirm', e.target.value)} error={errors.confirm} />
              )}
              <Button type="submit" size="lg" block loading={auth.isPending} icon={<Lock className="size-4" />}>
                {tab === 'login' ? 'כניסה מאובטחת' : 'פתיחת חשבון'}
              </Button>
              <p className="text-center text-body text-foreground-muted">
                {tab === 'login' ? 'עדיין אין לכם דרכון חלל? ' : 'כבר יש לכם חשבון? '}
                <button type="button" className="text-primary underline underline-offset-4" onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setErrors({}); setFormError(null) }}>
                  {tab === 'login' ? 'פתיחת חשבון' : 'כניסה'}
                </button>
              </p>
            </form>
          </TabPanel>
        </Tabs>
        <p className="mt-6 flex items-center justify-center gap-2 text-caption text-foreground-subtle">
          <Lock className="size-3.5" />
          הסיסמה נשלחת לשרת בלבד, ואינה נשמרת בדפדפן.
        </p>
      </div>
    </div>
  )
}
