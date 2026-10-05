import { Link } from '@tanstack/react-router'
import { Logo, Wordmark } from '~/components/brand/Logo'

export function Footer() {
  return (
    <footer className="no-print relative mt-32 border-t border-border bg-background-deep/60 backdrop-blur-sm">
      <div className="hairline absolute inset-x-0 -top-px" />
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Logo size={52} />
            <Wordmark />
          </div>
          <p className="max-w-sm text-foreground-muted">
            מרכז הבקרה: צוות התמיכה שלנו פעיל מסביב לשעון כדור הארץ, בכל נקודה לאורך המסלול.
          </p>
        </div>
        <nav aria-label="תחתית: מסעות" className="flex flex-col gap-3">
          <h2 className="font-sans text-caption font-semibold text-foreground">מסעות</h2>
          <Link to="/flights" className="text-foreground-muted transition hover:text-foreground">כל המסעות</Link>
          <Link to="/destinations" className="text-foreground-muted transition hover:text-foreground">היעדים</Link>
          <Link to="/dashboard" className="text-foreground-muted transition hover:text-foreground">מרכז הבקרה האישי</Link>
        </nav>
        <nav aria-label="תחתית: יעדים" className="flex flex-col gap-3">
          <h2 className="font-sans text-caption font-semibold text-foreground">יעדים נבחרים</h2>
          <Link to="/destinations/$slug" params={{ slug: 'moon' }} className="text-foreground-muted transition hover:text-foreground">הירח</Link>
          <Link to="/destinations/$slug" params={{ slug: 'mars' }} className="text-foreground-muted transition hover:text-foreground">מאדים</Link>
          <Link to="/destinations/$slug" params={{ slug: 'saturn' }} className="text-foreground-muted transition hover:text-foreground">שבתאי</Link>
        </nav>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 border-t border-border px-5 py-6 text-caption text-foreground-subtle sm:flex-row sm:px-8">
        <p>© 2026 אל על חלל</p>
        <p>כל המסעות כפופים לתנאי מזג האוויר הקוסמי.</p>
      </div>
    </footer>
  )
}
