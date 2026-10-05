import type { Order } from '~/lib/api/types'
import { parseServerDate } from '~/lib/format/date'

const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')

/** קובץ יומן (.ics) להמראה: אמיתי וקריא בכל אפליקציית יומן */
export function buildIcs(order: Order, destinationName: string, seat?: string): string {
  const f = order.flight
  const start = parseServerDate(f.departureTime)
  const end = parseServerDate(f.arrivalTime)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EL AL SPACE//HE',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:order-${order.id}@elal-space`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(`אל על חלל ${f.flightNumber}: ${f.departureAirport} אל ${destinationName}`)}`,
    `DESCRIPTION:${esc(`הזמנה ${order.id}${seat ? `, מושב ${seat}` : ''}. המסע יוצא מ${f.departureAirport}.`)}`,
    `LOCATION:${esc(f.departureAirport)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc('מחר יוצאים למסע')}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadText(filename: string, text: string, mime = 'text/calendar;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
