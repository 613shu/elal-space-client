import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { clsx } from 'clsx'
import type { Milestone } from '~/lib/content/destinations'
import { PlanetArt, type ArtKind } from './PlanetArt'

const P0 = { x: 90, y: 200 }
const P1 = { x: 500, y: -10 }
const P2 = { x: 910, y: 130 }

const bez = (t: number) => ({
  x: (1 - t) ** 2 * P0.x + 2 * (1 - t) * t * P1.x + t ** 2 * P2.x,
  y: (1 - t) ** 2 * P0.y + 2 * (1 - t) * t * P1.y + t ** 2 * P2.y,
})
const tan = (t: number) => ({
  x: 2 * (1 - t) * (P1.x - P0.x) + 2 * t * (P2.x - P1.x),
  y: 2 * (1 - t) * (P1.y - P0.y) + 2 * t * (P2.y - P1.y),
})

/**
 * מסלול המסע: קו שנמשך בגלילה, ספינה שנעה עליו ועצירות לאורך הדרך.
 * הרשימה מתחת לקו היא הגרסה הנגישה (טקסט אמיתי), והקו הוא הציור שלה.
 */
export function Trajectory({ milestones, destinationArt }: { milestones: Milestone[]; destinationArt: ArtKind }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] })
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.5 })
  const progress = reduce ? { get: () => 1 } : p
  const [now, setNow] = useState(reduce ? 1 : 0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => setNow(v))

  const shipX = useTransform(p, (t) => bez(t).x)
  const shipY = useTransform(p, (t) => bez(t).y)
  const shipRot = useTransform(p, (t) => (Math.atan2(tan(t).y, tan(t).x) * 180) / Math.PI)
  void progress

  return (
    <div ref={ref}>
      <div className="relative">
        <svg viewBox="0 0 1000 260" className="w-full overflow-visible" role="img" aria-label="תרשים מסלול המסע מכדור הארץ אל היעד">
          <defs>
            <linearGradient id="traj" x1="1" x2="0">
              <stop offset="0" stopColor="var(--color-accent)" />
              <stop offset="1" stopColor="var(--color-primary)" />
            </linearGradient>
          </defs>
          <path d={`M${P0.x} ${P0.y} Q${P1.x} ${P1.y} ${P2.x} ${P2.y}`} fill="none" stroke="var(--color-border-strong)" strokeWidth="2" strokeDasharray="3 9" strokeLinecap="round" />
          <motion.path
            d={`M${P0.x} ${P0.y} Q${P1.x} ${P1.y} ${P2.x} ${P2.y}`}
            fill="none"
            stroke="url(#traj)"
            strokeWidth="3.5"
            strokeLinecap="round"
            style={{ pathLength: reduce ? 1 : p }}
          />
          {milestones.map((m) => {
            const pt = bez(m.at)
            const passed = now >= m.at - 0.01
            return (
              <g key={m.title}>
                <circle cx={pt.x} cy={pt.y} r="11" fill="var(--color-background)" stroke={passed ? 'var(--color-accent)' : 'var(--color-border-strong)'} strokeWidth="2.5" style={{ transition: 'stroke 0.4s' }} />
                <circle cx={pt.x} cy={pt.y} r="4.5" fill={passed ? 'var(--color-accent)' : 'var(--color-border-strong)'} style={{ transition: 'fill 0.4s' }} />
              </g>
            )
          })}
          <motion.g style={{ x: reduce ? bez(1).x : shipX, y: reduce ? bez(1).y : shipY, rotate: reduce ? 0 : shipRot }}>
            <circle r="20" fill="var(--color-primary)" opacity="0.18" />
            <path d="M-11 -6 L12 0 L-11 6 L-6 0 Z" fill="var(--color-foreground)" />
          </motion.g>
        </svg>

        <div className="pointer-events-none absolute start-[1%] top-[56%] w-[11%] -translate-y-1/2" aria-hidden="true">
          <PlanetArt kind="earth" size="100%" period={120} />
        </div>
        <div className="pointer-events-none absolute end-[1%] top-[40%] w-[12%] -translate-y-1/2" aria-hidden="true">
          <PlanetArt kind={destinationArt} size="100%" period={120} />
        </div>
      </div>

      <ol className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {milestones.map((m) => (
          <li key={m.title} className={clsx('flex gap-4 transition-opacity duration-500', now >= m.at - 0.01 ? 'opacity-100' : 'opacity-50')}>
            <span aria-hidden="true" className={clsx('mt-1.5 size-2.5 shrink-0 rounded-full transition-colors', now >= m.at - 0.01 ? 'bg-accent' : 'bg-border-strong')} />
            <div>
              <p className="text-caption text-accent">{m.label}</p>
              <h4 className="mt-1 font-sans text-body font-semibold">{m.title}</h4>
              <p className="mt-1 text-foreground-muted">{m.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
