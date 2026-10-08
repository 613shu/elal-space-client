import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { SelectField } from '~/components/ui/Field'
import { Plus, Users } from '~/components/ui/Icons'
import { PHASE_LABEL, matches, type FlightPhase, type FlightRow } from '~/lib/admin/stats'
import { destinationFor } from '~/lib/content/generic'
import { sortByDeparture } from '~/lib/flights'
import { formatDate, formatTime } from '~/lib/format/date'
import { formatPrice } from '~/lib/format/money'
import { Cell, Chips, DataTable, OccupancyMeter, PlanetBadge, Row, SearchBox, TableEmpty } from './parts'

type PhaseFilter = 'all' | FlightPhase
type Sort = 'date' | 'occupancy' | 'travelers'

const PHASE_TONE: Record<FlightPhase, 'success' | 'neutral' | 'danger' | 'primary'> = {
  upcoming: 'success',
  departed: 'primary',
  cancelled: 'danger',
  completed: 'neutral',
}

interface Props {
  rows: FlightRow[]
  onShowPassengers: (row: FlightRow) => void
  onCancel: (row: FlightRow) => void
  onEdit: (row: FlightRow) => void
  onCreate: () => void
}

export function FlightsPanel({ rows, onShowPassengers, onCancel, onEdit, onCreate }: Props) {
  const [query, setQuery] = useState('')
  const [phase, setPhase] = useState<PhaseFilter>('upcoming')
  const [sort, setSort] = useState<Sort>('date')

  const count = (p: FlightPhase) => rows.filter((r) => r.phase === p).length
  const options = [
    { value: 'upcoming' as const, label: 'מתוכננים', count: count('upcoming') },
    { value: 'departed' as const, label: 'יצאו לדרך', count: count('departed') },
    { value: 'completed' as const, label: 'הושלמו', count: count('completed') },
    { value: 'cancelled' as const, label: 'בוטלו', count: count('cancelled') },
    { value: 'all' as const, label: 'הכול', count: rows.length },
  ].filter((o) => o.value === 'all' || o.value === 'upcoming' || o.count > 0)

  const shown = useMemo(() => {
    const list = rows.filter(
      (r) => (phase === 'all' || r.phase === phase) && matches(query, r.flight.flightNumber, r.flight.arrivalAirport, r.flight.departureAirport, destinationFor(r.flight.arrivalAirport).name),
    )
    return list.sort(
      sort === 'occupancy'
        ? (a, b) => b.occupancy - a.occupancy
        : sort === 'travelers'
          ? (a, b) => b.booked - a.booked
          : (a, b) => (phase === 'upcoming' ? 1 : -1) * sortByDeparture(a.flight, b.flight),
    )
  }, [rows, phase, query, sort])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Chips label="סינון מסעות לפי מצב" value={phase} onChange={setPhase} options={options} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <SearchBox value={query} onChange={setQuery} label="חיפוש לפי מספר טיסה או יעד" />
          <SelectField label="מיון" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="shrink-0 sm:w-56 [&>label]:sr-only [&_select]:h-11 [&_select]:rounded-full">
            <option value="date">לפי תאריך יציאה</option>
            <option value="travelers">לפי מספר נוסעים</option>
            <option value="occupancy">לפי תפוסה</option>
          </SelectField>
          <Button icon={<Plus className="size-4" />} onClick={onCreate} className="shrink-0">
            מסע חדש
          </Button>
        </div>
      </div>

      <DataTable
        caption="כל המסעות ומספר הנוסעים הרשומים בכל אחד"
        head={['מסע', 'יציאה', 'נוסעים רשומים', 'מחיר', 'מצב', '']}
        empty={shown.length === 0 ? <TableEmpty text={rows.length === 0 ? 'עדיין אין מסעות במערכת.' : 'אין מסעות שמתאימים לחיפוש.'} /> : undefined}
      >
        {shown.map((r, i) => {
          const f = r.flight
          const d = destinationFor(f.arrivalAirport)
          return (
            <Row key={f.id} index={i} dim={r.phase === 'cancelled'}>
              <Cell primary>
                <div className="flex items-center gap-3">
                  <PlanetBadge kind={d.planet} />
                  <div className="min-w-0">
                    <Link to="/flights/$flightId" params={{ flightId: String(f.id) }} className="font-medium text-foreground underline-offset-4 hover:underline">
                      <span className="num">{f.flightNumber}</span>
                    </Link>
                    <p className="truncate text-caption text-foreground-muted">
                      {f.departureAirport} ← {d.name}
                    </p>
                  </div>
                </div>
              </Cell>
              <Cell label="יציאה">
                <p className="whitespace-nowrap text-foreground">{formatDate(f.departureTime)}</p>
                <p className="num text-caption text-foreground-subtle">{formatTime(f.departureTime)}</p>
              </Cell>
              <Cell label="נוסעים רשומים" className="md:w-56">
                <OccupancyMeter booked={r.booked} seats={f.numOfSeats} className="max-md:w-40" />
              </Cell>
              <Cell label="מחיר">
                <span className="num whitespace-nowrap">{formatPrice(f.price)}</span>
              </Cell>
              <Cell label="מצב">
                <Badge tone={PHASE_TONE[r.phase]} dot>
                  {PHASE_LABEL[r.phase]}
                </Badge>
              </Cell>
              <Cell>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="secondary" icon={<Users className="size-4" />} onClick={() => onShowPassengers(r)}>
                    נוסעים
                  </Button>
                  {r.phase === 'upcoming' && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => onEdit(r)} aria-label={`עריכת מסע ${f.flightNumber}`}>
                        עריכה
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onCancel(r)} aria-label={`ביטול מסע ${f.flightNumber}`}>
                        ביטול
                      </Button>
                    </>
                  )}
                </div>
              </Cell>
            </Row>
          )
        })}
      </DataTable>
    </div>
  )
}
