/** אות "קפיצה למהירות על־אורית": שדה הכוכבים מאריך קווים לכמה רגעים (למשל אחרי אישור הזמנה) */
type Listener = (durationMs: number) => void
const listeners = new Set<Listener>()

export function onWarp(l: Listener) {
  listeners.add(l)
  return () => void listeners.delete(l)
}

export function triggerWarp(durationMs = 1400) {
  listeners.forEach((l) => l(durationMs))
}
