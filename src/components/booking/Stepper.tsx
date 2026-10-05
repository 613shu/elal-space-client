import { clsx } from 'clsx'
import { Check } from '~/components/ui/Icons'

const STEPS = ['מושב', 'נוסעים', 'תשלום', 'אישור']

/** מצב התקדמות: ol עם aria-current. הצעד הנוכחי מודגש והקודמים מסומנים כהושלמו. */
export function Stepper({ current }: { current: number }) {
  return (
    <nav aria-label="שלבי ההזמנה">
      <ol className="flex items-center gap-2 sm:gap-4">
        {STEPS.map((label, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={label} className="flex flex-1 items-center gap-2 sm:gap-4" aria-current={active ? 'step' : undefined}>
              <span
                className={clsx(
                  'grid size-9 shrink-0 place-items-center rounded-full border text-caption font-semibold transition-all duration-500',
                  done && 'border-success bg-success-soft text-success',
                  active && 'border-primary bg-primary text-primary-foreground shadow-glow',
                  !done && !active && 'border-border-strong text-foreground-subtle',
                )}
              >
                {done ? <Check className="size-4" /> : <span className="num">{i + 1}</span>}
              </span>
              <span className={clsx('hidden text-caption font-medium sm:block', active ? 'text-foreground' : 'text-foreground-subtle')}>
                {label}
                <span className="sr-only">{done ? ' (הושלם)' : active ? ' (השלב הנוכחי)' : ''}</span>
              </span>
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className="relative h-px flex-1 bg-border">
                  <span className={clsx('absolute inset-y-0 start-0 bg-gradient-to-l from-accent to-primary transition-all duration-700', done ? 'w-full' : 'w-0')} />
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
