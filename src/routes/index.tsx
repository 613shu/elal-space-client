import { useMemo } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'motion/react'
import { OrbitSystem } from '~/components/space/OrbitSystem'
import { DestinationCard } from '~/components/home/DestinationCard'
import { SearchCard } from '~/components/home/SearchCard'
import { WeightCalculator } from '~/components/home/WeightCalculator'
import { JourneyStages } from '~/components/home/JourneyStages'
import { LaunchClock } from '~/components/home/LaunchClock'
import { DemoNotice } from '~/components/layout/DemoNotice'
import { buttonClasses } from '~/components/ui/Button'
import { CountUp } from '~/components/ui/CountUp'
import { Eyebrow } from '~/components/ui/Eyebrow'
import { Reveal } from '~/components/ui/Reveal'
import { Gravity, Shield, Window, ArrowLeft } from '~/components/ui/Icons'
import { flightsQuery } from '~/lib/api/queries'
import { useIsAuthed } from '~/lib/auth/store'
import { getDestination, OPEN_DESTINATIONS, resolveDestination } from '~/lib/content/destinations'
import { formatPrice } from '~/lib/format/money'
import { parseServerDate } from '~/lib/format/date'
import { pageHead } from '~/lib/seo'

export const Route = createFileRoute('/')({
  head: () => pageHead(undefined, 'מסעות פרטיים אל הירח, מאדים ושבתאי. לא עוד אופק, יקום שלם.'),
  component: HomePage,
})

const TRUST = [
  { Icon: Shield, title: 'סטנדרט מסלול', text: 'מערכות יתירות בכל שלב', long: 'כל מערכת חיונית קיימת בעותק כפול ומאומת, כי בחלל אין "עוד רגע".' },
  { Icon: Gravity, title: 'כבידה מדומה', text: 'תנועה טבעית ונינוחה', long: 'הגוף נשאר בבית גם כשהעולם מסביב משתנה, ואתם ישנים, אוכלים והולכים כרגיל.' },
  { Icon: Window, title: 'חלון פרטי', text: 'היקום כולו מול העיניים', long: 'כל תא פונה אל החלון שלו, ובכל שעה האור מגיע מכיוון אחר.' },
] as const

