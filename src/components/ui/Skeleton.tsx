import { clsx } from 'clsx'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        'rounded-control bg-[linear-gradient(100deg,var(--color-surface)_30%,var(--color-surface-raised)_50%,var(--color-surface)_70%)] bg-[length:200%_100%] motion-safe:animate-shimmer bg-surface',
        className,
      )}
    />
  )
}
