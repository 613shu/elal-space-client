import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'motion/react'
import { WeightInline } from '~/components/home/WeightInline'
import { FlightCard } from '~/components/flights/FlightCard'
import { DemoNotice } from '~/components/layout/DemoNotice'
import { DestinationFacts } from '~/components/space/DestinationFacts'
import { Faq } from '~/components/space/Faq'
import { PlanetArt } from '~/components/space/PlanetArt'
import { SignalPing } from '~/components/space/SignalPing'
import { Trajectory } from '~/components/space/Trajectory'
import { VesselCard } from '~/components/space/VesselCard'
import { Badge } from '~/components/ui/Badge'
import { buttonClasses } from '~/components/ui/Button'
import { Eyebrow } from '~/components/ui/Eyebrow'
import { ArrowLeft } from '~/components/ui/Icons'
import { Reveal } from '~/components/ui/Reveal'
import { flightsQuery } from '~/lib/api/queries'
import { useIsAuthed } from '~/lib/auth/store'
import { DESTINATIONS, getDestination } from '~/lib/content/destinations'
import { destinationOf, hasDeparted, isScheduled, sortByDeparture } from '~/lib/flights'
import { formatPrice } from '~/lib/format/money'
import { pageHead } from '~/lib/seo'

export const Route = createFileRoute('/destinations/$slug')({
  loader: ({ params }) => {
    const d = getDestination(params.slug)
    if (!d) throw notFound()
    return d
  },
  head: ({ loaderData }) => pageHead(loaderData?.name, loaderData?.tagline),
  component: DestinationPage,
})

