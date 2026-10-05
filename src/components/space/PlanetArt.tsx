import { useEffect, useId, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { clsx } from 'clsx'
import { useInView } from '~/hooks/useInView'
import type { PlanetKind } from '~/lib/content/destinations'
import { getPlanetTexture, type TextureKind } from './textures'

export type ArtKind = PlanetKind | 'earth'

const TEXTURE_OF: Record<Exclude<ArtKind, 'galaxy'>, TextureKind> = {
  moon: 'moon',
  mars: 'mars',
  saturn: 'saturn',
  europa: 'europa',
  station: 'earth',
  earth: 'earth',
}

const GLOW_TOKEN: Record<ArtKind, string> = {
  moon: '--color-planet-moon-light',
  mars: '--color-planet-mars-light',
  saturn: '--color-planet-saturn-light',
  europa: '--color-planet-europa-light',
  station: '--color-planet-earth-sea',
  earth: '--color-planet-earth-sea',
  galaxy: '--color-planet-galaxy-arm',
}

const FALLBACK_TOKENS: Record<Exclude<ArtKind, 'galaxy'>, [string, string]> = {
  moon: ['--color-planet-moon-light', '--color-planet-moon-dark'],
  mars: ['--color-planet-mars-light', '--color-planet-mars-dark'],
  saturn: ['--color-planet-saturn-light', '--color-planet-saturn-dark'],
  europa: ['--color-planet-europa-light', '--color-planet-europa-dark'],
  station: ['--color-planet-earth-sea', '--color-planet-earth-land'],
  earth: ['--color-planet-earth-sea', '--color-planet-earth-land'],
}

/** הטקסטורות מופקות פעם אחת לכל סוג ואחר כך נשמרות בזיכרון */
function useTexture(kind: ArtKind): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (kind === 'galaxy') return
    const k = TEXTURE_OF[kind]
    const run = () => setUrl(getPlanetTexture(k))
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void }
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run)
      return () => w.cancelIdleCallback?.(id)
    }
    const id = setTimeout(run, 30)
    return () => clearTimeout(id)
  }, [kind])
  return url
}

interface PlanetArtProps {
  kind: ArtKind
  /** מספר פיקסלים או כל אורך CSS (למשל clamp(...)) */
  size: number | string
  spin?: boolean
  /** שניות לסיבוב מלא של הטקסטורה */
  period?: number
  className?: string
}

export function PlanetArt({ kind, size, spin = true, period = 140, className }: PlanetArtProps) {
  const reduce = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>()
  const dim = typeof size === 'number' ? `${size}px` : size

  return (
    <div ref={ref} className={clsx('relative shrink-0', className)} style={{ width: dim, aspectRatio: '1 / 1' }} aria-hidden="true">
      {kind === 'galaxy' ? <Galaxy playing={inView && !reduce} /> : <Sphere kind={kind} spin={spin && !reduce && inView} period={period} />}
    </div>
  )
}

function Sphere({ kind, spin, period }: { kind: Exclude<ArtKind, 'galaxy'>; spin: boolean; period: number }) {
  const url = useTexture(kind)
  const uid = useId().replace(/:/g, '')
  const [lightTok, darkTok] = FALLBACK_TOKENS[kind]
  const delay = -((kind.length * 37) % period)

  return (
    <>
      {kind === 'saturn' && <Rings uid={uid} layer="back" />}

      <div
        className="absolute inset-0 isolate overflow-hidden rounded-full"
        style={{
          boxShadow: `0 0 90px -14px color-mix(in oklab, var(${GLOW_TOKEN[kind]}) 55%, transparent), inset 0 0 0 1px color-mix(in oklab, var(--color-foreground) 8%, transparent)`,
          background: `linear-gradient(135deg, var(${lightTok}), var(${darkTok}))`,
        }}
      >
        {url && (
          <div
            className="absolute inset-y-0 left-0 will-change-transform"
            style={{
              width: '300%',
              backgroundImage: `url(${url})`,
              backgroundSize: '66.6667% 100%',
              backgroundRepeat: 'repeat-x',
              animation: `planet-spin ${period}s linear ${delay}s infinite`,
              animationPlayState: spin ? 'running' : 'paused',
            }}
          />
        )}
        {/* עיגול הצל: תאורה מצד שמאל־למעלה */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 30% 26%, transparent 18%, color-mix(in oklab, var(--color-background-deep) 38%, transparent) 55%, color-mix(in oklab, var(--color-background-deep) 88%, transparent) 88%, var(--color-background-deep) 100%)',
          }}
        />
        <div
          className="absolute inset-0 rounded-full mix-blend-screen"
          style={{
            background: 'radial-gradient(circle at 26% 22%, color-mix(in oklab, var(--color-foreground) 22%, transparent), transparent 32%)',
          }}
        />
      </div>

      {kind === 'saturn' && <Rings uid={uid} layer="front" />}
      {kind === 'station' && <Station />}
    </>
  )
}

