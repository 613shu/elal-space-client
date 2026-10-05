import { useEffect, useMemo } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'motion/react'
import { BoardingPass } from '~/components/booking/BoardingPass'
import { RequireAuth } from '~/components/booking/RequireAuth'
import { Button, buttonClasses } from '~/components/ui/Button'
import { Download, Print } from '~/components/ui/Icons'
import { CardSkeletons, EmptyState, ErrorState } from '~/components/ui/StateViews'
import { myOrdersQuery } from '~/lib/api/queries'
import { isApiError } from '~/lib/api/errors'
import { useSession } from '~/lib/auth/store'
import { loadOrderExtras } from '~/lib/booking/store'
import { destinationFor } from '~/lib/content/generic'
import { buildIcs, downloadText } from '~/lib/ics'
import { pageHead } from '~/lib/seo'

export const Route = createFileRoute('/confirmation/$orderId')({
  head: () => pageHead('אישור הזמנה'),
  component: () => (
    <RequireAuth message="כדי לראות את ההזמנה צריך להתחבר.">
      <Confirmation />
    </RequireAuth>
  ),
})

function Confirmation() {
  const { orderId } = Route.useParams()
  const id = Number(orderId)
  const session = useSession()
  const reduce = useReducedMotion()
  const q = useQuery(myOrdersQuery(session?.profile.id ?? null))
  const order = useMemo(() => q.data?.orders.find((o) => o.id === id), [q.data, id])
  const extras = useMemo(() => (typeof window === 'undefined' ? undefined : loadOrderExtras(id)), [id])

  useEffect(() => {
    document.getElementById('confirm-title')?.focus({ preventScroll: true })
  }, [order])

  if (q.isPending) return <div className="mx-auto max-w-3xl px-5 pb-8 pt-36"><CardSkeletons count={1} /></div>
  if (q.isError) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-8 pt-40">
        <ErrorState text={isApiError(q.error) ? q.error.message : undefined} onRetry={() => q.refetch()} retrying={q.isFetching} />
      </div>
    )
  }
  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-8 pt-40">
        <EmptyState title="לא מצאנו את ההזמנה" text="ייתכן שהיא שייכת לחשבון אחר. כל ההזמנות שלכם מופיעות במרכז הבקרה." action={<Link to="/dashboard" className={buttonClasses()}>למרכז הבקרה</Link>} />
      </div>
    )
  }

  const d = destinationFor(order.flight.arrivalAirport)
  const cancelled = order.status === 'Cancelled'

  return (
    <div className="mx-auto max-w-5xl px-5 pb-16 pt-32 sm:px-8 lg:pt-40">
      <header className="flex flex-col items-center gap-4 text-center">
        <motion.span
          aria-hidden="true"
          initial={reduce ? false : { scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 0.2 }}
          className={`grid size-20 place-items-center rounded-full border-2 text-4xl ${cancelled ? 'border-destructive text-destructive' : 'border-success text-success shadow-glow-accent'}`}
        >
          {cancelled ? '×' : '✓'}
        </motion.span>
        <h1 id="confirm-title" tabIndex={-1} className="text-headline outline-none">
          {cancelled ? 'ההזמנה בוטלה' : 'המסע שלכם מאושר.'}
        </h1>
        <p className="max-w-xl text-lead text-foreground-muted">
          {cancelled ? 'המושב שוחרר ויהיה זמין לנוסעים אחרים.' : `הזמנה מספר ${order.id} נרשמה בהצלחה. ממתינים לכם ב${order.flight.departureAirport}, ומשם אל ${d.name}.`}
        </p>
      </header>

      <motion.div
        className="mt-12"
        initial={reduce ? false : { opacity: 0, y: 40, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformPerspective: 1400 }}
      >
        <BoardingPass order={order} extras={extras} passenger={session?.profile.name} />
      </motion.div>

      <div className="no-print mt-10 flex flex-wrap justify-center gap-3">
        {!cancelled && (
          <Button variant="secondary" icon={<Download className="size-4" />} onClick={() => downloadText(`elal-space-${order.flight.flightNumber.replace(/\s/g, '')}.ics`, buildIcs(order, d.name, extras?.seat))}>
            הוספה ליומן
          </Button>
        )}
        <Button variant="secondary" icon={<Print className="size-4" />} onClick={() => window.print()}>
          הדפסה או שמירה כ־PDF
        </Button>
        <Link to="/dashboard" className={buttonClasses()}>למרכז הבקרה</Link>
        <Link to="/flights" className={buttonClasses({ variant: 'ghost' })}>מסע נוסף</Link>
      </div>
    </div>
  )
}
