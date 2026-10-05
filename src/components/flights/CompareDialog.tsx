import { Link } from '@tanstack/react-router'
import { Dialog } from '~/components/ui/Dialog'
import { buttonClasses } from '~/components/ui/Button'
import type { Flight } from '~/lib/api/types'
import { amenityNames, destinationOf, isBookable, seatsLabel } from '~/lib/flights'
import { formatDate, formatTime } from '~/lib/format/date'
import { durationMs, formatDuration } from '~/lib/format/duration'
import { formatPrice } from '~/lib/format/money'

/** טבלת השוואה: השורה הטובה ביותר בכל קטגוריה מודגשת */
export function CompareDialog({ open, onOpenChange, flights }: { open: boolean; onOpenChange: (o: boolean) => void; flights: Flight[] }) {
  const cheapest = Math.min(...flights.map((f) => f.price))
  const shortest = Math.min(...flights.map((f) => durationMs(f.departureTime, f.arrivalTime)))
  const mostSeats = Math.max(...flights.map((f) => f.availableSeats))
  const all = [...new Set(flights.flatMap(amenityNames))]

  const rows: Array<{ label: string; cell: (f: Flight) => React.ReactNode; best?: (f: Flight) => boolean }> = [
    { label: 'יעד', cell: (f) => destinationOf(f)?.name ?? f.arrivalAirport },
    { label: 'יציאה', cell: (f) => <>{formatDate(f.departureTime)}<br /><span className="num text-foreground-subtle">{formatTime(f.departureTime)}</span></> },
    { label: 'משך', cell: (f) => formatDuration(durationMs(f.departureTime, f.arrivalTime)), best: (f) => durationMs(f.departureTime, f.arrivalTime) === shortest },
    { label: 'מחיר', cell: (f) => <span className="num">{formatPrice(f.price)}</span>, best: (f) => f.price === cheapest },
    { label: 'מקומות', cell: (f) => seatsLabel(f), best: (f) => f.availableSeats === mostSeats },
    ...all.map((a) => ({
      label: a,
      cell: (f: Flight) => (amenityNames(f).includes(a) ? <span className="text-success" aria-label="כלול">✓</span> : <span className="text-foreground-subtle" aria-label="לא כלול">—</span>),
    })),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="השוואת מסעות" description="הערך הטוב ביותר בכל שורה מסומן בכחול." className="w-[min(96vw,60rem)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-separate border-spacing-0 text-start">
          <thead>
            <tr>
              <th scope="col" className="sticky start-0 bg-surface p-3 text-start text-caption font-medium text-foreground-subtle"><span className="sr-only">קטגוריה</span></th>
              {flights.map((f) => (
                <th key={f.id} scope="col" className="p-3 text-start">
                  <span className="num rounded-md border border-border bg-surface-sunken px-2 py-0.5 text-caption">{f.flightNumber}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="group">
                <th scope="row" className="sticky start-0 border-t border-border bg-surface p-3 text-start text-caption font-medium text-foreground-muted">{r.label}</th>
                {flights.map((f) => (
                  <td key={f.id} className={`border-t border-border p-3 ${r.best?.(f) ? 'font-semibold text-primary' : 'text-foreground'}`}>
                    {r.cell(f)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="border-t border-border p-3" />
              {flights.map((f) => (
                <td key={f.id} className="border-t border-border p-3">
                  <Link to="/flights/$flightId" params={{ flightId: String(f.id) }} className={buttonClasses({ size: 'sm', variant: isBookable(f) ? 'primary' : 'secondary' })}>
                    {isBookable(f) ? 'לבחירה' : 'לפרטים'}
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Dialog>
  )
}
