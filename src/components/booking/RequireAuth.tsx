import { useEffect, type ReactNode } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useHydrated } from '~/hooks/useHydrated'
import { useSession } from '~/lib/auth/store'
import { Spinner } from '~/components/ui/Spinner'
import { toast } from '~/components/ui/Toast'

/** שער התחברות לצד לקוח: ההרשאה האמיתית נאכפת בשרת, וכאן רק חוויית המשתמש */
export function RequireAuth({ children, message = 'כדי להמשיך צריך להתחבר.' }: { children: ReactNode; message?: string }) {
  const session = useSession()
  const hydrated = useHydrated()
  const nav = useNavigate()
  const loc = useLocation()

  useEffect(() => {
    if (hydrated && !session) {
      toast(message, 'info')
      nav({ to: '/account', search: { redirect: loc.pathname + (loc.searchStr ?? '') }, replace: true })
    }
  }, [hydrated, session, nav, loc.pathname, loc.searchStr, message])

  if (!hydrated || !session) {
    return (
      <div className="grid min-h-[60dvh] place-items-center pt-24">
        <Spinner className="size-8 text-primary" label="בודקים את ההתחברות" />
      </div>
    )
  }
  return <>{children}</>
}
