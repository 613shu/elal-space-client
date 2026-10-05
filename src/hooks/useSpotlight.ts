import type { PointerEvent } from 'react'

/** מעדכן משתנים --mx/--my כדי שהילת המגע (.spotlight) תעקוב אחרי הסמן */
export function spotlightHandlers() {
  return {
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect()
      e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
      e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
    },
  }
}
