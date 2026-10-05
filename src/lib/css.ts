/** קריאת טוקן צבע מ-CSS (hex) לשימוש ב-canvas. הטוקנים נשארים המקור היחיד לצבעים. */
export function cssVar(name: string): string {
  if (typeof document === 'undefined') return '#ffffff'
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#ffffff'
}

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export const cssRgb = (name: string) => hexToRgb(cssVar(name))
