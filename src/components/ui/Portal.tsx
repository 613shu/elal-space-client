import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useHydrated } from '~/hooks/useHydrated'

/**
 * מציג תוכן ישירות תחת body.
 * נחוץ לרכיבים "צפים" (position: fixed) שנמצאים בתוך עמוד: עטיפת המעבר בין עמודים
 * מונפשת עם transform, ודפדפנים ממקמים אלמנט fixed יחסית לאב כזה ולא יחסית למסך.
 */
export function Portal({ children }: { children: ReactNode }) {
  const hydrated = useHydrated()
  return hydrated ? createPortal(children, document.body) : null
}
