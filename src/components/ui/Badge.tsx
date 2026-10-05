import type { ReactNode } from 'react'
import { clsx } from 'clsx'

type Tone = 'neutral' | 'primary' | 'gold' | 'success' | 'warning' | 'danger'

const tones: Record<Tone, string> = {
  neutral: 'border-border bg-surface/60 text-foreground-muted',
  primary: 'border-primary/40 bg-primary-soft text-primary',
  gold: 'border-gold/40 bg-gold-soft text-gold',
  success: 'border-success/40 bg-success-soft text-success',
  warning: 'border-warning/40 bg-warning-soft text-warning',
  danger: 'border-destructive/40 bg-destructive-soft text-destructive',
}

export function Badge({ tone = 'neutral', children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-caption font-medium', tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}
