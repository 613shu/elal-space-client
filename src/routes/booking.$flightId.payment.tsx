import { useEffect, useRef, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useBooking } from '~/components/booking/BookingContext'
import { CardPreview } from '~/components/booking/CardPreview'
import { ConflictView } from '~/components/booking/ConflictView'
import { triggerWarp } from '~/components/space/warp'
import { Button, buttonClasses } from '~/components/ui/Button'
import { TextField } from '~/components/ui/Field'
import { Eyebrow } from '~/components/ui/Eyebrow'
import { Lock, Rocket } from '~/components/ui/Icons'
import { toast } from '~/components/ui/Toast'
import { createOrder, fetchMyOrders } from '~/lib/api/endpoints'
import { ApiError, isApiError } from '~/lib/api/errors'
import { clearDraft, saveOrderExtras, setConflict, useConflict, useDraft } from '~/lib/booking/store'
import { paymentSchema, zodErrors, type FieldErrors } from '~/lib/booking/validation'
import { formatPrice } from '~/lib/format/money'
import { pageHead } from '~/lib/seo'
import { qk } from '~/lib/api/queries'
import { useSession } from '~/lib/auth/store'

export const Route = createFileRoute('/booking/$flightId/payment')({
  head: () => pageHead('תשלום'),
  component: PaymentStep,
})

type Key = 'cardNumber' | 'cardName' | 'expiry' | 'cvc'

const groupCard = (v: string) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim()
const fmtExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

/**
 * אחרי הזמנה מוצלחת הטיוטה מתנקה, וייתכן שהרכיב נטען מחדש בזמן הניווט.
 * הדגל חי מחוץ לרכיב כדי ששומר הצעדים לא יחזיר את הנוסע לבחירת מושב.
 */
const justBooked = new Set<number>()
const markBooked = (id: number) => {
  justBooked.add(id)
  setTimeout(() => justBooked.delete(id), 4000)
}

