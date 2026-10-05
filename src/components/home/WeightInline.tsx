import { useState } from 'react'
import * as Slider from '@radix-ui/react-slider'

/** גרסה קטנה של מחשבון המשקל, ליעד אחד */
export function WeightInline({ g, name }: { g: number; name: string }) {
  const [kg, setKg] = useState(70)
  const w = kg * g
  return (
    <div className="glass flex flex-col gap-5 rounded-panel p-6 sm:p-8">
      <h3 className="text-title">כמה תשקלו על {name}?</h3>
      <div className="flex flex-col gap-4">
        <label id="kg-in" className="flex items-baseline justify-between text-caption text-foreground-muted">
          <span>המשקל שלכם בכדור הארץ</span>
          <span className="text-body text-foreground"><span className="num">{kg}</span> ק״ג</span>
        </label>
        <Slider.Root dir="rtl" min={30} max={150} step={1} value={[kg]} onValueChange={([v]) => setKg(v)} aria-labelledby="kg-in" className="relative flex h-6 w-full touch-none select-none items-center">
          <Slider.Track className="relative h-1.5 grow rounded-full bg-border">
            <Slider.Range className="absolute h-full rounded-full bg-gradient-to-l from-primary to-accent" />
          </Slider.Track>
          <Slider.Thumb aria-label="משקל בק״ג" className="block size-5 rounded-full bg-foreground shadow-glow outline-none transition hover:scale-110 focus-visible:shadow-focus" />
        </Slider.Root>
      </div>
      <p aria-live="polite" className="font-display text-[clamp(2.2rem,1.4rem+3vw,3.4rem)] leading-none text-shine">
        <span className="num">{w < 10 ? w.toFixed(1) : Math.round(w)}</span> ק״ג
      </p>
    </div>
  )
}
