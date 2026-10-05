import type { Destination } from '~/lib/content/destinations'

/** details/summary: נגיש מהקופסה, כולל מקלדת וקוראי מסך */
export function Faq({ items }: { items: Destination['faq'] }) {
  if (!items.length) return null
  return (
    <div className="flex flex-col gap-3">
      {items.map((it) => (
        <details key={it.q} className="glass group rounded-card px-6 py-5 open:shadow-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-body font-medium marker:hidden [&::-webkit-details-marker]:hidden">
            {it.q}
            <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border border-border-strong text-foreground-muted transition group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 text-foreground-muted">{it.a}</p>
        </details>
      ))}
    </div>
  )
}
