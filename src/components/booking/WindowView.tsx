import { useState } from 'react'
import { PlanetArt, type ArtKind } from '~/components/space/PlanetArt'
import type { SeatSide } from '~/lib/booking/seats'

/** "מה תראו מהחלון": גוררים את ציר המסע, וכדור הארץ מתכווץ בעוד היעד גדל */
export function WindowView({ side, art, destination }: { side: SeatSide; art: ArtKind; destination: string }) {
  const [t, setT] = useState(0.15)
  const earth = 1 - t * 0.85
  const dest = 0.12 + t * 0.88
  const primary = side === 'earth' ? earth : dest
  const kind: ArtKind = side === 'earth' ? 'earth' : art

  return (
    <div className="glass overflow-hidden rounded-panel">
      <div className="relative mx-auto mt-6 grid aspect-square w-48 place-items-center overflow-hidden rounded-full border-[6px] border-border-strong bg-background-deep shadow-lift">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,var(--color-primary-soft),transparent_60%)]" />
        <div style={{ width: `${40 + primary * 55}%`, transition: 'width 0.5s var(--ease-cinematic)' }}>
          <PlanetArt kind={kind} size="100%" period={100} />
        </div>
      </div>
      <div className="flex flex-col gap-3 p-5">
        <label htmlFor="trip-progress" className="flex items-baseline justify-between text-caption text-foreground-muted">
          <span>{side === 'earth' ? 'כדור הארץ' : destination} מהחלון</span>
          <span className="num text-foreground">{Math.round(t * 100)}% מהמסע</span>
        </label>
        <input
          id="trip-progress"
          type="range"
          min={0}
          max={100}
          value={Math.round(t * 100)}
          onChange={(e) => setT(Number(e.target.value) / 100)}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-[var(--color-primary)] [direction:rtl]"
        />
      </div>
    </div>
  )
}
