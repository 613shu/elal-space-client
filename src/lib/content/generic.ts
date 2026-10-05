import type { Destination } from './destinations'
import { resolveDestination } from './destinations'

/** יעד שהשרת מכיר אבל אין לו תוכן בקטלוג: עמוד סביר במקום שבר */
export function destinationFor(arrivalAirport: string): Destination {
  const found = resolveDestination(arrivalAirport)
  if (found) return found
  return {
    slug: 'unknown',
    planet: 'moon',
    name: arrivalAirport,
    eyebrow: 'יעד מיוחד',
    place: arrivalAirport,
    tagline: 'מסע אל מקום שעוד לא תיארנו במילים.',
    summary: '',
    story: [],
    status: 'open',
    aliases: [],
    stats: { durationLabel: '—', gravityLabel: '—', dayLength: '—' },
    highlights: [],
    milestones: [
      { at: 0, label: 'יציאה', title: 'שיגור', text: 'עלייה למסלול והתחלת המסע.' },
      { at: 0.5, label: 'אמצע המסע', title: 'חצי הדרך', text: 'הנקודה שבה הבית כבר רחוק והיעד עוד לא קרוב.' },
      { at: 1, label: 'הגעה', title: 'הגעה ליעד', text: 'סוף המסע ותחילת ההרפתקה.' },
    ],
    vessel: { name: '—', kind: '', text: '', features: [] },
    info: [],
    faq: [],
  }
}
