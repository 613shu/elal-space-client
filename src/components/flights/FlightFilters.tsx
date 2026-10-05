import * as Slider from '@radix-ui/react-slider'
import { Check, SelectField } from '~/components/ui/Field'
import { Button } from '~/components/ui/Button'
import { formatPrice } from '~/lib/format/money'
import { monthKeyLabel } from '~/lib/format/date'

export type SortKey = 'date' | 'price' | 'duration'

export interface FilterState {
  month?: string
  sort: SortKey
  max?: number
  amenities: string[]
  seats: boolean
}

interface Props {
  state: FilterState
  months: string[]
  amenities: string[]
  priceBounds: [number, number]
  onChange: (patch: Partial<FilterState>) => void
  onReset: () => void
  activeCount: number
}

export function FlightFilters({ state, months, amenities, priceBounds, onChange, onReset, activeCount }: Props) {
  const [lo, hi] = priceBounds
  const max = Math.min(Math.max(state.max ?? hi, lo), hi)
  const step = Math.max(1000, Math.round((hi - lo) / 60 / 1000) * 1000)

  return (
    <div className="flex flex-col gap-7">
      <SelectField label="מיון" value={state.sort} onChange={(e) => onChange({ sort: e.target.value as SortKey })}>
        <option value="date">המסע הקרוב ביותר</option>
        <option value="price">המחיר הנמוך ביותר</option>
        <option value="duration">המסע הקצר ביותר</option>
      </SelectField>

      <SelectField label="חודש יציאה" value={state.month ?? 'all'} onChange={(e) => onChange({ month: e.target.value === 'all' ? undefined : e.target.value })}>
        <option value="all">כל התאריכים</option>
        {months.map((m) => (
          <option key={m} value={m}>{monthKeyLabel(m)}</option>
        ))}
      </SelectField>

      {hi > lo && (
        <div className="flex flex-col gap-4">
          <label id="price-label" className="flex items-baseline justify-between text-caption font-medium text-foreground-muted">
            <span>מחיר מרבי</span>
            <output className="text-body text-foreground num">{formatPrice(max)}</output>
          </label>
          <Slider.Root
            dir="rtl"
            min={lo}
            max={hi}
            step={step}
            value={[max]}
            onValueChange={([v]) => onChange({ max: v >= hi ? undefined : v })}
            aria-labelledby="price-label"
            className="relative flex h-6 w-full touch-none select-none items-center"
          >
            <Slider.Track className="relative h-1.5 grow rounded-full bg-border">
              <Slider.Range className="absolute h-full rounded-full bg-gradient-to-l from-primary to-accent" />
            </Slider.Track>
            <Slider.Thumb aria-label="מחיר מרבי" className="block size-5 rounded-full bg-foreground shadow-glow outline-none transition hover:scale-110 focus-visible:shadow-focus" />
          </Slider.Root>
        </div>
      )}

      {amenities.length > 0 && (
        <fieldset className="flex flex-col gap-3.5">
          <legend className="mb-1 text-caption font-medium text-foreground-muted">מה כלול</legend>
          {amenities.map((a) => (
            <Check
              key={a}
              label={a}
              checked={state.amenities.includes(a)}
              onChange={(e) => onChange({ amenities: e.target.checked ? [...state.amenities, a] : state.amenities.filter((x) => x !== a) })}
            />
          ))}
        </fieldset>
      )}

      <Check label="רק מסעות עם מקומות פנויים" checked={state.seats} onChange={(e) => onChange({ seats: e.target.checked })} />

      <Button variant="ghost" size="sm" onClick={onReset} disabled={activeCount === 0} className="self-start">
        ניקוי סינון{activeCount > 0 ? ` (${activeCount})` : ''}
      </Button>
    </div>
  )
}
