import { useMemo, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { matches, type CustomerRow } from '~/lib/admin/stats'
import { destinationFor } from '~/lib/content/generic'
import { formatDate } from '~/lib/format/date'
import { formatPrice } from '~/lib/format/money'
import { Avatar, Cell, Chips, DataTable, Row, SearchBox, TableEmpty } from './parts'

type Filter = 'all' | 'booked' | 'idle'

export function CustomersPanel({ rows, onShow }: { rows: CustomerRow[]; onShow: (row: CustomerRow) => void }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const booked = rows.filter((r) => r.active.length > 0).length
  const shown = useMemo(
    () =>
      rows
        .filter((r) => (filter === 'all' || (filter === 'booked') === r.active.length > 0) && matches(query, r.passenger.name, r.passenger.email))
        .sort((a, b) => b.active.length - a.active.length || a.passenger.name.localeCompare(b.passenger.name, 'he')),
    [rows, filter, query],
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Chips
          label="סינון לקוחות"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'כל הלקוחות', count: rows.length },
            { value: 'booked', label: 'עם הזמנה פעילה', count: booked },
            { value: 'idle', label: 'בלי הזמנה', count: rows.length - booked },
          ]}
        />
        <SearchBox value={query} onChange={setQuery} label="חיפוש לפי שם או דוא״ל" />
      </div>

      <DataTable
        caption="הלקוחות שנרשמו באתר"
        head={['לקוח', 'דוא״ל', 'הזמנות פעילות', 'המסע הקרוב', 'סך ההזמנות', '']}
        empty={shown.length === 0 ? <TableEmpty text={rows.length === 0 ? 'עדיין לא נרשמו לקוחות באתר.' : 'אין לקוחות שמתאימים לחיפוש.'} /> : undefined}
      >
        {shown.map((r, i) => (
          <Row key={r.passenger.id} index={i}>
            <Cell primary>
              <div className="flex items-center gap-3">
                <Avatar name={r.passenger.name} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{r.passenger.name}</p>
                  <p className="text-caption text-foreground-subtle">
                    לקוח מס׳ <span className="num">{r.passenger.id}</span>
                  </p>
                </div>
              </div>
            </Cell>
            <Cell label="דוא״ל">
              <a href={`mailto:${r.passenger.email}`} dir="ltr" className="break-all text-foreground-muted underline-offset-4 hover:text-foreground hover:underline">
                {r.passenger.email}
              </a>
            </Cell>
            <Cell label="הזמנות פעילות">
              <span className={r.active.length > 0 ? 'num font-medium text-foreground' : 'num text-foreground-subtle'}>{r.active.length}</span>
            </Cell>
            <Cell label="המסע הקרוב">
              {r.next ? (
                <>
                  <p className="whitespace-nowrap text-foreground">
                    <span className="num">{r.next.flight.flightNumber}</span> · {destinationFor(r.next.flight.arrivalAirport).name}
                  </p>
                  <p className="text-caption text-foreground-subtle">{formatDate(r.next.flight.departureTime)}</p>
                </>
              ) : (
                <span className="text-foreground-subtle">—</span>
              )}
            </Cell>
            <Cell label="סך ההזמנות">
              <span className="num whitespace-nowrap">{r.spent > 0 ? formatPrice(r.spent) : '—'}</span>
            </Cell>
            <Cell>
              <div className="flex justify-end">
                <Button size="sm" variant="secondary" onClick={() => onShow(r)}>
                  פרטים
                </Button>
              </div>
            </Cell>
          </Row>
        ))}
      </DataTable>
    </div>
  )
}
