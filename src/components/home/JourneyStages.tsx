import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useSpring, useReducedMotion } from 'motion/react'
import { clsx } from 'clsx'
import { PlanetArt, type ArtKind } from '~/components/space/PlanetArt'
import { Eyebrow } from '~/components/ui/Eyebrow'

const STAGES: Array<{ title: string; text: string; art: ArtKind }> = [
  { title: 'הכשרה', text: 'לפני כל מסע, ימי הכשרה בכדור הארץ. הם כלולים במחיר, ומיועדים גם למי שמעולם לא עזב את הקרקע.', art: 'earth' },
  { title: 'שיגור', text: 'עלייה למסלול, ושעה שקטה מול החלון: כדור הארץ הופך לאט מבית לכוכב.', art: 'station' },
  { title: 'המסע', text: 'כבידה מדומה, ארוחות שף, ספרייה וחלון פרטי. הזמן בחלל נעשה חלק מהחוויה ולא המתנה לה.', art: 'mars' },
  { title: 'הגעה', text: 'נחיתה או כניסה למסלול, והעולם שחלמתם עליו מתגלה מול העיניים.', art: 'saturn' },
]

/** ציר זמן מונע גלילה: קו שמתמלא, ובצד כוכב שמתחלף בכל שלב */
export function JourneyStages() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 55%'] })
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 })
  const [active, setActive] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => setActive(Math.min(STAGES.length - 1, Math.max(0, Math.floor(v * STAGES.length * 0.999)))))

  return (
    <div ref={ref} className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
      <div className="lg:sticky lg:top-32 lg:self-start">
        <Eyebrow>המסע, שלב אחר שלב</Eyebrow>
        <h2 className="mt-5 text-headline">כל פרט תוכנן, כדי שתוכלו רק להסתכל.</h2>
        <div className="relative mx-auto mt-12 grid aspect-square w-full max-w-sm place-items-center">
          {STAGES.map((s, i) => (
            <motion.div
              key={s.title}
              className="absolute inset-0 grid place-items-center"
              initial={false}
              animate={{ opacity: active === i ? 1 : 0, scale: active === i ? 1 : 0.86, filter: active === i ? 'blur(0px)' : 'blur(10px)' }}
              transition={reduce ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <PlanetArt kind={s.art} size="72%" period={100} />
            </motion.div>
          ))}
        </div>
      </div>

      <ol className="relative flex flex-col gap-16 ps-10 lg:py-16">
        <span aria-hidden="true" className="absolute inset-y-2 start-[11px] w-px bg-border" />
        <motion.span aria-hidden="true" className="absolute inset-y-2 start-[11px] w-px origin-top bg-gradient-to-b from-accent to-primary" style={{ scaleY: reduce ? 1 : fill }} />
        {STAGES.map((s, i) => (
          <li key={s.title} className={clsx('relative transition-opacity duration-500', active >= i ? 'opacity-100' : 'opacity-55')}>
            <span
              aria-hidden="true"
              className={clsx(
                'absolute -start-10 top-1.5 grid size-6 place-items-center rounded-full border-2 transition-all duration-500',
                active >= i ? 'border-accent bg-background shadow-glow-accent' : 'border-border-strong bg-background',
              )}
            >
              <span className={clsx('size-2 rounded-full transition-colors', active >= i ? 'bg-accent' : 'bg-border-strong')} />
            </span>
            <p className="text-caption text-accent">שלב <span className="num">{i + 1}</span></p>
            <h3 className="mt-2 text-title">{s.title}</h3>
            <p className="mt-3 max-w-md text-lead text-foreground-muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
