import type { ReactNode } from 'react'
import { clsx } from 'clsx'

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={clsx('flex items-center gap-3 text-caption font-medium text-accent', className)}>
      <span className="h-px w-8 bg-accent/60" aria-hidden="true" />
      {children}
    </p>
  )
}
