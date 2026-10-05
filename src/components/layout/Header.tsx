import { useEffect, useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { Logo, Wordmark } from '~/components/brand/Logo'
import { Dialog } from '~/components/ui/Dialog'
import { Menu, User, Logout } from '~/components/ui/Icons'
import { buttonClasses } from '~/components/ui/Button'
import { clearSession, useSession } from '~/lib/auth/store'
import { toast } from '~/components/ui/Toast'

const NAV = [
  { to: '/flights', label: 'מסעות' },
  { to: '/destinations', label: 'יעדים' },
] as const

export function Header() {
  const session = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const qc = useQueryClient()
  const path = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => setOpen(false), [path])

  const logout = () => {
    clearSession()
    qc.clear()
    toast('התנתקתם מהמערכת. להתראות בחלל.', 'success')
    nav({ to: '/' })
  }

  const firstName = session?.profile.name.split(' ')[0]

  return (
    <header
      className={clsx(
        'no-print fixed inset-x-0 top-0 z-40 transition-[background,border-color,backdrop-filter] duration-500',
        scrolled || open ? 'glass border-x-0 border-t-0' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link to="/" aria-label="אל על חלל: לדף הבית" className="flex items-center gap-3 rounded-control">
          <Logo size={44} />
          <Wordmark className="hidden sm:flex" />
        </Link>

        <nav aria-label="ניווט ראשי" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-4 py-2 text-body text-foreground-muted transition hover:text-foreground"
              activeProps={{ className: 'text-foreground bg-primary-soft', 'aria-current': 'page' }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link to="/dashboard" className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'hidden sm:inline-flex' })}>
                <User className="size-4" />
                מרכז הבקרה{firstName ? ` · ${firstName}` : ''}
              </Link>
              <button
                type="button"
                onClick={logout}
                aria-label="התנתקות"
                className="hidden size-9 place-items-center rounded-full text-foreground-muted transition hover:bg-primary-soft hover:text-foreground sm:grid"
              >
                <Logout className="size-4" />
              </button>
            </>
          ) : (
            <Link to="/account" className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'hidden sm:inline-flex' })}>
              <User className="size-4" />
              כניסה
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="פתיחת תפריט"
            className="grid size-11 place-items-center rounded-full border border-border bg-surface/60 md:hidden"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen} title="תפריט" placement="sheet">
        <nav aria-label="ניווט נייד" className="flex flex-col gap-1">
          {[...NAV, { to: '/', label: 'דף הבית' }].map((n) => (
            <Link key={n.to} to={n.to} className="rounded-control px-4 py-3.5 font-display text-title text-foreground hover:bg-primary-soft">
              {n.label}
            </Link>
          ))}
          {session ? (
            <>
              <Link to="/dashboard" className="rounded-control px-4 py-3.5 font-display text-title hover:bg-primary-soft">מרכז הבקרה</Link>
              <button type="button" onClick={logout} className="rounded-control px-4 py-3.5 text-start font-display text-title text-foreground-muted hover:bg-primary-soft">
                התנתקות
              </button>
            </>
          ) : (
            <Link to="/account" className={buttonClasses({ variant: 'primary', size: 'lg', className: 'mt-3' })}>
              כניסה או הרשמה
            </Link>
          )}
        </nav>
      </Dialog>
    </header>
  )
}
