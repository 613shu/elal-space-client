import { z } from 'zod'

export const luhn = (num: string) => {
  const d = num.replace(/\D/g, '')
  if (d.length < 12) return false
  let sum = 0
  let alt = false
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i])
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

export const travelerSchema = z.object({
  fullName: z.string().trim().min(2, 'נא להזין שם מלא כפי שמופיע בדרכון'),
  idNumber: z.string().trim().regex(/^[A-Za-z0-9]{6,12}$/, 'מספר דרכון או תעודה: 6 עד 12 אותיות או ספרות'),
  birthDate: z
    .string()
    .min(1, 'נא להזין תאריך לידה')
    .refine((v) => !Number.isNaN(Date.parse(v)) && Date.parse(v) < Date.now(), 'תאריך הלידה אינו תקין'),
  phone: z.string().trim().regex(/^\+?[\d\s-]{9,15}$/, 'מספר טלפון תקין, למשל 050-1234567'),
  emergencyName: z.string().trim().min(2, 'נא להזין שם איש קשר'),
  emergencyPhone: z.string().trim().regex(/^\+?[\d\s-]{9,15}$/, 'מספר טלפון תקין, למשל 050-1234567'),
  meal: z.enum(['kosher', 'vegetarian', 'vegan', 'gluten-free', 'regular']),
  health: z.literal(true, { message: 'יש לאשר את הצהרת הבריאות כדי להמשיך' }),
  terms: z.literal(true, { message: 'יש לאשר את תנאי המסע כדי להמשיך' }),
})

export const paymentSchema = z.object({
  cardNumber: z.string().refine(luhn, 'מספר הכרטיס אינו תקין'),
  cardName: z.string().trim().min(2, 'נא להזין את השם על הכרטיס'),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/, 'תוקף בפורמט MM/YY')
    .refine((v) => {
      const [m, y] = v.split('/').map((x) => Number(x.trim()))
      const end = new Date(2000 + y, m, 1).getTime()
      return end > Date.now()
    }, 'הכרטיס פג תוקף'),
  cvc: z.string().regex(/^\d{3,4}$/, 'שלוש או ארבע ספרות'),
})

export type FieldErrors<T extends string> = Partial<Record<T, string>>

export function zodErrors<T extends string>(err: z.ZodError): FieldErrors<T> {
  const out: FieldErrors<T> = {}
  for (const issue of err.issues) {
    const k = String(issue.path[0]) as T
    if (!out[k]) out[k] = issue.message
  }
  return out
}
