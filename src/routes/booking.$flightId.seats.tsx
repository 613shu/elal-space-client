import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useBooking } from '~/components/booking/BookingContext'
import { SeatMap } from '~/components/booking/SeatMap'
import { WindowView } from '~/components/booking/WindowView'
import { Button, buttonClasses } from '~/components/ui/Button'
import { Eyebrow } from '~/components/ui/Eyebrow'
import { buildCabin, sideLabel } from '~/lib/booking/seats'
import { updateDraft, useDraft } from '~/lib/booking/store'
import { destinationFor } from '~/lib/content/generic'
import { pageHead } from '~/lib/seo'

export const Route = createFileRoute('/booking/$flightId/seats')({
  head: () => pageHead('בחירת מושב'),
  component: SeatsStep,
})

function SeatsStep() {
  const { flight, refetch, refetching } = useBooking()
  const draft = useDraft(flight.id)
  const nav = useNavigate()
  const cabin = useMemo(() => buildCabin(flight), [flight])
  const d = destinationFor(flight.arrivalAirport)
  const seat = cabin.seats.find((s) => s.id === draft.seat && !s.taken)

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4">
        <Eyebrow>שלב 1 מתוך 4</Eyebrow>
        <h1 className="text-headline">בחרו את המושב שלכם</h1>
        <p className="max-w-2xl text-lead text-foreground-muted">
          לכל תא חלון פרטי. המושבים בצד אחד פונים אל כדור הארץ בתחילת המסע, ובצד השני אל {d.name}. המחיר זהה לכל המושבים.
        </p>
      </header>

      <div className="grid gap-10 xl:grid-cols-[1fr_17rem] xl:items-start">
        <div>
          <SeatMap cabin={cabin} selected={seat?.id} onSelect={(id) => updateDraft(flight.id, { seat: id })} />
          <p role="status" aria-live="polite" className="mt-6 text-center text-body text-foreground-muted">
            {seat ? (
              <>
                נבחר מושב <span className="num font-semibold text-foreground">{seat.id}</span> · {sideLabel(seat.side)}
              </>
            ) : (
              'בחרו מושב פנוי כדי להמשיך'
            )}
          </p>
          <p className="mt-2 text-center text-caption text-foreground-subtle">
            <span className="num">{flight.availableSeats}</span> מתוך <span className="num">{flight.numOfSeats}</span> מושבים פנויים.{' '}
            <button type="button" onClick={() => refetch()} className="text-primary underline underline-offset-4" disabled={refetching}>
              {refetching ? 'מרעננים…' : 'רענון זמינות'}
            </button>
          </p>
        </div>
        {seat && <WindowView side={seat.side} art={d.planet} destination={d.name} />}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
        <Link to="/flights/$flightId" params={{ flightId: String(flight.id) }} className={buttonClasses({ variant: 'ghost' })}>
          חזרה לפרטי המסע
        </Link>
        <Button
          size="lg"
          disabled={!seat}
          onClick={() => nav({ to: '/booking/$flightId/passengers', params: { flightId: String(flight.id) } })}
        >
          המשך לפרטי הנוסע
        </Button>
      </div>
    </div>
  )
}