function DestinationPage() {
  const d = Route.useLoaderData()
  const reduce = useReducedMotion()
  const authed = useIsAuthed()
  const { data } = useQuery(flightsQuery(authed))

  const flights = (data?.flights ?? [])
    .filter((f) => isScheduled(f) && !hasDeparted(f) && destinationOf(f)?.slug === d.slug)
    .sort(sortByDeparture)
  const from = flights.length ? Math.min(...flights.map((f) => f.price)) : undefined

  const idx = DESTINATIONS.findIndex((x) => x.slug === d.slug)
  const next = DESTINATIONS[(idx + 1) % DESTINATIONS.length]

  return (
    <div className="mx-auto max-w-7xl px-5 pb-8 pt-32 sm:px-8 lg:pt-40">
      <nav aria-label="פירורי לחם" className="mb-8 flex items-center gap-2 text-caption text-foreground-subtle">
        <Link to="/destinations" className="hover:text-foreground">יעדים</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-foreground-muted">{d.name}</span>
      </nav>

      <header className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col items-start gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={d.status === 'vision' ? 'gold' : 'primary'}>{d.eyebrow}</Badge>
            <span className="text-caption text-foreground-subtle">{d.place}</span>
          </div>
          <motion.h1
            className="text-display"
            initial={reduce ? false : { opacity: 0, y: 30, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {d.name}
          </motion.h1>
          <p className="max-w-xl text-lead text-foreground-muted">{d.tagline}</p>
          <p className="max-w-xl text-foreground-muted">{d.summary}</p>
          {d.status === 'open' ? (
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/flights" search={{ destination: d.slug }} className={buttonClasses({ size: 'lg' })}>
                מסעות אל {d.name}
              </Link>
              {from !== undefined && (
                <p className="text-foreground-muted">
                  החל מ־<span className="num text-foreground">{formatPrice(from)}</span>
                </p>
              )}
            </div>
          ) : (
            <p role="note" className="rounded-card border border-gold/40 bg-gold-soft px-5 py-3 text-gold">
              יעד חזון: עדיין אין מסעות להזמנה.
            </p>
          )}
        </div>
        <motion.div
          className="mx-auto grid place-items-center"
          initial={reduce ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <PlanetArt kind={d.planet} size="clamp(240px, 36vw, 460px)" period={130} />
        </motion.div>
      </header>

      {d.status === 'open' && (
        <section className="mt-24" aria-label="נתוני היעד">
          <Reveal><DestinationFacts d={d} /></Reveal>
        </section>
      )}

      <section className="mt-28 grid gap-12 lg:grid-cols-[0.9fr_1.1fr]" aria-label="הסיפור">
        <Reveal className="flex flex-col gap-5 text-lead text-foreground-muted">
          {d.story.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Reveal>
        <ul className="grid gap-4">
          {d.highlights.map((h, i) => (
            <Reveal as="li" key={h.title} delay={i * 0.08} className="glass rounded-card p-6">
              <h3 className="text-title">{h.title}</h3>
              <p className="mt-2 text-foreground-muted">{h.text}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      {d.status === 'open' && (
        <>
          <section className="mt-28" aria-labelledby="route">
            <Reveal className="mb-12 flex max-w-2xl flex-col gap-4">
              <Eyebrow>הדרך אל {d.name}</Eyebrow>
              <h2 id="route" className="text-headline">{d.stats.durationLabel} של מסע.</h2>
            </Reveal>
            <Trajectory milestones={d.milestones} destinationArt={d.planet} />
          </section>

          <section className="mt-28 grid gap-6 lg:grid-cols-2" aria-label="פרטים מסקרנים">
            {d.stats.signalDelaySec !== undefined && <Reveal><SignalPing seconds={d.stats.signalDelaySec} name={d.name} /></Reveal>}
            {d.stats.gravityG !== undefined && <Reveal><WeightInline g={d.stats.gravityG} name={d.name} /></Reveal>}
          </section>

          <section className="mt-28" aria-labelledby="vessel">
            <Reveal className="mb-10 flex max-w-2xl flex-col gap-4">
              <Eyebrow>הכלי</Eyebrow>
              <h2 id="vessel" className="text-headline">הספינה שלכם.</h2>
            </Reveal>
            <Reveal><VesselCard d={d} /></Reveal>
          </section>

          {d.info.length > 0 && (
            <section className="mt-28" aria-labelledby="info">
              <h2 id="info" className="mb-8 text-headline">מידע שימושי</h2>
              <ul className="grid gap-4 md:grid-cols-3">
                {d.info.map((i, k) => (
                  <Reveal as="li" key={i.title} delay={k * 0.08} className="glass rounded-card p-6">
                    <h3 className="text-title">{i.title}</h3>
                    <p className="mt-2 text-foreground-muted">{i.text}</p>
                  </Reveal>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-28" aria-labelledby="flights">
            <div className="mb-8 flex flex-col gap-4">
              <h2 id="flights" className="text-headline">המסעות הקרובים אל {d.name}</h2>
              <DemoNotice source={data?.source} reason={data?.reason} />
            </div>
            {flights.length === 0 ? (
              <p className="glass rounded-card p-6 text-foreground-muted">כרגע אין שיגורים מתוכננים אל {d.name}. כדאי לחזור בקרוב.</p>
            ) : (
              <ul className="flex flex-col gap-5">
                {flights.map((f) => (
                  <li key={f.id}><FlightCard flight={f} /></li>
                ))}
              </ul>
            )}
          </section>

          {d.faq.length > 0 && (
            <section className="mt-28 max-w-3xl" aria-labelledby="faq">
              <h2 id="faq" className="mb-8 text-headline">שאלות נפוצות</h2>
              <Faq items={d.faq} />
            </section>
          )}
        </>
      )}

      <aside className="mt-32 border-t border-border pt-10" aria-label="היעד הבא">
        <Link to="/destinations/$slug" params={{ slug: next.slug }} className="group flex items-center justify-between gap-6 rounded-card p-4">
          <div>
            <p className="text-caption text-foreground-subtle">היעד הבא</p>
            <p className="font-display text-headline">{next.name}</p>
          </div>
          <span className="flex items-center gap-4">
            <PlanetArt kind={next.planet} size={84} period={80} />
            <ArrowLeft className="size-7 text-primary transition-transform group-hover:-translate-x-2" />
          </span>
        </Link>
      </aside>
    </div>
  )
}
