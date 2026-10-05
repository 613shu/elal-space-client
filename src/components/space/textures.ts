import { cssRgb } from '~/lib/css'

export type TextureKind = 'moon' | 'mars' | 'saturn' | 'europa' | 'earth'

const W = 768
const H = 384

function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** רעש ערכים עם מחזוריות אופקית: הטקסטורה נמשכת ללא תפר כשהיא מסתובבת */
function makeNoise(seed: number) {
  const rnd = mulberry(seed)
  const table = new Float32Array(256 * 256)
  for (let i = 0; i < table.length; i++) table[i] = rnd()
  const at = (ix: number, iy: number, px: number) =>
    table[(((iy % 256) + 256) % 256) * 256 + (((ix % px) + px) % px)]
  const smooth = (t: number) => t * t * (3 - 2 * t)
  return (x: number, y: number, px: number) => {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = smooth(x - ix)
    const fy = smooth(y - iy)
    const a = at(ix, iy, px)
    const b = at(ix + 1, iy, px)
    const c = at(ix, iy + 1, px)
    const d = at(ix + 1, iy + 1, px)
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
  }
}

function fbm(n: ReturnType<typeof makeNoise>, u: number, v: number, base: number, oct: number) {
  let amp = 0.5
  let f = base
  let sum = 0
  let norm = 0
  for (let o = 0; o < oct; o++) {
    sum += amp * n(u * f, v * f * 0.5, f)
    norm += amp
    amp *= 0.5
    f *= 2
  }
  return sum / norm
}

