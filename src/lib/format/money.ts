const ils = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })
const compact = new Intl.NumberFormat('he-IL', { notation: 'compact', maximumFractionDigits: 1 })
const plain = new Intl.NumberFormat('he-IL')

export const formatPrice = (n: number) => ils.format(n)
export const formatCompact = (n: number) => compact.format(n)
export const formatNumber = (n: number) => plain.format(n)

/** מרחק בעברית קריאה: "384 אלף" / "78 מיליון" (ללא סימוני K/M לטיניים) */
export function formatDistance(km: number): string {
  if (km >= 1_000_000) {
    const v = km / 1_000_000
    return `${Number.isInteger(v) ? v : v.toFixed(1)} מיליון`
  }
  if (km >= 1_000) return `${Math.round(km / 1_000)} אלף`
  return plain.format(km)
}
