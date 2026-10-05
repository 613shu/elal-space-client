import { Link } from '@tanstack/react-router'
import { PlanetArt } from './PlanetArt'
import type { PlanetKind } from '~/lib/content/destinations'

interface Body {
  slug: string
  kind: PlanetKind
  name: string
  note: string
  /** אחוז מקוטר הכלל; הטבעת = 2*r */
  ring: number
  size: number
  period: number
  offset: number
}

const BODIES: Body[] = [
  { slug: 'orbit', kind: 'station', name: 'תחנת המסלול', note: 'שעות ספורות', ring: 25, size: 6.2, period: 22, offset: 0.1 },
  { slug: 'moon', kind: 'moon', name: 'הירח', note: '3 ימים', ring: 33, size: 7.4, period: 44, offset: 0.55 },
  { slug: 'mars', kind: 'mars', name: 'מאדים', note: '7 חודשים', ring: 41.5, size: 9.6, period: 88, offset: 0.2 },
  { slug: 'europa', kind: 'europa', name: 'אירופה', note: '26 חודשים', ring: 46, size: 6.8, period: 130, offset: 0.78 },
  { slug: 'saturn', kind: 'saturn', name: 'שבתאי', note: '18 חודשים', ring: 50, size: 11, period: 190, offset: 0.4 },
]

/**
 * מערכת מסלולים אינטראקטיבית: כדור הארץ במרכז וכל יעד על מסלול משלו.
 * מעבר עכבר או מיקוד מקלדת עוצרים את התנועה ומציגים את שם היעד וזמן המסע.
 */
export function OrbitSystem({ className }: { className?: string }) {
  return (
    <div
      className={`group/orbit relative aspect-square w-full ${className ?? ''}`}
      role="group"
      aria-label="מפת מסלולים: בחרו יעד"
    >
      {/* מסלולים */}
      {BODIES.map((b) => (
        <div
          key={`ring-${b.slug}`}
          aria-hidden="true"
          className="absolute rounded-full border border-dashed border-border-strong/60"
          style={{ width: `${b.ring * 2}%`, height: `${b.ring * 2}%`, left: `${50 - b.ring}%`, top: `${50 - b.ring}%` }}
        />
      ))}

      {/* כדור הארץ */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: '14%' }}>
        <PlanetArt kind="earth" size="100%" period={160} />
        <span className="sr-only">כדור הארץ: נקודת היציאה</span>
        <span aria-hidden="true" className="absolute inset-0 -z-10 rounded-full motion-safe:animate-pulse-ring border border-primary/50" />
      </div>

      {BODIES.map((b) => (
        <div
          key={b.slug}
          className="pointer-events-none absolute left-1/2 top-1/2 group-hover/orbit:[animation-play-state:paused] group-focus-within/orbit:[animation-play-state:paused]"
          style={{
            width: `${b.ring * 2}%`,
            height: `${b.ring * 2}%`,
            marginLeft: `-${b.ring}%`,
            marginTop: `-${b.ring}%`,
            animationName: 'drift', animationDuration: `${b.period}s`, animationDelay: `${-b.period * b.offset}s`, animationTimingFunction: 'linear', animationIterationCount: 'infinite',
          }}
        >
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2" style={{ width: `${(b.size / (b.ring * 2)) * 100}%` }}>
            <div
              className="pointer-events-auto group-hover/orbit:[animation-play-state:paused] group-focus-within/orbit:[animation-play-state:paused]"
              style={{ animationName: 'drift-reverse', animationDuration: `${b.period}s`, animationDelay: `${-b.period * b.offset}s`, animationTimingFunction: 'linear', animationIterationCount: 'infinite' }}
            >
              <Link
                to="/destinations/$slug"
                params={{ slug: b.slug }}
                aria-label={`${b.name}, ${b.note}`}
                className="group/body relative block rounded-full transition-transform duration-500 ease-cinematic hover:scale-125 focus-visible:scale-125"
              >
                <PlanetArt kind={b.kind} size="100%" period={90} />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border-strong bg-surface/95 px-3 py-1 text-caption opacity-0 shadow-lift backdrop-blur transition group-hover/body:opacity-100 group-focus-visible/body:opacity-100">
                  <span className="font-medium text-foreground">{b.name}</span>
                  <span className="ms-2 text-foreground-subtle">{b.note}</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
