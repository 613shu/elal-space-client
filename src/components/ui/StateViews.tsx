import type { ReactNode } from 'react'
import { PlanetArt, type ArtKind } from '~/components/space/PlanetArt'
import { Button } from './Button'
import { Skeleton } from './Skeleton'

export function EmptyState({ title, text, action, art = 'moon' }: { title: string; text?: string; action?: ReactNode; art?: ArtKind }) {
  return (
    <div className="glass flex flex-col items-center gap-5 rounded-panel px-6 py-16 text-center">
      <PlanetArt kind={art} size={96} period={120} />
      <h3 className="text-title">{title}</h3>
      {text && <p className="max-w-md text-foreground-muted">{text}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ title = 'לא הצלחנו לטעון', text, onRetry, retrying }: { title?: string; text?: string; onRetry?: () => void; retrying?: boolean }) {
  return (
    <div role="alert" className="glass flex flex-col items-center gap-5 rounded-panel border-destructive/40 px-6 py-14 text-center">
      <h3 className="text-title">{title}</h3>
      {text && <p className="max-w-md text-foreground-muted">{text}</p>}
      {onRetry && (
        <Button onClick={onRetry} loading={retrying} variant="secondary">
          ניסיון נוסף
        </Button>
      )}
    </div>
  )
}

export function CardSkeletons({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={className ?? 'flex flex-col gap-5'} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-52 rounded-panel" />
      ))}
    </div>
  )
}