function Rings({ uid, layer }: { uid: string; layer: 'back' | 'front' }) {
  const bands: Array<[number, number, number]> = [
    [68, 0.32, 0.55],
    [74, 1.6, 0.8],
    [82, 3.4, 0.62],
    [90, 0.9, 0.35],
    [97, 2.2, 0.7],
    [104, 1.2, 0.4],
  ]
  return (
    <svg
      viewBox="0 0 240 240"
      className="pointer-events-none absolute overflow-visible"
      style={{ width: '240%', height: '240%', left: '-70%', top: '-70%', zIndex: layer === 'front' ? 2 : 0 }}
    >
      <defs>
        <linearGradient id={`r-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="var(--color-planet-saturn-dark)" />
          <stop offset="0.5" stopColor="var(--color-planet-saturn-ring)" />
          <stop offset="1" stopColor="var(--color-planet-saturn-dark)" />
        </linearGradient>
        <clipPath id={`c-${uid}`}>
          <rect x="0" y="120" width="240" height="120" />
        </clipPath>
      </defs>
      <g transform="rotate(-17 120 120)">
        <g clipPath={layer === 'front' ? `url(#c-${uid})` : undefined}>
          {bands.map(([rx, w, o], i) => (
            <ellipse key={i} cx="120" cy="120" rx={rx * 1.12} ry={rx * 0.3} fill="none" stroke={`url(#r-${uid})`} strokeWidth={w * 1.6} opacity={o} />
          ))}
        </g>
      </g>
    </svg>
  )
}

function Station() {
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 overflow-visible" style={{ zIndex: 2 }}>
      <ellipse cx="50" cy="50" rx="62" ry="17" transform="rotate(-24 50 50)" fill="none" stroke="var(--color-accent)" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.7" />
      <g transform="translate(86 26) rotate(-24)">
        <rect x="-5" y="-1.2" width="10" height="2.4" rx="0.6" fill="var(--color-foreground)" />
        <rect x="-9" y="-3" width="3.4" height="6" fill="var(--color-primary)" opacity="0.9" />
        <rect x="5.6" y="-3" width="3.4" height="6" fill="var(--color-primary)" opacity="0.9" />
        <circle cx="0" cy="0" r="9" fill="var(--color-accent)" opacity="0.12" />
      </g>
    </svg>
  )
}

function Galaxy({ playing }: { playing: boolean }) {
  const dots = Array.from({ length: 360 }, (_, i) => {
    const arm = i % 3
    const t = (i / 360) * 3.2 + 0.18
    const a = t * 2.4 + (arm * Math.PI * 2) / 3
    const r = 10 + t * 30
    const jitter = ((i * 9301 + 49297) % 233280) / 233280 - 0.5
    return {
      x: 50 + Math.cos(a) * r + jitter * 7,
      y: 50 + Math.sin(a) * r * 0.55 + jitter * 4,
      s: 0.25 + (((i * 7) % 11) / 11) * 0.7,
      o: 0.25 + (((i * 13) % 17) / 17) * 0.7,
    }
  })
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 overflow-visible" style={{ filter: 'drop-shadow(0 0 22px var(--color-primary-soft))' }}>
      <defs>
        <radialGradient id="gx-core">
          <stop offset="0" stopColor="var(--color-planet-galaxy-core)" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="var(--color-planet-galaxy-core)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--color-planet-galaxy-arm)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g
        style={{
          transformOrigin: '50px 50px',
          animation: playing ? 'drift 220s linear infinite' : undefined,
          transform: 'rotate(-18deg)',
        }}
      >
        <ellipse cx="50" cy="50" rx="46" ry="26" fill="url(#gx-core)" opacity="0.7" />
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.s} fill="var(--color-planet-galaxy-arm)" opacity={d.o} />
        ))}
        <circle cx="50" cy="50" r="5.5" fill="url(#gx-core)" />
      </g>
    </svg>
  )
}
