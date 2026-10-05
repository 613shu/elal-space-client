import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { clsx } from 'clsx'
import { PlanetArt } from '~/components/space/PlanetArt'
import { Badge } from '~/components/ui/Badge'
import { buttonClasses } from '~/components/ui/Button'
import { Reveal } from '~/components/ui/Reveal'
import type { Destination } from '~/lib/content/destinations'
import { formatDistance } from '~/lib/format/money'

/** פרק במסע: כוכב גדול עם פרלקסה, ובצדו הסיפור. מתחלף בין ימין לשמאל. */
export function DestinationChapter({ d, index }: { d: Destination; index: number }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [70, -70])
  const flip = index % 2 === 1

  return (
    <section ref={ref} aria-labelledby={`ch-${d.slug}`} className="relative grid items-center gap-10 py-14 lg:min-h-[78vh] lg:grid-cols-2 lg:gap-20">
      <motion.div style={reduce ? undefined : { y }} className={clsx('grid place-items-center', flip && 'lg:order-2')}>
        <PlanetArt kind={d.planet} size="clamp(220px, 34vw, 440px)" period={150} />
      </motion.div>
      <Reveal className="flex flex-col items-start gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={d.status === 'vision' ? 'gold' : 'primary'}>{d.eyebrow}</Badge>
          <span className="text-caption text-foreground-subtle">{d.place}</span>
        </div>
        <h2 id={`ch-${d.slug}`} className="text-headline">{d.name}</h2>
        <p className="max-w-xl text-lead text-foreground-muted">{d.tagline}</p>
        <dl className="grid w-full max-w-md grid-cols-3 gap-4 border-y border-border py-5 text-caption">
          <div>
            <dt className="text-foreground-subtle">משך</dt>
            <dd className="mt-1 text-body font-medium">{d.stats.durationLabel}</dd>
          </div>
          <div>
            <dt className="text-foreground-subtle">כבידה</dt>
            <dd className="num mt-1 text-body font-medium">{d.stats.gravityLabel}</dd>
          </div>
          <div>
            <dt className="text-foreground-subtle">מרחק</dt>
            <dd className="mt-1 text-body font-medium">{d.stats.distanceKm ? <><span className="num">{formatDistance(d.stats.distanceKm)}</span> ק״מ</> : '—'}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-3">
          <Link to="/destinations/$slug" params={{ slug: d.slug }} className={buttonClasses({ variant: d.status === 'vision' ? 'secondary' : 'primary' })}>
            עוד על {d.name}
          </Link>
          {d.status === 'open' && (
            <Link to="/flights" search={{ destination: d.slug }} className={buttonClasses({ variant: 'secondary' })}>
              מסעות אל {d.name}
            </Link>
          )}
        </div>
      </Reveal>
    </section>
  )
}