function HomePage() {
  const authed = useIsAuthed()
  const reduce = useReducedMotion()
  const { data } = useQuery(flightsQuery(authed))

  const upcoming = useMemo(() => {
    const now = Date.now()
    return (data?.flights ?? [])
      .filter((f) => f.flightStatus === 'Scheduled' && parseServerDate(f.departureTime).getTime() > now)
      .sort((a, b) => parseServerDate(a.departureTime).getTime() - parseServerDate(b.departureTime).getTime())
  }, [data])
  const next = upcoming[0]

  const cheapestMoon = useMemo(() => {
    const moon = upcoming.filter((f) => resolveDestination(f.arrivalAirport)?.slug === 'moon')
    return moon.length ? Math.min(...moon.map((f) => f.price)) : undefined
  }, [upcoming])

  const featured = ['moon', 'mars', 'saturn'].map((s) => getDestination(s)!)

  return (
    <>
      {/* ---------- פתיחה ---------- */}
      <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-32 sm:px-8 lg:pt-40">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div className="flex flex-col items-start gap-8">
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-caption text-foreground-muted"
            >
              <span className="relative flex size-2" aria-hidden="true">
                <span className="absolute inline-flex size-full rounded-full bg-accent opacity-70 motion-safe:animate-pulse-ring" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              עונת השיגורים <span className="num">2027</span> נפתחה
            </motion.p>

            <h1 className="text-display">
              <motion.span
                className="block"
                initial={reduce ? false : { opacity: 0, y: 30, filter: 'blur(12px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.25, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              >
                לא עוד אופק.
              </motion.span>
              <motion.span
                className="text-shine block"
                initial={reduce ? false : { opacity: 0, y: 30, filter: 'blur(12px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.5, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              >
                יקום שלם.
              </motion.span>
            </h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.9 }}
              className="max-w-xl text-lead text-foreground-muted"
            >
              מסעות פרטיים אל המקומות שעד היום חיו רק בדמיון. תכנון מדויק, אירוח יוצא דופן והוד שאין לו קצה.
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.9 }}
              className="flex flex-wrap gap-3"
            >
              <Link to="/flights" search={{ destination: 'all' }} className={buttonClasses({ size: 'lg' })}>
                מצאו את המסע שלכם
              </Link>
              <Link to="/destinations" className={buttonClasses({ size: 'lg', variant: 'secondary' })}>
                לגלות את היעדים
              </Link>
            </motion.div>

            <dl className="mt-4 grid w-full max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
              <div>
                <dd className="font-display text-title text-foreground"><CountUp to={OPEN_DESTINATIONS.length} /></dd>
                <dt className="mt-1 text-caption text-foreground-subtle">יעדים שמימיים</dt>
              </div>
              <div>
                <dd className="font-display text-title text-foreground"><CountUp to={100} suffix="%" /></dd>
                <dt className="mt-1 text-caption text-foreground-subtle">פחמן מקוזז</dt>
              </div>
              <div>
                <dd className="font-display text-title text-foreground"><CountUp to={0.8} decimals={1} suffix="G" /></dd>
                <dt className="mt-1 text-caption text-foreground-subtle">כבידה נוחה</dt>
              </div>
            </dl>
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-[40rem]"
          >
            <OrbitSystem />
            <p className="mt-3 text-center text-caption text-foreground-subtle">גררו את המבט: בחרו כוכב מהמסלול</p>
          </motion.div>
        </div>

        <div className="mt-6 lg:mt-2">
          <SearchCard />
        </div>
      </section>

      {/* ---------- שיגור קרוב ---------- */}
      {next && (
        <section aria-label="השיגור הקרוב" className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="flex flex-col gap-4">
            <DemoNotice source={data?.source} reason={data?.reason} />
            <LaunchClock flight={next} />
          </Reveal>
        </section>
      )}

      {/* ---------- יעדים ---------- */}
      <section className="mx-auto mt-32 max-w-7xl px-5 sm:px-8" aria-labelledby="featured">
        <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-5">
            <Eyebrow>יעדים נבחרים</Eyebrow>
            <h2 id="featured" className="text-headline">שלושה עולמות.<br />אין־סוף נקודות מבט.</h2>
          </div>
          <Link to="/destinations" className="inline-flex items-center gap-2 text-body font-medium text-primary transition-all hover:gap-3">
            כל היעדים
            <ArrowLeft className="size-4" />
          </Link>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {featured.map((d, i) => (
            <Reveal key={d.slug} delay={i * 0.12}>
              <DestinationCard d={d} featured className="h-full" />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- הנדסת אמון ---------- */}
      <section className="mx-auto mt-32 max-w-7xl px-5 sm:px-8" aria-labelledby="trust">
        <Reveal className="flex max-w-2xl flex-col gap-5">
          <Eyebrow>הנדסת אמון</Eyebrow>
          <h2 id="trust" className="text-headline">הקסם מתחיל בדיוק.</h2>
          <p className="text-lead text-foreground-muted">כל פרט במסע תוכנן סביב גוף האדם: מכוח המשיכה ועד לכיוון האור בחלון הפרטי שלכם.</p>
        </Reveal>
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {TRUST.map(({ Icon, title, text, long }, i) => (
            <Reveal as="li" key={title} delay={i * 0.1} className="glass spotlight group rounded-panel p-7 shadow-card transition-shadow duration-500 hover:shadow-lift">
              <span className="grid size-14 place-items-center rounded-2xl border border-border-strong bg-primary-soft text-primary transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110">
                <Icon className="size-7" />
              </span>
              <p className="mt-6 text-caption text-accent">{title}</p>
              <h3 className="mt-2 text-title">{text}</h3>
              <p className="mt-3 text-foreground-muted">{long}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ---------- ציר המסע ---------- */}
      <section className="mx-auto mt-40 max-w-7xl px-5 sm:px-8" aria-label="שלבי המסע">
        <JourneyStages />
      </section>

      {/* ---------- פסוק ---------- */}
      <section className="relative mt-40 overflow-hidden py-28 sm:py-40" aria-label="מחשבה">
        <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(60% 60% at 50% 50%, var(--color-primary-soft), transparent 70%)' }} />
        <Reveal className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 text-center">
          <blockquote className="font-display text-[clamp(1.9rem,1rem+3.6vw,3.6rem)] leading-[1.3] text-foreground">
            הַשָּׁמַיִם מְסַפְּרִים כְּבוֹד אֵל וּמַעֲשֵׂה יָדָיו מַגִּיד הָרָקִיעַ
          </blockquote>
          <p className="text-caption text-foreground-subtle">תהילים י״ט, ב׳</p>
        </Reveal>
      </section>

      {/* ---------- מחשבון ---------- */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8" aria-label="מחשבון משקל">
        <Reveal>
          <WeightCalculator />
        </Reveal>
      </section>

      {/* ---------- קריאה לפעולה ---------- */}
      <section className="mx-auto mt-40 max-w-7xl px-5 sm:px-8" aria-labelledby="cta">
        <Reveal className="glass noise relative overflow-hidden rounded-[2.25rem] px-6 py-16 text-center shadow-lift sm:px-16 sm:py-24">
          <div aria-hidden="true" className="absolute -bottom-1/2 start-1/2 -z-10 size-[60rem] -translate-x-1/2 rounded-full opacity-70 blur-2xl" style={{ background: 'radial-gradient(closest-side, var(--color-primary-soft), transparent)' }} />
          <Eyebrow className="justify-center">המושב הבא ממתין</Eyebrow>
          <h2 id="cta" className="mx-auto mt-6 max-w-3xl text-headline">
            מכדור הארץ לירח,
            <br />
            {cheapestMoon ? (
              <>
                החל מ־<span className="num text-shine">{formatPrice(cheapestMoon)}</span>
              </>
            ) : (
              <span className="text-shine">בשלושה ימים.</span>
            )}
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/flights" search={{ destination: 'moon' }} className={buttonClasses({ size: 'lg' })}>
              התחלת מסע
            </Link>
            <Link to="/destinations/$slug" params={{ slug: 'moon' }} className={buttonClasses({ size: 'lg', variant: 'secondary' })}>
              עוד על הירח
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  )
}

