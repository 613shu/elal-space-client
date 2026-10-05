import { useEffect, useState } from 'react'

export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
  /** false עד שהקומפוננטה נטענה בצד לקוח: כדי לא ליצור אי־התאמה בהידרציה */
  ready: boolean
}

export function useCountdown(targetMs: number): Countdown {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (now === null) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: false, ready: false }
  const diff = Math.max(0, targetMs - now)
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
    done: diff === 0,
    ready: true,
  }
}
