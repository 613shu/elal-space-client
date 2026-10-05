import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LaunchClock } from '~/components/home/LaunchClock'
import { RequireAuth } from '~/components/booking/RequireAuth'
import { DemoNotice } from '~/components/layout/DemoNotice'
import { PlanetArt } from '~/components/space/PlanetArt'
import { Badge } from '~/components/ui/Badge'
import { Button, buttonClasses } from '~/components/ui/Button'
import { Dialog } from '~/components/ui/Dialog'
import { Check, Download } from '~/components/ui/Icons'
import { CardSkeletons, EmptyState, ErrorState } from '~/components/ui/StateViews'
import { toast } from '~/components/ui/Toast'
import { Reveal } from '~/components/ui/Reveal'
import { cancelOrder } from '~/lib/api/endpoints'
import { isApiError } from '~/lib/api/errors'
import { myOrdersQuery } from '~/lib/api/queries'
import type { Order } from '~/lib/api/types'
import { useSession } from '~/lib/auth/store'
import { useHydrated } from '~/hooks/useHydrated'
import { loadOrderExtras } from '~/lib/booking/store'
import { destinationFor } from '~/lib/content/generic'
import { formatDate, formatTime, parseServerDate } from '~/lib/format/date'
import { formatDurationBetween } from '~/lib/format/duration'
import { formatPrice } from '~/lib/format/money'
import { pageHead } from '~/lib/seo'

export const Route = createFileRoute('/dashboard')({
  head: () => pageHead('מרכז הבקרה', 'ההזמנות, מסמכי הטיסה והמסע הבא שלכם במקום אחד.'),
  component: () => (
    <RequireAuth message="כדי להיכנס למרכז הבקרה צריך להתחבר.">
      <Dashboard />
    </RequireAuth>
  ),
})

function greeting() {
  const h = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Asia/Jerusalem' }).format(new Date()))
  if (h < 5) return 'לילה טוב'
  if (h < 12) return 'בוקר טוב'
  if (h < 18) return 'צהריים טובים'
  if (h < 22) return 'ערב טוב'
  return 'לילה טוב'
}

