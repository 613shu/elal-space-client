import * as Slider from '@radix-ui/react-slider'
import { useId, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Link } from '@tanstack/react-router'
import { DESTINATIONS } from '~/lib/content/destinations'

const EARTH = { slug: 'earth', name: 'כדור הארץ', g: 1 }

/** "כמה תשקלו שם?": המחשבה הראשונה של כל נוסע. משקל = מסה × כבידה, ולכן הכול נגזר מ-0.16G וחבריו. */
export function WeightCalculator({ embedded = false }: { embedded?: boolean }) {
  const [kg, setKg] = useState(70)
  const id = useId()
  const reduce = useReducedMotion()
  const rows = [
    EARTH,
    ...DESTINATIONS.filter((d) => d.stats.gravityG !== undefined).map((d) => ({ slug: d.slug, name: d.name, g: d.stats.gravityG as number })),
  ]
  const max = Math.max(...rows.map((r) => r.g))

  return (
    <div className={embedded ? 'grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12' : 'glass grid gap-10 rounded-panel p-6 shadow-card sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14'}>
      <div className="flex flex-col justify-center gap-6">
        {!embedded && <h3 className="text-headline">כמה תשקלו שם?</h3>}
        {embedded ? (
          <p className="text-lead text-foreground-muted">גררו את המחוון ותראו מה יראו המאזניים בכל יעד.</p>
        ) : (
          <p className="text-lead text-foreground-muted">
            המסה שלכם נשארת זהה בכל מקום. מה שמשתנה הוא הכבידה, ואיתה מה שהמאזניים אומרים. גררו ותראו.
          </p>
        )}
        <div className="flex flex-col gap-4">
          <label id={`${id}-label`} htmlFor={id} className="flex items-baseline justify-between text-caption text-foreground-muted">
            <span>המשקל שלכם בכדור הארץ</span>
            <output htmlFor={id} className="text-title text-foreground"><span className="num">{kg}</span> ק״ג</output>
          </label>
          <Slider.Root
            id={id}
            dir="rtl"
            min={30}
            max={150}
            step={1}
            value={[kg]}
            onValueChange={([v]) => setKg(v)}
            aria-labelledby={`${id}-label`}
            className="relative flex h-8 w-full touch-none select-none items-center"
          >
            <Slider.Track className="relative h-1.5 grow rounded-full bg-border">
              <Slider.Range className="absolute h-full rounded-full bg-gradient-to-l from-primary to-accent" />
            </Slider.Track>
            <Slider.Thumb
              aria-label="משקל בק״ג"
              className="block size-6 rounded-full bg-foreground shadow-glow outline-none transition hover:scale-110 focus-visible:shadow-focus"
            />
          </Slider.Root>
        </div>
      </div>

      <ul className="flex flex-col gap-3.5" aria-label="המשקל שלכם בכל יעד">
        {rows.map((r, i) => {
          const w = kg * r.g
          return (
            <li key={r.slug} className="grid grid-cols-[6.5rem_1fr_5.5rem] items-center gap-4 text-body">
              <span className={r.slug === 'earth' ? 'text-foreground-muted' : 'text-foreground'}>
                {r.slug === 'earth' ? (
                  r.name
                ) : (
                  <Link to="/destinations/$slug" params={{ slug: r.slug }} className="underline-offset-4 hover:underline">
                    {r.name}
                  </Link>
                )}
              </span>
              <span className="relative h-2.5 overflow-hidden rounded-full bg-surface-sunken">
                <motion.span
                  className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-l from-primary to-accent"
                  initial={false}
                  animate={{ width: `${Math.max(1.5, (r.g / max) * 100)}%` }}
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20, delay: i * 0.03 }}
                />
              </span>
              <span className="text-end font-medium text-foreground">
                <span className="num">{w < 10 ? w.toFixed(1) : Math.round(w)}</span> ק״ג
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-caption text-foreground-subtle lg:col-span-2">
        בתחנת המסלול אתם בנפילה חופשית, ולכן המאזניים מראים אפס. על שבתאי חישוב הכבידה הוא בגובה ענני הכוכב; המסע נעשה במסלול סביבו.
      </p>
    </div>
  )
}
