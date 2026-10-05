import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Button } from '~/components/ui/Button'
import { SelectField } from '~/components/ui/Field'
import { Rocket } from '~/components/ui/Icons'
import { flightsQuery } from '~/lib/api/queries'
import { useIsAuthed } from '~/lib/auth/store'
import { OPEN_DESTINATIONS, resolveDestination } from '~/lib/content/destinations'
import { monthKey, monthKeyLabel } from '~/lib/format/date'

/** חיפוש מהיר בדף הבית: יעד וחודש. החודשים נגזרים מהטיסות שבאמת קיימות. */
export function SearchCard() {
  const authed = useIsAuthed()
  const { data } = useQuery(flightsQuery(authed))
  const nav = useNavigate()
  const [destination, setDestination] = useState('all')
  const [month, setMonth] = useState('all')

  const months = useMemo(() => {
    const set = new Set<string>()
    for (const f of data?.flights ?? []) {
      if (f.flightStatus !== 'Scheduled') continue
      if (destination !== 'all' && resolveDestination(f.arrivalAirport)?.slug !== destination) continue
      set.add(monthKey(f.departureTime))
    }
    return [...set].sort()
  }, [data, destination])

  return (
    <form
      aria-label="חיפוש מסע"
      className="glass relative grid gap-4 rounded-panel p-5 shadow-lift sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-6"
      onSubmit={(e) => {
        e.preventDefault()
        nav({
          to: '/flights',
          search: { destination, month: month === 'all' ? undefined : month },
        })
      }}
    >
      <SelectField label="לאן?" value={destination} onChange={(e) => { setDestination(e.target.value); setMonth('all') }}>
        <option value="all">כל היעדים</option>
        {OPEN_DESTINATIONS.map((d) => (
          <option key={d.slug} value={d.slug}>
            {d.name}
          </option>
        ))}
      </SelectField>
      <SelectField label="מתי?" value={month} onChange={(e) => setMonth(e.target.value)}>
        <option value="all">כל התאריכים</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {monthKeyLabel(m)}
          </option>
        ))}
      </SelectField>
      <Button type="submit" size="lg" icon={<Rocket className="size-5" />} className="sm:min-w-44">
        חיפוש מסע
      </Button>
    </form>
  )
}
