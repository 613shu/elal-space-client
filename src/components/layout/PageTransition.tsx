import type { ReactNode } from 'react'
import { useRouterState } from '@tanstack/react-router'

/** כניסה עדינה לכל עמוד חדש: אנימציית CSS, כך שגם בלי JS התוכן גלוי בסוף */
export function PageTransition({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname })
  return (
    <div key={path} className="animate-rise">
      {children}
    </div>
  )
}
