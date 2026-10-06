import { useMemo, useState } from 'react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { isConfirmed, matches } from '~/lib/admin/stats'
import type { AdminOrder } from '~/lib/api/types'
import { destinationFor } from '~/lib/content/generic'
import { hasDeparted } from '~/lib/flights'
import { formatDate, formatDateTime, parseServerDate } from '~/lib/format/date'
import { formatPrice } from '~/lib/format/money'
import { Cell, Chips, DataTable, Row, SearchBox, TableEmpty } from './parts'

type Filter = 'all' | 'confirmed' | 'cancelled'

export function OrdersPanel({ orders, onCancel }: { orders: AdminOrder[]; onCancel: (o: AdminOrder) => void }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const confirmed = orders.filter(isConfirmed).length
  const shown = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            (filter === 'all' || (filter === 'confirmed') === isConfirmed(o)) &&
            matches(query, o.id, o.passenger?.name, o.passenger?.email, o.flight.flightNumber, destinationFor(o.flight.arrivalAirport).name),
        )
        .sort((a, b) => parseServerDate(b.orderDateTime).getTime() - parseServerDate(a.orderDateTime).getTime()),
    [orders, filter, query],
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Chips
          label="סינון הזמנות"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'כל ההזמנות', count: orders.length },
            { value: 'confirmed', label: 'מאושרות', count: confirmed },
            { value: 'cancelled', label: 'בוטלו', count: orders.length - confirmed },
          ]}
        />
        <SearchBox value={query} onChange={setQuery} label="חיפוש לפי לקוח, טיסה או מספר הזמנה" />
      </div>

      <DataTable
        caption="כל ההזמנות שבוצעו באתר"
        head={['הזמנה', 'לקוח', 'מסע', 'בוצעה בתאריך', 'סכום', 'מצב', '']}
        empty={shown.length === 0 ? <TableEmpty text={orders.length === 0 ? 'עדיין לא בוצעו הזמנות באתר.' : 'אין הזמנות שמתאימות לחיפוש.'} /> : undefined}
      >
        {shown.map((o, i) => {
          const ok = isConfirmed(o)
          return (
            <Row key={o.id} index={i} dim={!ok}>
              <Cell primary>
                <span className="num rounded-md border border-border bg-surface-sunken px-2 py-0.5 text-caption text-foreground">#{o.id}</span>
              </Cell>
              <Cell label="לקוח">
                <p className="font-medium text-foreground">{o.passenger?.name ?? '—'}</p>
                {o.passenger?.email && <p dir="ltr" className="break-all text-caption text-foreground-subtle">{o.passenger.email}</p>}
              </Cell>
              <Cell label="מסע">
                <p className="whitespace-nowrap text-foreground">
                  <span className="num">{o.flight.flightNumber}</span> · {destinationFor(o.flight.arrivalAirport).name}
                </p>
                <p className="text-caption text-foreground-subtle">יציאה: {formatDate(o.flight.departureTime)}</p>
              </Cell>
              <Cell label="בוצעה בתאריך">
                <span className="text-foreground-muted">{formatDateTime(o.orderDateTime)}</span>
              </Cell>
              <Cell label="סכום">
                <span className="num whitespace-nowrap">{formatPrice(o.flight.price)}</span>
              </Cell>
              <Cell label="מצב">
                <Badge tone={ok ? 'success' : 'danger'} dot>
                  {ok ? 'מאושרת' : 'בוטלה'}
                </Badge>
              </Cell>
              <Cell>
                <div className="flex justify-end">
                  {ok && !hasDeparted(o.flight) && (
                    <Button size="sm" variant="ghost" onClick={() => onCancel(o)} aria-label={`ביטול הזמנה ${o.id}`}>
                      ביטול
                    </Button>
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
