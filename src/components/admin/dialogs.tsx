import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'motion/react'
import { PlanetArt } from '~/components/space/PlanetArt'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { Dialog } from '~/components/ui/Dialog'
import { SelectField, TextField } from '~/components/ui/Field'
import { isConfirmed, PHASE_LABEL, type CustomerRow, type FlightRow } from '~/lib/admin/stats'
import { createFlight } from '~/lib/api/endpoints'
import { isApiError } from '~/lib/api/errors'
import { amenitiesQuery } from '~/lib/api/queries'
import type { AdminOrder, Flight, FlightRequest } from '~/lib/api/types'
import { OPEN_DESTINATIONS } from '~/lib/content/destinations'
import { destinationFor } from '~/lib/content/generic'
import { hasDeparted } from '~/lib/flights'
import { formatDate, formatDateTime, formatTime } from '~/lib/format/date'
import { formatPrice } from '~/lib/format/money'
import { Avatar, OccupancyMeter } from './parts'

function Stagger({ children, index }: { children: React.ReactNode; index: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + Math.min(index, 12) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-border bg-surface-sunken/60 p-4"
    >
      {children}
    </motion.li>
  )
}

/* ------------------------------ נוסעי המסע ------------------------------ */

export function FlightPassengersDialog({ row, onClose, onCancelOrder }: { row: FlightRow | null; onClose: () => void; onCancelOrder: (o: AdminOrder) => void }) {
  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()} title={row ? `נוסעי מסע ${row.flight.flightNumber}` : 'נוסעי המסע'} className="w-[min(94vw,46rem)]">
      {row && <FlightPassengers row={row} onCancelOrder={onCancelOrder} />}
    </Dialog>
  )
}

function FlightPassengers({ row, onCancelOrder }: { row: FlightRow; onCancelOrder: (o: AdminOrder) => void }) {
  const f = row.flight
  const d = destinationFor(f.arrivalAirport)
  const canCancel = row.phase === 'upcoming'
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-5 rounded-card border border-border bg-surface-sunken/60 p-5">
        <PlanetArt kind={d.planet} size={64} period={100} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-medium text-foreground">
              {f.departureAirport} ← {d.name}
            </p>
            <Badge tone={row.phase === 'upcoming' ? 'success' : row.phase === 'cancelled' ? 'danger' : 'neutral'} dot>
              {PHASE_LABEL[row.phase]}
            </Badge>
          </div>
          <p className="text-caption text-foreground-subtle">
            {formatDate(f.departureTime)} · <span className="num">{formatTime(f.departureTime)}</span> · <span className="num">{formatPrice(f.price)}</span> לנוסע
          </p>
          <OccupancyMeter booked={row.booked} seats={f.numOfSeats} size="lg" className="mt-4" />
        </div>
      </div>

      {row.orders.length === 0 ? (
        <p className="py-6 text-center text-foreground-muted">{row.booked > 0 ? 'אין הזמנות מהאתר למסע הזה.' : 'עדיין אין נוסעים רשומים למסע הזה.'}</p>
      ) : (
        <ol className="flex flex-col gap-2.5" aria-label="רשימת הנוסעים">
          {row.orders.map((o, i) => (
            <Stagger key={o.id} index={i}>
              <span className="num w-6 text-center text-caption text-foreground-subtle">{i + 1}</span>
              <Avatar name={o.passenger?.name ?? '?'} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{o.passenger?.name ?? 'נוסע לא ידוע'}</p>
                {o.passenger?.email && <p dir="ltr" className="truncate text-end text-caption text-foreground-subtle">{o.passenger.email}</p>}
              </div>
              <p className="text-caption text-foreground-subtle">נרשם ב־{formatDate(o.orderDateTime)}</p>
              {canCancel && (
                <Button size="sm" variant="ghost" onClick={() => onCancelOrder(o)} aria-label={`ביטול ההזמנה של ${o.passenger?.name ?? 'הנוסע'}`}>
                  ביטול
                </Button>
              )}
            </Stagger>
          ))}
        </ol>
      )}

      {row.offline > 0 && (
        <p className="rounded-card border border-border bg-surface-sunken/60 p-4 text-caption text-foreground-muted">
          <span className="num font-medium text-foreground">{row.offline}</span> {row.offline === 1 ? 'מושב נוסף תפוס' : 'מושבים נוספים תפוסים'} לפי מונה המושבים של המסע, בלי הזמנה רשומה באתר.
        </p>
      )}
    </div>
  )
}

/* ------------------------------ כרטיס לקוח ------------------------------ */

