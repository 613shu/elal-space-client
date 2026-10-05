import { Link } from '@tanstack/react-router'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { clsx } from 'clsx'
import { PlanetArt } from '~/components/space/PlanetArt'
import { Badge } from '~/components/ui/Badge'
import { ArrowLeft } from '~/components/ui/Icons'
import { spotlightHandlers } from '~/hooks/useSpotlight'
import type { Destination } from '~/lib/content/destinations'
import { formatDistance } from '~/lib/format/money'

/** כרטיס יעד גדול: כוכב מסתובב, הטיה תלת־ממדית עדינה והילת מגע */
export function DestinationCard({ d, featured, className }: { d: Destination; featured?: boolean; className?: string }) {
  const reduce = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), { stiffness: 120, damping: 16 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 120, damping: 16 })
  const spot = spotlightHandlers()

  return (
    <motion.article
      className={clsx('spotlight glass group relative overflow-hidden rounded-panel shadow-card transition-shadow duration-500 hover:shadow-lift', className)}
      style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 1100 }}
      onPointerMove={(e) => {
        spot.onPointerMove(e)
        if (reduce) return
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width - 0.5)
        my.set((e.clientY - r.top) / r.height - 0.5)
      }}
      onPointerLeave={() => {
        mx.set(0)
        my.set(0)
      }}
    >
      <Link
        to="/destinations/$slug"
        params={{ slug: d.slug }}
        className="flex h-full flex-col gap-6 rounded-panel p-6 sm:p-8"
        aria-label={`${d.name}: ${d.place}`}
      >
        <div className="relative grid place-items-center py-6">
          <div className="transition-transform duration-700 ease-cinematic group-hover:scale-[1.06]">
            <PlanetArt kind={d.planet} size={d.planet === 'saturn' ? (featured ? 'clamp(110px, 14vw, 170px)' : 'clamp(90px, 11vw, 125px)') : featured ? 'clamp(170px, 22vw, 260px)' : 'clamp(140px, 17vw, 190px)'} period={110} />
          </div>
          <Badge tone={d.status === 'vision' ? 'gold' : 'primary'} className="absolute start-0 top-0">
            {d.eyebrow}
          </Badge>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <p className="text-caption text-accent">{d.place}</p>
          <h3 className="text-title text-foreground">{d.name}</h3>
          <p className="text-foreground-muted">{d.tagline}</p>
        </div>

        <dl className="grid grid-cols-3 gap-3 border-t border-border pt-5 text-caption">
          <div>
            <dt className="text-foreground-subtle">משך</dt>
            <dd className="mt-1 font-medium text-foreground">{d.stats.durationLabel}</dd>
          </div>
          <div>
            <dt className="text-foreground-subtle">כבידה</dt>
            <dd className="num mt-1 font-medium text-foreground">{d.stats.gravityLabel}</dd>
          </div>
          <div>
            <dt className="text-foreground-subtle">מרחק</dt>
            <dd className="mt-1 font-medium text-foreground">
              {d.stats.distanceKm ? (
                <>
                  <span className="num">{formatDistance(d.stats.distanceKm)}</span> ק״מ
                </>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>

        <span className="inline-flex items-center gap-2 text-body font-medium text-primary transition-all group-hover:gap-3">
          {d.status === 'vision' ? 'עוד על היעד' : `מסעות אל ${d.name}`}
          <ArrowLeft className="size-4" />
        </span>
      </Link>
    </motion.article>
  )
}
