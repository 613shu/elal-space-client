import { useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useHydrated } from '~/hooks/useHydrated'
import { getRecentSessionEnd, getSession, useSession } from '~/lib/auth/store'
import { Spinner } from '~/components/ui/Spinner'
import { toast } from '~/components/ui/Toast'

/**
 * שער התחברות לצד לקוח: ההרשאה האמיתית נאכפת בשרת, וכאן רק חוויית המשתמש.
 *
 * ההפניה מתבצעת פעם אחת בלבד לכל כניסה לעמוד. בלי זה, כל שינוי כתובת בזמן המעבר
 * הפעיל את האפקט שוב, וההודעה נערמה שוב ושוב.
 */
export function RequireAuth({ children, message = 'כדי להמשיך צריך להתחבר.' }: { children: ReactNode; message?: string }) {
  const session = useSession()
  const hydrated = useHydrated()
  const nav = useNavigate()
  const redirected = useRef(false)

  useEffect(() => {
    if (!hydrated) return
    // קוראים ישירות מהמאגר ולא מה-render: כך אין רגע ביניים שבו משתמש מחובר נראה כאורח
    if (getSession()) {
      redirected.current = false
      return
    }
    if (redirected.current) return
    redirected.current = true

    // הסשן הסתיים ממש עכשיו, בזמן שהעמוד פתוח (להבדיל מאורח שהגיע לכאן).
    // נשען על המאגר ולא על מצב הרכיב: בזמן מעבר בין עמודים הרכיב עשוי להיבנות מחדש.
    const endedHere = getRecentSessionEnd()
    // התנתקות יזומה: חוזרים לדף הבית בשקט, בלי הודעת "צריך להתחבר"
    if (endedHere === 'logout') return void nav({ to: '/', replace: true })

    const here = window.location.pathname + window.location.search
    toast(endedHere === 'expired' ? 'ההתחברות פגה. היכנסו מחדש כדי להמשיך.' : message, 'info')
    nav({ to: '/account', search: { redirect: here.startsWith('/account') ? undefined : here }, replace: true })
  }, [hydrated, session, nav, message])

  if (!hydrated || !session) {
    return (
      <div className="grid min-h-[60dvh] place-items-center pt-24">
        <Spinner className="size-8 text-primary" label="בודקים את ההתחברות" />
      </div>
    )
  }
  return <>{children}</>
}
