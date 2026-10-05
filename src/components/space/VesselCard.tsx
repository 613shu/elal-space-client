import { Check } from '~/components/ui/Icons'
import type { Destination } from '~/lib/content/destinations'

export function VesselCard({ d }: { d: Destination }) {
  if (!d.vessel.features.length) return null
  return (
    <div className="glass grid gap-8 rounded-panel p-6 sm:p-10 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-4">
        <p className="text-caption text-accent">כלי הטיס</p>
        <h3 className="text-title">
          <span className="font-sans text-caption text-foreground-subtle">{d.vessel.kind}</span>
          <br />
          ״{d.vessel.name}״
        </h3>
        <p className="text-foreground-muted">{d.vessel.text}</p>
      </div>
      <ul className="grid content-center gap-3.5">
        {d.vessel.features.map((f) => (
          <li key={f} className="flex items-center gap-3">
            <span className="grid size-7 place-items-center rounded-full bg-success-soft text-success">
              <Check className="size-4" />
            </span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}
