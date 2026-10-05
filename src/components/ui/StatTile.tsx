import type { ReactNode } from 'react'

export function StatTile({ icon, label, value, note }: { icon: ReactNode; label: string; value: ReactNode; note?: string }) {
  return (
    <div className="glass flex flex-col gap-3 rounded-card p-5">
      <span className="text-primary">{icon}</span>
      <dt className="text-caption text-foreground-subtle">{label}</dt>
      <dd className="font-display text-title leading-tight text-foreground">{value}</dd>
      {note && <p className="text-caption text-foreground-subtle">{note}</p>}
    </div>
  )
}