const mix = (a: number[], b: number[], t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

function craters(ctx: CanvasRenderingContext2D, count: number, seed: number, light: string, dark: string) {
  const rnd = mulberry(seed)
  for (let i = 0; i < count; i++) {
    const r = Math.pow(rnd(), 2.4) * 34 + 3
    const x = rnd() * W
    const y = r + rnd() * (H - r * 2)
    for (const dx of [-W, 0, W]) {
      const cx = x + dx
      if (cx + r < 0 || cx - r > W) continue
      const g = ctx.createRadialGradient(cx - r * 0.25, y - r * 0.25, r * 0.1, cx, y, r)
      g.addColorStop(0, dark)
      g.addColorStop(0.78, dark)
      g.addColorStop(0.9, light)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.globalAlpha = 0.18 + rnd() * 0.18
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
}

function cracks(ctx: CanvasRenderingContext2D, count: number, seed: number, color: string) {
  const rnd = mulberry(seed)
  ctx.lineCap = 'round'
  for (let i = 0; i < count; i++) {
    let x = rnd() * W
    let y = rnd() * H
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.25 + rnd() * 0.4
    ctx.lineWidth = 0.8 + rnd() * 2.4
    let ang = rnd() * Math.PI * 2
    for (const dx of [-W, 0, W]) {
      ctx.beginPath()
      let px = x + dx
      let py = y
      let a = ang
      ctx.moveTo(px, py)
      const steps = 6 + Math.floor(rnd() * 12)
      const r2 = mulberry(seed + i)
      for (let s = 0; s < steps; s++) {
        a += (r2() - 0.5) * 0.6
        px += Math.cos(a) * (12 + r2() * 26)
        py += Math.sin(a) * (8 + r2() * 14)
        ctx.lineTo(px, py)
      }
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}

const cache = new Map<TextureKind, string>()

/** מפיק טקסטורה (data URL) לכוכב. נקרא רק בצד לקוח. מתמזג בין צבעי הטוקנים של העיצוב. */
export function getPlanetTexture(kind: TextureKind): string {
  const hit = cache.get(kind)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(W, H)
  const noise = makeNoise(kind.length * 977 + kind.charCodeAt(0) * 31)
  const noise2 = makeNoise(kind.charCodeAt(1) * 53 + 7)

  const col = (k: string, tone: 'light' | 'dark') => cssRgb(`--color-planet-${k}-${tone}`)

  for (let y = 0; y < H; y++) {
    const v = y / H
    const lat = Math.abs(v - 0.5) * 2 // 0 במשוויון, 1 בקוטב
    for (let x = 0; x < W; x++) {
      const u = x / W
      let rgb: [number, number, number]

      if (kind === 'moon') {
        const big = fbm(noise, u, v, 3, 5)
        const fine = fbm(noise2, u, v, 14, 3)
        const maria = smoothstep(0.46, 0.62, big)
        rgb = mix(col('moon', 'light'), col('moon', 'dark'), maria * 0.85)
        const grain = (fine - 0.5) * 36
        rgb = [rgb[0] + grain, rgb[1] + grain, rgb[2] + grain]
      } else if (kind === 'mars') {
        const big = fbm(noise, u, v, 3, 5)
        const fine = fbm(noise2, u, v, 12, 4)
        const dark = smoothstep(0.42, 0.62, big)
        rgb = mix(col('mars', 'light'), col('mars', 'dark'), dark * 0.9)
        const grain = (fine - 0.5) * 40
        rgb = [rgb[0] + grain, rgb[1] + grain * 0.7, rgb[2] + grain * 0.5]
        const cap = smoothstep(0.88, 0.97, lat)
        rgb = mix(rgb, [245, 246, 250], cap * 0.9)
      } else if (kind === 'saturn') {
        const warp = fbm(noise, u, v, 4, 3) * 0.09
        const band = Math.sin((v + warp) * Math.PI * 17) * 0.5 + 0.5
        const band2 = Math.sin((v + warp * 1.5) * Math.PI * 41 + 1.3) * 0.5 + 0.5
        const t = clamp01(band * 0.65 + band2 * 0.35)
        rgb = mix(col('saturn', 'light'), col('saturn', 'dark'), t * 0.8 + fbm(noise2, u, v, 9, 3) * 0.2)
        rgb = mix(rgb, col('saturn', 'dark'), smoothstep(0.8, 1, lat) * 0.5)
      } else if (kind === 'europa') {
        const big = fbm(noise, u, v, 4, 5)
        const fine = fbm(noise2, u, v, 16, 3)
        rgb = mix(col('europa', 'light'), col('europa', 'dark'), smoothstep(0.4, 0.75, big) * 0.55)
        const grain = (fine - 0.5) * 24
        rgb = [rgb[0] + grain, rgb[1] + grain, rgb[2] + grain]
      } else {
        const land = fbm(noise, u, v, 3, 6)
        const isLand = smoothstep(0.52, 0.56, land)
        const sea = mix(cssRgb('--color-planet-earth-sea'), [10, 40, 110], smoothstep(0.2, 0.5, land))
        const ground = mix(cssRgb('--color-planet-earth-land'), [130, 120, 80], fbm(noise2, u, v, 9, 3))
        rgb = mix(sea, ground, isLand)
        const cl = smoothstep(0.5, 0.78, fbm(noise2, u, v, 5, 5))
        rgb = mix(rgb, cssRgb('--color-planet-earth-cloud'), cl * 0.85)
        rgb = mix(rgb, [245, 248, 255], smoothstep(0.86, 0.95, lat))
      }

      const i = (y * W + x) * 4
      img.data[i] = rgb[0]
      img.data[i + 1] = rgb[1]
      img.data[i + 2] = rgb[2]
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)

  if (kind === 'moon') {
    const [lr, lg, lb] = col('moon', 'light')
    const [dr, dg, db] = col('moon', 'dark')
    craters(ctx, 60, 11, `rgba(${lr},${lg},${lb},1)`, `rgba(${dr},${dg},${db},1)`)
  }
  if (kind === 'mars') {
    const [dr, dg, db] = col('mars', 'dark')
    craters(ctx, 22, 5, 'rgba(240,170,130,1)', `rgba(${dr},${dg},${db},1)`)
  }
  if (kind === 'europa') {
    const [dr, dg, db] = col('europa', 'dark')
    cracks(ctx, 34, 21, `rgb(${dr},${dg},${db})`)
  }

  const url = canvas.toDataURL('image/jpeg', 0.86)
  cache.set(kind, url)
  return url
}