function PaymentStep() {
  const { flight, refetch, refetching } = useBooking()
  const draft = useDraft(flight.id)
  const session = useSession()
  const nav = useNavigate()
  const qc = useQueryClient()
  const [card, setCard] = useState({ cardNumber: '', cardName: '', expiry: '', cvc: '' })
  const [errors, setErrors] = useState<FieldErrors<Key>>({})
  const [flipped, setFlipped] = useState(false)
  const conflict = useConflict(flight.id)
  const [failure, setFailure] = useState<string | null>(null)
  const submitting = useRef(false)

  useEffect(() => {
    if (justBooked.has(flight.id)) return
    if (!draft.seat) nav({ to: '/booking/$flightId/seats', params: { flightId: String(flight.id) }, replace: true })
    else if (!draft.traveler) nav({ to: '/booking/$flightId/passengers', params: { flightId: String(flight.id) }, replace: true })
  }, [draft.seat, draft.traveler, flight.id, nav])

  const goConfirmation = (orderId: number) => {
    triggerWarp(1600)
    nav({ to: '/confirmation/$orderId', params: { orderId: String(orderId) } })
  }

  const order = useMutation({
    mutationFn: () => createOrder(flight),
    onSuccess: (o) => {
      markBooked(flight.id)
      saveOrderExtras(o.id, { seat: draft.seat, meal: draft.traveler?.meal, fullName: draft.traveler?.fullName })
      clearDraft(flight.id)
      qc.invalidateQueries({ queryKey: ['flights'] })
      qc.invalidateQueries({ queryKey: ['flight'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.setQueryData(qk.myOrders(session?.profile.id ?? null), (prev: { orders: unknown[]; source: string } | undefined) =>
        prev ? { ...prev, orders: [o, ...prev.orders] } : prev,
      )
      goConfirmation(o.id)
    },
    onError: async (err) => {
      submitting.current = false
      if (isApiError(err) && err.kind === 'conflict') {
        // ייתכן שההזמנה כן עברה והתשובה אבדה: בודקים לפני שמציגים כישלון
        try {
          const mine = await fetchMyOrders()
          const existing = mine.orders.find((o) => o.flight.id === flight.id && o.status === 'Confirmed')
          if (existing) {
            markBooked(flight.id)
            saveOrderExtras(existing.id, { seat: draft.seat, meal: draft.traveler?.meal, fullName: draft.traveler?.fullName })
            clearDraft(flight.id)
            qc.invalidateQueries({ queryKey: ['orders'] })
            return goConfirmation(existing.id)
          }
        } catch {
          /* ממשיכים להצגת ההתנגשות */
        }
        qc.invalidateQueries({ queryKey: ['flight'] })
        qc.invalidateQueries({ queryKey: ['flights'] })
        setConflict(flight.id, err)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      if (isApiError(err) && err.kind === 'unauthorized') {
        toast('ההתחברות פגה. היכנסו מחדש והמשיכו מאותו מקום.', 'danger')
        nav({ to: '/account', search: { redirect: `/booking/${flight.id}/payment` } })
        return
      }
      setFailure(isApiError(err) ? err.message : 'לא הצלחנו להשלים את ההזמנה. נסו שוב.')
    },
  })

  const set = (k: Key, v: string) => {
    const next = { ...card, [k]: v }
    setCard(next)
    if (errors[k]) {
      const r = paymentSchema.safeParse(next)
      setErrors(r.success ? {} : zodErrors<Key>(r.error))
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting.current || order.isPending) return
    const r = paymentSchema.safeParse(card)
    if (!r.success) {
      const errs = zodErrors<Key>(r.error)
      setErrors(errs)
      const first = (Object.keys(errs)[0] ?? '') as Key
      document.querySelector<HTMLInputElement>(`[data-card="${first}"]`)?.focus()
      return
    }
    setErrors({})
    setFailure(null)
    submitting.current = true
    order.mutate()
  }

  if (conflict) {
    return (
      <ConflictView
        error={conflict}
        flight={flight}
        retrying={refetching}
        onRetry={async () => {
          await refetch()
          setConflict(flight.id, null)
        }}
      />
    )
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-10" aria-labelledby="pay-title">
      <header className="flex flex-col gap-4">
        <Eyebrow>שלב 3 מתוך 4</Eyebrow>
        <h1 id="pay-title" className="text-headline">תשלום</h1>
        <p className="max-w-2xl text-lead text-foreground-muted">מחיר קבוע של <span className="num text-foreground">{formatPrice(flight.price)}</span>. אין עמלות נוספות.</p>
      </header>

      <CardPreview number={card.cardNumber} name={card.cardName} expiry={card.expiry} cvc={card.cvc} flipped={flipped} />

      {failure && (
        <div role="alert" className="rounded-card border border-destructive/50 bg-destructive-soft p-5 text-destructive">{failure}</div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="מספר כרטיס" ltr inputMode="numeric" autoComplete="cc-number" data-card="cardNumber" value={card.cardNumber} onChange={(e) => set('cardNumber', groupCard(e.target.value))} error={errors.cardNumber} className="sm:col-span-2" placeholder="1234 5678 9012 3456" />
        <TextField label="שם בעל הכרטיס" autoComplete="cc-name" data-card="cardName" value={card.cardName} onChange={(e) => set('cardName', e.target.value)} error={errors.cardName} className="sm:col-span-2" />
        <TextField label="תוקף" ltr inputMode="numeric" autoComplete="cc-exp" data-card="expiry" value={card.expiry} onChange={(e) => set('expiry', fmtExpiry(e.target.value))} error={errors.expiry} placeholder="MM/YY" />
        <TextField label="קוד אבטחה (CVC)" ltr inputMode="numeric" autoComplete="cc-csc" data-card="cvc" value={card.cvc} onChange={(e) => set('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))} onFocus={() => setFlipped(true)} onBlur={() => setFlipped(false)} error={errors.cvc} />
      </div>

      <p className="flex items-start gap-3 rounded-card border border-border bg-surface-sunken/60 p-4 text-caption text-foreground-muted">
        <Lock className="mt-0.5 size-4 shrink-0 text-accent" />
        <span>פרטי הכרטיס נבדקים בדפדפן בלבד, ואינם נשלחים לשרת או נשמרים. בשלב זה לא מתבצע חיוב אמיתי.</span>
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
        <Link to="/booking/$flightId/passengers" params={{ flightId: String(flight.id) }} className={buttonClasses({ variant: 'ghost' })}>
          חזרה לפרטי הנוסע
        </Link>
        <Button type="submit" size="lg" loading={order.isPending} icon={<Rocket className="size-5" />}>
          {order.isPending ? 'מאשרים את המושב…' : `אישור ותשלום · ${formatPrice(flight.price)}`}
        </Button>
      </div>
    </form>
  )
}