function Dashboard() {
  const session = useSession()!
  const hydrated = useHydrated()
  const qc = useQueryClient()
  const isPassenger = session.profile.role === 'Passenger'
  const q = useQuery({ ...myOrdersQuery(isPassenger ? session.profile.id : null) })
  const [toCancel, setToCancel] = useState<Order | null>(null)

  const orders = useMemo(() => [...(q.data?.orders ?? [])].sort((a, b) => parseServerDate(b.flight.departureTime).getTime() - parseServerDate(a.flight.departureTime).getTime()), [q.data])
  const now = Date.now()
  const upcoming = orders.filter((o) => o.status === 'Confirmed' && parseServerDate(o.flight.departureTime).getTime() > now).reverse()
  const next = upcoming[0]
  const others = orders.filter((o) => o !== next)
  const daysAway = next ? Math.max(0, Math.floor((parseServerDate(next.flight.departureTime).getTime() - now) / 86_400_000)) : 0

  const cancel = useMutation({
    mutationFn: (o: Order) => cancelOrder(o),
    onSuccess: () => {
      toast('ההזמנה בוטלה והמושב שוחרר.', 'success')
      setToCancel(null)
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['flights'] })
      qc.invalidateQueries({ queryKey: ['flight'] })
    },
    onError: (e) => {
      setToCancel(null)
      const msg = isApiError(e)
        ? e.kind === 'forbidden' || e.kind === 'unauthorized'
          ? 'אין הרשאה לבטל את ההזמנה הזו.'
          : e.kind === 'conflict'
            ? 'לא ניתן לבטל את ההזמנה: היא כבר בוטלה או שהמסע יצא לדרך.'
            : e.message
        : 'הביטול נכשל. נסו שוב.'
      toast(msg, 'danger')
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-32 sm:px-8 lg:pt-40">
      <header className="flex flex-col gap-4">
        <p className="text-caption text-accent">מרכז הבקרה</p>
        <h1 className="text-headline">
          {hydrated ? greeting() : 'שלום'}, {session.profile.name.split(' ')[0]}.
        </h1>
        {isPassenger && q.isSuccess && (
          <p className="text-lead text-foreground-muted">
            {next ? (
              <>
                המסע הבא שלכם נמצא במרחק <span className="num text-foreground">{daysAway}</span> {daysAway === 1 ? 'יום' : 'ימים'}.
              </>
            ) : (
              'אין לכם מסעות קרובים. אולי הגיע הזמן לבחור יעד?'
            )}
          </p>
        )}
        <DemoNotice source={q.data?.source} />
      </header>

      {!isPassenger && (
        <div className="mt-12">
          <EmptyState title="מרכז הבקרה זמין לנוסעים" text="חשבון מנהל אינו מזמין מסעות. ניהול הטיסות והמשתמשים מתבצע דרך ממשק הניהול של השרת." action={<Link to="/flights" className={buttonClasses()}>לצפייה במסעות</Link>} />
        </div>
      )}

      {isPassenger && q.isPending && <div className="mt-12"><CardSkeletons count={2} /></div>}
      {isPassenger && q.isError && (
        <div className="mt-12">
          <ErrorState text={isApiError(q.error) ? q.error.message : undefined} onRetry={() => q.refetch()} retrying={q.isFetching} />
        </div>
      )}

      {isPassenger && q.isSuccess && orders.length === 0 && (
        <div className="mt-12">
          <EmptyState art="mars" title="עוד לא הזמנתם מסע" text="כשתזמינו, כל מסמכי הטיסה והספירה לאחור יופיעו כאן." action={<Link to="/flights" className={buttonClasses({ size: 'lg' })}>מצאו את המסע שלכם</Link>} />
        </div>
      )}

      {next && (
        <Reveal className="mt-12 flex flex-col gap-6">
          <NextTrip order={next} passenger={session.profile.name} />
          <LaunchClock flight={next.flight} />
        </Reveal>
      )}

      {others.length > 0 && (
        <section className="mt-16" aria-labelledby="all-orders">
          <h2 id="all-orders" className="mb-6 text-title">{next ? 'כל ההזמנות' : 'ההזמנות שלכם'}</h2>
          <ul className="flex flex-col gap-4">
            {others.map((o) => (
              <li key={o.id}><OrderRow order={o} onCancel={() => setToCancel(o)} /></li>
            ))}
          </ul>
        </section>
      )}

      {next && (
        <div className="mt-6 flex justify-end">
          <Button variant="danger" size="sm" onClick={() => setToCancel(next)}>ביטול ההזמנה הקרובה</Button>
        </div>
      )}

      <Dialog open={!!toCancel} onOpenChange={(o) => !o && !cancel.isPending && setToCancel(null)} title="לבטל את ההזמנה?" description="המושב ישוחרר ויהיה זמין לנוסעים אחרים. לא ניתן לשחזר את ההזמנה אחרי הביטול.">
        {toCancel && (
          <div className="flex flex-col gap-6">
            <p className="rounded-card border border-border bg-surface-sunken p-4">
              <span className="num font-medium">{toCancel.flight.flightNumber}</span> · {formatDate(toCancel.flight.departureTime)} · {toCancel.flight.departureAirport} ← {destinationFor(toCancel.flight.arrivalAirport).name}
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="ghost" onClick={() => setToCancel(null)} disabled={cancel.isPending}>השארת ההזמנה</Button>
              <Button variant="danger" loading={cancel.isPending} onClick={() => cancel.mutate(toCancel)}>כן, לבטל</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

function NextTrip({ order, passenger }: { order: Order; passenger: string }) {
  const f = order.flight
  const d = destinationFor(f.arrivalAirport)
  const extras = typeof window === 'undefined' ? undefined : loadOrderExtras(order.id)
  const steps = [
    { label: 'פרטי נוסע אומתו', done: true },
    { label: 'תשלום הושלם', done: true },
    { label: 'בדיקה רפואית', done: false },
  ]
  return (
    <article className="glass relative grid gap-8 overflow-hidden rounded-panel p-6 shadow-lift sm:p-9 lg:grid-cols-[1.2fr_1fr]" aria-label="המסע הבא">
      <div aria-hidden="true" className="pointer-events-none absolute -end-14 -top-14 opacity-80"><PlanetArt kind={d.planet} size={220} period={120} /></div>
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="success" dot>מאושר</Badge>
          <span className="num rounded-md border border-border px-2 py-0.5 text-caption">{f.flightNumber}</span>
        </div>
        <h2 className="text-headline">{f.departureAirport} ← {d.name}</h2>
        <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <div><dt className="text-caption text-foreground-subtle">תאריך</dt><dd className="font-medium">{formatDate(f.departureTime)}</dd></div>
          <div><dt className="text-caption text-foreground-subtle">שעת יציאה</dt><dd className="num font-medium">{formatTime(f.departureTime)}</dd></div>
          <div><dt className="text-caption text-foreground-subtle">מסלול</dt><dd className="font-medium">ישיר · {formatDurationBetween(f.departureTime, f.arrivalTime)}</dd></div>
          <div><dt className="text-caption text-foreground-subtle">נוסע</dt><dd className="font-medium">{passenger}</dd></div>
          <div><dt className="text-caption text-foreground-subtle">מושב</dt><dd className="num font-medium">{extras?.seat ?? '—'}</dd></div>
          <div><dt className="text-caption text-foreground-subtle">שולם</dt><dd className="num font-medium">{formatPrice(f.price)}</dd></div>
        </dl>
        <div>
          <Link to="/confirmation/$orderId" params={{ orderId: String(order.id) }} className={buttonClasses({ variant: 'secondary' })}>
            <Download className="size-4" />
            מסמכי טיסה
          </Link>
        </div>
      </div>
      <div className="relative rounded-card border border-border bg-surface-sunken/60 p-6">
        <h3 className="text-title">מוכנות למסע</h3>
        <p className="mt-1 text-caption text-foreground-subtle"><span className="num">2</span> מתוך <span className="num">3</span> שלבים הושלמו</p>
        <ol className="mt-5 flex flex-col gap-4">
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-center gap-3">
              <span className={`grid size-7 shrink-0 place-items-center rounded-full border text-caption ${s.done ? 'border-success bg-success-soft text-success' : 'border-border-strong text-foreground-subtle'}`}>
                {s.done ? <Check className="size-4" /> : <span className="num">{i + 1}</span>}
              </span>
              <span className={s.done ? 'text-foreground' : 'text-foreground-muted'}>{s.label}</span>
              {!s.done && <span className="ms-auto text-caption text-foreground-subtle">השלב הבא</span>}
            </li>
          ))}
        </ol>
      </div>
    </article>
  )
}

function OrderRow({ order, onCancel }: { order: Order; onCancel: () => void }) {
  const f = order.flight
  const d = destinationFor(f.arrivalAirport)
  const cancelled = order.status === 'Cancelled'
  const past = parseServerDate(f.departureTime).getTime() <= Date.now()
  return (
    <article className="glass flex flex-wrap items-center gap-5 rounded-card p-5">
      <PlanetArt kind={d.planet} size={52} period={100} />
      <div className="min-w-48 flex-1">
        <p className="font-medium">
          <span className="num">{f.flightNumber}</span> · {f.departureAirport} ← {d.name}
        </p>
        <p className="text-caption text-foreground-subtle">{formatDate(f.departureTime)} · <span className="num">{formatTime(f.departureTime)}</span></p>
      </div>
      <Badge tone={cancelled ? 'danger' : past ? 'neutral' : 'success'} dot>{cancelled ? 'בוטל' : past ? 'הושלם' : 'מאושר'}</Badge>
      <div className="flex gap-2">
        <Link to="/confirmation/$orderId" params={{ orderId: String(order.id) }} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>מסמכים</Link>
        {!cancelled && !past && <Button variant="ghost" size="sm" onClick={onCancel}>ביטול</Button>}
      </div>
    </article>
  )
}
