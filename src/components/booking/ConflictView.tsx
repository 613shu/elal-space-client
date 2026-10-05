import { Link } from '@tanstack/react-router'
import { PlanetArt } from '~/components/space/PlanetArt'
import { Button, buttonClasses } from '~/components/ui/Button'
import type { ApiError } from '~/lib/api/errors'
import type { Flight } from '~/lib/api/types'
import { destinationFor } from '~/lib/content/generic'

type Kind = 'seats' | 'duplicate' | 'unavailable' | 'changed'

/** מזהה מה בדיוק קרה לפי הודעת השרת (אנגלית), ונופל לניסוח כללי אם לא מכירים */
export function classifyConflict(err: ApiError): Kind {
  const m = (err.serverMessage ?? '').toLowerCase()
  if (m.includes('no seats') || m.includes('seat')) return 'seats'
  if (m.includes('already') || m.includes('active order') || m.includes('duplicate')) return 'duplicate'
  if (m.includes('cancel') || m.includes('depart') || m.includes('scheduled') || m.includes('not available')) return 'unavailable'
  return 'changed'
}

const COPY: Record<Kind, { title: string; text: string }> = {
  seats: {
    title: 'המושב האחרון נתפס',
    text: 'נוסע אחר השלים את ההזמנה שנייה לפניכם, והמסע התמלא. לא חויבתם ולא נרשמה על שמכם הזמנה.',
  },
  duplicate: {
    title: 'כבר יש לכם הזמנה למסע הזה',
    text: 'בחשבון שלכם קיימת הזמנה פעילה במסע הזה. אפשר לראות אותה במרכז הבקרה.',
  },
  unavailable: {
    title: 'המסע אינו זמין יותר',
    text: 'המסע בוטל, יצא לדרך או שונה מאז שהתחלתם. לא חויבתם.',
  },
  changed: {
    title: 'המצב השתנה בזמן שהתחלתם',
    text: 'מישהו שינה את המסע בדיוק כשניסיתם להזמין. רעננו את הפרטים ונסו שוב. לא חויבתם.',
  },
}

export function ConflictView({ error, flight, onRetry, retrying }: { error: ApiError; flight: Flight; onRetry: () => void; retrying: boolean }) {
  const kind = classifyConflict(error)
  const d = destinationFor(flight.arrivalAirport)
  const c = COPY[kind]
  return (
    <div role="alert" className="glass relative overflow-hidden rounded-panel border-warning/40 p-8 text-center shadow-lift sm:p-12">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,var(--color-warning-soft),transparent)]" />
      <div className="mx-auto mb-6 w-28 opacity-80">
        <PlanetArt kind={d.planet} size="100%" spin={false} />
      </div>
      <p className="text-caption text-warning">409 · התנגשות בין משתמשים</p>
      <h1 className="mt-3 text-headline">{c.title}</h1>
      <p className="mx-auto mt-4 max-w-lg text-lead text-foreground-muted">{c.text}</p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        {kind === 'duplicate' ? (
          <Link to="/dashboard" className={buttonClasses({ size: 'lg' })}>למרכז הבקרה</Link>
        ) : (
          <>
            <Link to="/flights" search={{ destination: d.slug === 'unknown' ? undefined : d.slug }} className={buttonClasses({ size: 'lg' })}>
              מסעות אחרים אל {d.name}
            </Link>
            {kind !== 'seats' && (
              <Button size="lg" variant="secondary" onClick={onRetry} loading={retrying}>
                רענון ונסיון נוסף
              </Button>
            )}
          </>
        )}
      </div>
      {error.correlationId && (
        <p className="mt-8 text-micro text-foreground-subtle">
          מזהה לתמיכה: <span dir="ltr" className="num">{error.correlationId}</span>
        </p>
      )}
    </div>
  )
}
