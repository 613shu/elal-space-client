import { Link, type ErrorComponentProps } from '@tanstack/react-router'
import { PlanetArt } from '~/components/space/PlanetArt'
import { buttonClasses } from '~/components/ui/Button'

export function NotFoundPage() {
  return (
    <main className="mx-auto grid min-h-[80dvh] max-w-5xl place-items-center px-5 pt-28 text-center">
      <div className="flex flex-col items-center gap-8">
        <PlanetArt kind="moon" size={180} period={90} />
        <p className="font-display text-title text-foreground-muted">404</p>
        <h1 className="text-headline">הלכתם רחוק מדי.</h1>
        <p className="max-w-md text-lead text-foreground-muted">
          הדף שחיפשתם לא נמצא במפה. אולי הוא עדיין לא נבנה, ואולי הוא פשוט מעבר לאופק.
        </p>
        <Link to="/" className={buttonClasses({ size: 'lg' })}>
          חזרה לכדור הארץ
        </Link>
      </div>
    </main>
  )
}

export function ErrorPage({ error, reset }: ErrorComponentProps) {
  return (
    <main className="mx-auto grid min-h-[80dvh] max-w-5xl place-items-center px-5 pt-28 text-center" role="alert">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-headline">אות חלש מהספינה.</h1>
        <p className="max-w-md text-lead text-foreground-muted">
          משהו השתבש בטעינת העמוד. אפשר לנסות שוב, ואם זה חוזר, הצוות כבר יודע.
        </p>
        {import.meta.env.DEV && <pre dir="ltr" className="max-w-full overflow-auto rounded-control bg-surface-sunken p-4 text-start text-caption text-destructive">{(error as Error).message}</pre>}
        <div className="flex gap-3">
          <button type="button" onClick={reset} className={buttonClasses({ size: 'lg' })}>נסו שוב</button>
          <Link to="/" className={buttonClasses({ size: 'lg', variant: 'secondary' })}>לדף הבית</Link>
        </div>
      </div>
    </main>
  )
}
