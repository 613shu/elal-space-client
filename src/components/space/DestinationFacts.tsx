import { Clock, Gravity, Route, Thermo } from '~/components/ui/Icons'
import { StatTile } from '~/components/ui/StatTile'
import type { Destination } from '~/lib/content/destinations'
import { formatNumber } from '~/lib/format/money'

export function DestinationFacts({ d }: { d: Destination }) {
  const s = d.stats
  return (
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatTile
        icon={<Route className="size-6" />}
        label="מרחק"
        value={s.distanceKm ? <><span className="num">{formatNumber(s.distanceKm)}</span> ק״מ</> : '—'}
        note={s.distanceNote}
      />
      <StatTile icon={<Gravity className="size-6" />} label="כבידה" value={<span className="num">{s.gravityLabel}</span>} note="יחסית לכדור הארץ" />
      <StatTile
        icon={<Thermo className="size-6" />}
        label="טמפרטורה ממוצעת"
        value={s.avgTempC !== undefined ? <span className="num">{s.avgTempC}°</span> : '—'}
      />
      <StatTile icon={<Clock className="size-6" />} label="אורך יום" value={s.dayLength} />
    </dl>
  )
}
