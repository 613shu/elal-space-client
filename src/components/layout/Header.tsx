import { useEffect, useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { Logo, Wordmark } from '~/components/brand/Logo'
import { WeightDialog } from '~/components/home/WeightDialog'
import { replayIntro } from '~/components/space/IntroOverlay'
import { Dialog } from '~/components/ui/Dialog'
import { Gauge, Logout, Menu, Scale, Sparkle, User } from '~/components/ui/Icons'
import { buttonClasses } from '~/components/ui/Button'
import { clearSession, isAdminProfile, useSession } from '~/lib/auth/store'
import { toast } from '~/components/ui/Toast'

const NAV = [
  { to: '/', label: 'דף הבית', exact: true },
  { to: '/flights', label: 'מסעות', exact: false },
  { to: '/destinations', label: 'יעדים', exact: false },
] as const

const navItem = 'rounded-full px-4 py-2 text-body text-foreground-muted transition hover:text-foreground'
const sheetItem = 'flex items-center gap-3 rounded-control px-4 py-3.5 text-start font-display text-title text-foreground hover:bg-primary-soft'

export function Header() {
  const session = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [weightOpen, setWeightOpen] = useState(false)
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
    clearSession('logout')
    qc.clear()
    toast('התנתקתם מהמערכת. להתראות בחלל.', 'success')
    nav({ to: '/' })
  }

  /** חזרה למסך הפתיחה: דף הבית מראשיתו, כולל הפתיחה הקולנועית */
  const showIntro = () => {
    setOpen(false)
    replayIntro()
    nav({ to: '/' }).then(() => window.scrollTo({ top: 0 }))
  }

  const openWeight = () => {
    setOpen(false)
    setWeightOpen(true)
  }

  const isAdmin = isAdminProfile(session)
  const firstName = session?.profile.name.split(' ')[0]
  const home = isAdmin
    ? ({ to: '/admin', label: 'ממשק הניהול', Icon: Gauge } as const)
    : ({ to: '/dashboard', label: 'מרכז הבקרה', Icon: User } as const)

  return (
    <header
      className={clsx(
        'no-print fixed inset-x-0 top-0 z-40 transition-[background,border-color,backdrop-filter] duration-500',
        scrolled || open ? 'glass border-x-0 border-t-0' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" aria-label="אל על חלל: לדף הבית" className="flex shrink-0 items-center gap-3 rounded-control">
          <Logo size={44} />
          <Wordmark className="hidden sm:flex lg:hidden xl:flex" />
        </Link>

        <nav aria-label="ניווט ראשי" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.exact }}
              className={navItem}
              activeProps={{ className: 'text-foreground bg-primary-soft', 'aria-current': 'page' }}
            >
              {n.label}
            </Link>
          ))}
          <button type="button" onClick={openWeight} aria-haspopup="dialog" className={clsx(navItem, 'inline-flex items-center gap-2')}>
            <Scale className="size-4 text-accent" />
            כמה תשקלו שם?
          </button>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={showIntro}
            aria-label="חזרה למסך הפתיחה"
            title="חזרה למסך הפתיחה"
            className="group hidden size-9 place-items-center rounded-full text-foreground-muted transition hover:bg-primary-soft hover:text-foreground sm:grid"
          >
            <Sparkle className="size-4 transition-transform duration-700 ease-cinematic group-hover:rotate-90 group-hover:scale-125 group-hover:text-accent" />
          </button>
          {session ? (
            <>
              <Link to={home.to} className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'hidden sm:inline-flex' })}>
                <home.Icon className="size-4" />
                {home.label}
                {firstName ? ` · ${firstName}` : ''}
              </Link>
              <button
                type="button"
                onClick={logout}
                aria-label="התנתקות"
                title="התנתקות"
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
            className="grid size-11 place-items-center rounded-full border border-border bg-surface/60 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen} title="תפריט" placement="sheet">
        <nav aria-label="ניווט נייד" className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={sheetItem}>
              {n.label}
            </Link>
          ))}
          <button type="button" onClick={openWeight} className={sheetItem}>
            <Scale className="size-5 text-accent" />
            כמה תשקלו שם?
          </button>
          <button type="button" onClick={showIntro} className={sheetItem}>
            <Sparkle className="size-5 text-accent" />
            מסך הפתיחה
          </button>
          {session ? (
            <>
              <Link to={home.to} className={sheetItem}>{home.label}</Link>
              <button type="button" onClick={logout} className={clsx(sheetItem, 'text-foreground-muted')}>
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

      <WeightDialog open={weightOpen} onOpenChange={setWeightOpen} />
    </header>
  )
}
