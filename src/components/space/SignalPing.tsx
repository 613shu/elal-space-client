import { Signal } from '~/components/ui/Icons'
import { formatSignalDelay } from '~/lib/format/duration'

/** כמה זמן לוקח לאות מהספינה להגיע הביתה. האנימציה מואצת, והמספר הוא האמיתי. */
export function SignalPing({ seconds, name }: { seconds: number; name: string }) {
  const anim = Math.min(9, 1.4 + Math.log10(1 + seconds) * 1.7)
  return (
    <figure className="glass rounded-panel p-6 sm:p-8">
      <div className="flex items-center gap-4 sm:gap-6" dir="rtl">
        <span className="grid size-12 shrink-0 place-items-center rounded-full border border-border-strong bg-primary-soft text-primary">
          <Signal className="size-6" />
        </span>
        <div className="relative h-px flex-1 bg-border-strong">
          <span
            aria-hidden="true"
            className="absolute -top-[5px] size-[11px] rounded-full bg-accent shadow-glow-accent"
            style={{ animation: `ping-travel ${anim}s linear infinite`, insetInlineStart: 0 }}
          />
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-full border border-border-strong bg-surface-raised text-caption font-semibold">
          {name.slice(0, 2)}
        </span>
      </div>
      <figcaption className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-title text-foreground">{formatSignalDelay(seconds)}</span>
        <span className="text-foreground-muted">לוקח לאות להגיע מכדור הארץ אל {name}, בכל כיוון. התנועה בציור מואצת.</span>
      </figcaption>
    </figure>
  )
}
