import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

/** חושף תוכן בגלילה: עלייה עדינה עם טשטוש. בלי תנועה אם המשתמש ביקש להפחית. */
export function Reveal({ children, delay = 0, y = 28, className, as = 'div' }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: 'div' | 'li' | 'section' | 'article' }) {
  const reduce = useReducedMotion()
  const M = motion[as]
  if (reduce) return <M className={className}>{children}</M>
  return (
    <M
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </M>
  )
}