export function CustomerDialog({ row, onClose, onCancelOrder }: { row: CustomerRow | null; onClose: () => void; onCancelOrder: (o: AdminOrder) => void }) {
  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()} title={row?.passenger.name ?? 'פרטי לקוח'} className="w-[min(94vw,44rem)]">
      {row && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4 rounded-card border border-border bg-surface-sunken/60 p-5">
            <Avatar name={row.passenger.name} />
            <div className="min-w-0 flex-1">
              <a href={`mailto:${row.passenger.email}`} dir="ltr" className="block break-all text-end text-foreground underline-offset-4 hover:underline">
                {row.passenger.email}
              </a>
              <p className="text-caption text-foreground-subtle">
                לקוח מס׳ <span className="num">{row.passenger.id}</span>
              </p>
            </div>
            <dl className="flex gap-6 text-center">
              <div>
                <dd className="num font-display text-title text-foreground">{row.active.length}</dd>
                <dt className="text-caption text-foreground-subtle">הזמנות פעילות</dt>
              </div>
              <div>
                <dd className="num font-display text-title text-foreground">{formatPrice(row.spent)}</dd>
                <dt className="text-caption text-foreground-subtle">סך ההזמנות</dt>
              </div>
            </dl>
          </div>

          {row.orders.length === 0 ? (
            <p className="py-6 text-center text-foreground-muted">הלקוח נרשם לאתר ועדיין לא הזמין מסע.</p>
          ) : (
            <ul className="flex flex-col gap-2.5" aria-label="ההזמנות של הלקוח">
              {row.orders.map((o, i) => {
                const ok = isConfirmed(o)
                const d = destinationFor(o.flight.arrivalAirport)
                return (
                  <Stagger key={o.id} index={i}>
                    <PlanetArt kind={d.planet} size={40} period={110} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        <span className="num">{o.flight.flightNumber}</span> · {d.name}
                      </p>
                      <p className="text-caption text-foreground-subtle">
                        יציאה: {formatDate(o.flight.departureTime)} · הוזמן ב־{formatDateTime(o.orderDateTime)}
                      </p>
                    </div>
                    <Badge tone={ok ? 'success' : 'danger'} dot>
                      {ok ? 'מאושרת' : 'בוטלה'}
                    </Badge>
                    {ok && !hasDeparted(o.flight) && (
                      <Button size="sm" variant="ghost" onClick={() => onCancelOrder(o)}>
                        ביטול
                      </Button>
                    )}
                  </Stagger>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </Dialog>
  )
}

/* ------------------------------ אישור פעולה ------------------------------ */

export function ConfirmDialog({ open, title, description, summary, confirmLabel, pending, onConfirm, onClose }: { open: boolean; title: string; description: string; summary?: React.ReactNode; confirmLabel: string; pending: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !pending && onClose()} title={title} description={description}>
      <div className="flex flex-col gap-6">
        {summary && <div className="rounded-card border border-border bg-surface-sunken p-4">{summary}</div>}
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            חזרה
          </Button>
          <Button variant="danger" loading={pending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

/* ------------------------------ מסע חדש ------------------------------ */

type Key = 'flightNumber' | 'departureAirport' | 'arrivalAirport' | 'departure' | 'arrival' | 'numOfSeats' | 'price'

const EMPTY: Record<Key, string> = { flightNumber: '', departureAirport: 'תל אביב', arrivalAirport: OPEN_DESTINATIONS[0]?.name ?? '', departure: '', arrival: '', numOfSeats: '24', price: '' }

export function NewFlightDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (f: Flight) => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} title="מסע חדש" description="המסע ייפתח להזמנות מיד עם השמירה." className="w-[min(94vw,46rem)]">
      {open && <NewFlightForm onClose={onClose} onCreated={onCreated} />}
    </Dialog>
  )
}

function NewFlightForm({ onClose, onCreated }: { onClose: () => void; onCreated: (f: Flight) => void }) {
  const [v, setV] = useState(EMPTY)
  const [picked, setPicked] = useState<number[]>([])
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({})
  const amenities = useQuery(amenitiesQuery())

  const save = useMutation({
    mutationFn: (req: FlightRequest) => createFlight(req),
    onSuccess: onCreated,
  })

  const set = (k: Key, value: string) => {
    setV((x) => ({ ...x, [k]: value }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Partial<Record<Key, string>> = {}
    const dep = v.departure ? new Date(v.departure) : null
    const arr = v.arrival ? new Date(v.arrival) : null
    const seats = Number(v.numOfSeats)
    const price = Number(v.price)
    if (v.flightNumber.trim().length < 2) next.flightNumber = 'נא להזין מספר טיסה'
    if (!v.departureAirport.trim()) next.departureAirport = 'נא להזין נקודת יציאה'
    if (!v.arrivalAirport.trim()) next.arrivalAirport = 'נא לבחור יעד'
    if (!dep || Number.isNaN(dep.getTime())) next.departure = 'נא לבחור מועד יציאה'
    else if (dep.getTime() <= Date.now()) next.departure = 'מועד היציאה חייב להיות בעתיד'
    if (!arr || Number.isNaN(arr.getTime())) next.arrival = 'נא לבחור מועד הגעה'
    else if (dep && arr.getTime() <= dep.getTime()) next.arrival = 'ההגעה חייבת להיות אחרי היציאה'
    if (!Number.isInteger(seats) || seats < 1) next.numOfSeats = 'מספר מושבים שלם וחיובי'
    if (!Number.isFinite(price) || price <= 0) next.price = 'נא להזין מחיר חיובי'
    setErrors(next)
    const first = Object.keys(next)[0]
    if (first) return void document.querySelector<HTMLElement>(`[data-nf="${first}"]`)?.focus()
    save.mutate({
      flightNumber: v.flightNumber.trim(),
      departureAirport: v.departureAirport.trim(),
      arrivalAirport: v.arrivalAirport.trim(),
      departureTime: dep!.toISOString(),
      arrivalTime: arr!.toISOString(),
      numOfSeats: seats,
      price,
      amenityIds: picked,
    })
  }

  const failure = save.isError ? (isApiError(save.error) ? (save.error.kind === 'validation' ? 'השרת דחה את הפרטים. בדקו את השדות ונסו שוב.' : save.error.message) : 'השמירה נכשלה. נסו שוב.') : null

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5" aria-label="טופס מסע חדש">
      {failure && (
        <div role="alert" className="rounded-card border border-destructive/50 bg-destructive-soft p-4 text-destructive">
          {failure}
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="מספר טיסה" data-nf="flightNumber" ltr placeholder="ES 120" value={v.flightNumber} onChange={(e) => set('flightNumber', e.target.value)} error={errors.flightNumber} />
        <TextField label="נקודת יציאה" data-nf="departureAirport" value={v.departureAirport} onChange={(e) => set('departureAirport', e.target.value)} error={errors.departureAirport} />
        <SelectField label="יעד" data-nf="arrivalAirport" value={v.arrivalAirport} onChange={(e) => set('arrivalAirport', e.target.value)} error={errors.arrivalAirport}>
          {OPEN_DESTINATIONS.map((d) => (
            <option key={d.slug} value={d.name}>
              {d.name}
            </option>
          ))}
        </SelectField>
        <TextField label="מספר מושבים" data-nf="numOfSeats" ltr inputMode="numeric" value={v.numOfSeats} onChange={(e) => set('numOfSeats', e.target.value.replace(/\D/g, ''))} error={errors.numOfSeats} />
        <TextField label="מועד יציאה" data-nf="departure" type="datetime-local" ltr value={v.departure} onChange={(e) => set('departure', e.target.value)} error={errors.departure} hint="לפי השעון במחשב שלכם" />
        <TextField label="מועד הגעה" data-nf="arrival" type="datetime-local" ltr value={v.arrival} min={v.departure || undefined} onChange={(e) => set('arrival', e.target.value)} error={errors.arrival} />
        <TextField label="מחיר לנוסע (₪)" data-nf="price" ltr inputMode="numeric" placeholder="184000" value={v.price} onChange={(e) => set('price', e.target.value.replace(/[^\d.]/g, ''))} error={errors.price} className="sm:col-span-2" />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-caption font-medium text-foreground-muted">מה כלול במסע</legend>
        {amenities.isPending && <p className="text-caption text-foreground-subtle">טוענים את רשימת השירותים…</p>}
        {amenities.isError && <p className="text-caption text-foreground-subtle">לא הצלחנו לטעון את רשימת השירותים. אפשר לשמור את המסע בלעדיהם.</p>}
        {amenities.data && amenities.data.length === 0 && <p className="text-caption text-foreground-subtle">לא הוגדרו שירותים במערכת.</p>}
        <div className="flex flex-wrap gap-2">
          {amenities.data?.map((a) => {
            const on = picked.includes(a.id)
            return (
              <label key={a.id} className={`cursor-pointer rounded-full border px-4 py-2 text-caption font-medium transition-colors duration-300 has-[:focus-visible]:shadow-focus ${on ? 'border-primary bg-primary-soft text-primary' : 'border-border text-foreground-muted hover:border-border-strong hover:text-foreground'}`}>
                <input type="checkbox" className="sr-only" checked={on} onChange={() => setPicked((p) => (on ? p.filter((x) => x !== a.id) : [...p, a.id]))} />
                {a.name}
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-2 flex flex-wrap justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
          ביטול
        </Button>
        <Button type="submit" loading={save.isPending}>
          שמירת המסע
        </Button>
      </div>
    </form>
  )
}
