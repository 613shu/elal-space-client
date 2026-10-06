import { motion, useReducedMotion } from 'motion/react'
import { Coins, Gauge, Rocket, Users } from '~/components/ui/Icons'
import type { DestinationLoad, Overview } from '~/lib/admin/stats'
import { formatNumber, formatPrice } from '~/lib/format/money'
import { AnimatedNumber, KpiTile, OccupancyMeter, PlanetBadge } from './parts'

export function AdminOverview({ overview: o, load }: { overview: Overview; load: DestinationLoad[] }) {
  const reduce = useReducedMotion()
  return (
    <section aria-label="תמונת מצב" className="flex flex-col gap-6">
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile icon={<Users className="size-5" />} label="לקוחות רשומים" note="חשבונות נוסעים פעילים באתר">
          <AnimatedNumber value={o.customers} format={(n) => formatNumber(Math.round(n))} />
        </KpiTile>
        <KpiTile icon={<Rocket className="size-5" />} label="מסעות מתוכננים" tone="accent" delay={0.07} note={o.soldOut === 1 ? 'אחד מהם מלא' : o.soldOut > 1 ? <><span className="num">{o.soldOut}</span> מהם מלאים</> : 'שעוד לא יצאו לדרך'}>
          <AnimatedNumber value={o.upcomingFlights} />
        </KpiTile>
        <KpiTile icon={<Gauge className="size-5" />} label="נוסעים רשומים" tone="success" delay={0.14} note={<>תפוסה כוללת של <span className="num">{Math.round(o.occupancy * 100)}%</span></>}>
          <AnimatedNumber value={o.travelers} format={(n) => formatNumber(Math.round(n))} />
        </KpiTile>
        <KpiTile icon={<Coins className="size-5" />} label="הכנסות מהזמנות" tone="gold" delay={0.21} note="סך ההזמנות המאושרות באתר">
          <AnimatedNumber value={o.revenue} format={(n) => formatPrice(Math.round(n))} />
        </KpiTile>
      </dl>

      {load.length > 0 && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-panel p-6 shadow-card sm:p-8"
        >
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-title">תפוסה לפי יעד</h2>
            <p className="text-caption text-foreground-subtle">נוסעים רשומים מתוך כלל המושבים, במסעות שעוד לא יצאו</p>
          </div>
          <ul className="grid gap-x-10 gap-y-6 md:grid-cols-2">
            {load.map((d) => (
              <li key={d.name} className="flex items-center gap-3">
                <PlanetBadge kind={d.planet} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium text-foreground">{d.name}</span>
                    <span className="shrink-0 text-caption text-foreground-subtle">
                      <span className="num">{d.flights}</span> {d.flights === 1 ? 'מסע' : 'מסעות'}
                    </span>
                  </div>
                  <OccupancyMeter booked={d.booked} seats={d.seats} />
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </section>
  )
}
