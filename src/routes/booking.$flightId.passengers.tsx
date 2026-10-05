import { useEffect, useRef, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useBooking } from '~/components/booking/BookingContext'
import { Button, buttonClasses } from '~/components/ui/Button'
import { Check, SelectField, TextField } from '~/components/ui/Field'
import { Eyebrow } from '~/components/ui/Eyebrow'
import { Lock } from '~/components/ui/Icons'
import { useSession } from '~/lib/auth/store'
import { MEAL_LABEL, updateDraft, useDraft, type Traveler } from '~/lib/booking/store'
import { travelerSchema, zodErrors, type FieldErrors } from '~/lib/booking/validation'
import { pageHead } from '~/lib/seo'

export const Route = createFileRoute('/booking/$flightId/passengers')({
  head: () => pageHead('פרטי נוסע'),
  component: PassengersStep,
})

type Key = keyof Traveler

const EMPTY: Traveler = {
  fullName: '',
  idNumber: '',
  birthDate: '',
  phone: '',
  emergencyName: '',
  emergencyPhone: '',
  meal: 'regular',
  health: false,
  terms: false,
}

function PassengersStep() {
  const { flight } = useBooking()
  const session = useSession()
  const draft = useDraft(flight.id)
  const nav = useNavigate()
  const [form, setForm] = useState<Traveler>(() => ({ ...EMPTY, fullName: session?.profile.name ?? '', ...draft.traveler }))
  const [errors, setErrors] = useState<FieldErrors<Key>>({})
  const summary = useRef<HTMLDivElement>(null)
  const [submitted, setSubmitted] = useState(false)

  // בלי מושב אין מה להמשיך: חוזרים לשלב הקודם
  useEffect(() => {
    if (!draft.seat) nav({ to: '/booking/$flightId/seats', params: { flightId: String(flight.id) }, replace: true })
  }, [draft.seat, flight.id, nav])

  const set = <K extends Key>(k: K, v: Traveler[K]) => {
    const next = { ...form, [k]: v }
    setForm(next)
    if (submitted) {
      const r = travelerSchema.safeParse(next)
      setErrors(r.success ? {} : zodErrors<Key>(r.error))
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const r = travelerSchema.safeParse(form)
    if (!r.success) {
      setErrors(zodErrors<Key>(r.error))
      requestAnimationFrame(() => summary.current?.focus())
      return
    }
    setErrors({})
    updateDraft(flight.id, { traveler: r.data })
    nav({ to: '/booking/$flightId/payment', params: { flightId: String(flight.id) } })
  }

  const errorList = Object.entries(errors) as Array<[Key, string]>

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-10" aria-labelledby="pax-title">
      <header className="flex flex-col gap-4">
        <Eyebrow>שלב 2 מתוך 4</Eyebrow>
        <h1 id="pax-title" className="text-headline">פרטי הנוסע</h1>
        <p className="max-w-2xl text-lead text-foreground-muted">
          ההזמנה נרשמת על שם החשבון שלכם
          {session ? <> (<span className="font-medium text-foreground">{session.profile.name}</span>, <span dir="ltr" className="num">{session.profile.email}</span>)</> : null}.
          כל נוסע מזמין מהחשבון שלו, ולכן כאן מזינים רק את הפרטים שלכם.
        </p>
      </header>

      {errorList.length > 0 && (
        <div ref={summary} tabIndex={-1} role="alert" className="rounded-card border border-destructive/50 bg-destructive-soft p-5 outline-none">
          <p className="font-medium text-destructive">יש {errorList.length} שדות שדורשים תשומת לב:</p>
          <ul className="mt-2 list-inside list-disc text-foreground-muted">
            {errorList.map(([k, m]) => (
              <li key={k}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-5 font-display text-title">פרטים אישיים</legend>
        <TextField label="שם מלא" autoComplete="name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} error={errors.fullName} hint="כפי שמופיע בדרכון" className="sm:col-span-2" />
        <TextField label="מספר דרכון או תעודה" ltr autoComplete="off" value={form.idNumber} onChange={(e) => set('idNumber', e.target.value)} error={errors.idNumber} />
        <TextField label="תאריך לידה" type="date" ltr autoComplete="bday" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} error={errors.birthDate} max={new Date().toISOString().slice(0, 10)} />
        <TextField label="טלפון נייד" type="tel" ltr autoComplete="tel" inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} className="sm:col-span-2" />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-5 font-display text-title">איש קשר לשעת חירום</legend>
        <TextField label="שם" value={form.emergencyName} onChange={(e) => set('emergencyName', e.target.value)} error={errors.emergencyName} />
        <TextField label="טלפון" type="tel" ltr inputMode="tel" value={form.emergencyPhone} onChange={(e) => set('emergencyPhone', e.target.value)} error={errors.emergencyPhone} />
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="mb-5 font-display text-title">העדפות</legend>
        <SelectField label="סוג ארוחה" value={form.meal} onChange={(e) => set('meal', e.target.value as Traveler['meal'])} className="sm:max-w-xs">
          {Object.entries(MEAL_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </SelectField>
      </fieldset>

      <fieldset className="grid gap-4 rounded-card border border-border bg-surface-sunken/60 p-5 sm:p-6">
        <legend className="sr-only">הצהרות</legend>
        <div className="flex flex-col gap-1.5">
          <Check label="אני מצהיר/ה שמצבי הבריאותי מאפשר טיסה בחלל" checked={form.health} onChange={(e) => set('health', e.target.checked)} aria-invalid={errors.health ? true : undefined} />
          {errors.health && <p role="alert" className="ps-8 text-caption text-destructive">{errors.health}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Check label="קראתי ואני מאשר/ת את תנאי המסע וההכשרה" checked={form.terms} onChange={(e) => set('terms', e.target.checked)} aria-invalid={errors.terms ? true : undefined} />
          {errors.terms && <p role="alert" className="ps-8 text-caption text-destructive">{errors.terms}</p>}
        </div>
      </fieldset>

      <p className="flex items-center gap-2 text-caption text-foreground-subtle">
        <Lock className="size-4" />
        הפרטים האלה נשמרים בדפדפן שלכם בלבד, ונמחקים עם סיום ההזמנה.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
        <Link to="/booking/$flightId/seats" params={{ flightId: String(flight.id) }} className={buttonClasses({ variant: 'ghost' })}>
          חזרה לבחירת מושב
        </Link>
        <Button type="submit" size="lg">
          המשך לתשלום
        </Button>
      </div>
    </form>
  )
}
