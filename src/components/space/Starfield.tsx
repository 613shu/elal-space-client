import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { cssRgb } from '~/lib/css'
import { onWarp } from './warp'

interface Star {
  x: number // 0..1
  y: number // 0..1
  z: number // 0..1 עומק: קרוב = 1
  r: number
  tw: number
  ph: number
  tint: 0 | 1 | 2
}

/**
 * שדה כוכבים בשלוש שכבות עומק עם פרלקסה לסמן ולגלילה.
 * מכבד "הפחתת תנועה" (ציור יחיד), מושהה בטאב מוסתר, ותומך באפקט קפיצה.
 */
export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const palette = [cssRgb('--color-foreground'), cssRgb('--color-primary'), cssRgb('--color-accent')]
    let w = 0
    let h = 0
    let dpr = 1
    let stars: Star[] = []
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    let scrollY = 0
    let warp = 0
    let warpTarget = 0
    let warpTimer: ReturnType<typeof setTimeout> | undefined
    let raf = 0
    let running = false
    let shooting: { x: number; y: number; vx: number; vy: number; life: number } | null = null
    let nextShoot = performance.now() + 5000

    const seed = (() => {
      let s = 1337
      return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
    })()

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const count = Math.round(Math.min(420, Math.max(120, (w * h) / 5200)))
      stars = Array.from({ length: count }, () => {
        const z = Math.pow(seed(), 1.6)
        const t = seed()
        return {
          x: seed(),
          y: seed(),
          z,
          r: 0.35 + z * 1.35,
          tw: 0.6 + seed() * 1.8,
          ph: seed() * Math.PI * 2,
          tint: t > 0.93 ? 2 : t > 0.8 ? 1 : 0,
        }
      })
      draw(performance.now())
    }

    const draw = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      pointer.x += (pointer.tx - pointer.x) * 0.05
      pointer.y += (pointer.ty - pointer.y) * 0.05
      warp += (warpTarget - warp) * 0.07

      const cx = w / 2
      const cy = h / 2
      for (const s of stars) {
        const par = s.z * 26
        let px = s.x * w - pointer.x * par
        let py = ((s.y * h - scrollY * (0.02 + s.z * 0.1) - pointer.y * par) % h + h) % h
        const [r, g, b] = palette[s.tint]
        const tw = reduce ? 0.85 : 0.55 + 0.45 * Math.sin(now * 0.001 * s.tw + s.ph)
        const a = (0.25 + s.z * 0.75) * tw

        if (warp > 0.02) {
          const dx = px - cx
          const dy = py - cy
          const len = Math.hypot(dx, dy) || 1
          const stretch = warp * (40 + s.z * 340)
          ctx.strokeStyle = `rgba(${r},${g},${b},${Math.min(1, a + warp * 0.4)})`
          ctx.lineWidth = s.r * (1 + warp)
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(px + (dx / len) * stretch, py + (dy / len) * stretch)
          ctx.stroke()
          continue
        }

        ctx.fillStyle = `rgba(${r},${g},${b},${a})`
        ctx.beginPath()
        ctx.arc(px, py, s.r, 0, Math.PI * 2)
        ctx.fill()
        if (s.z > 0.88) {
          ctx.fillStyle = `rgba(${r},${g},${b},${a * 0.18})`
          ctx.beginPath()
          ctx.arc(px, py, s.r * 3.4, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (!reduce) {
        if (!shooting && now > nextShoot) {
          const fromLeft = Math.random() > 0.5
          shooting = {
            x: Math.random() * w * 0.7 + (fromLeft ? 0 : w * 0.3),
            y: Math.random() * h * 0.4,
            vx: (fromLeft ? 1 : -1) * (7 + Math.random() * 4),
            vy: 2.8 + Math.random() * 2.2,
            life: 1,
          }
          nextShoot = now + 7000 + Math.random() * 9000
        }
        if (shooting) {
          const [r, g, b] = palette[0]
          const tailX = shooting.x - shooting.vx * 9
          const tailY = shooting.y - shooting.vy * 9
          const grad = ctx.createLinearGradient(shooting.x, shooting.y, tailX, tailY)
          grad.addColorStop(0, `rgba(${r},${g},${b},${0.9 * shooting.life})`)
          grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.6
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(shooting.x, shooting.y)
          ctx.lineTo(tailX, tailY)
          ctx.stroke()
          shooting.x += shooting.vx
          shooting.y += shooting.vy
          shooting.life -= 0.012
          if (shooting.life <= 0 || shooting.x < -80 || shooting.x > w + 80 || shooting.y > h + 80) shooting = null
        }
      }
    }

    const loop = (t: number) => {
      draw(t)
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (reduce || running) return
      running = true
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const onMove = (e: PointerEvent) => {
      pointer.tx = e.clientX / w - 0.5
      pointer.ty = e.clientY / h - 0.5
    }
    const onScroll = () => {
      scrollY = window.scrollY
      if (reduce) draw(performance.now())
    }
    const onVis = () => (document.hidden ? stop() : start())

    resize()
    start()
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', onVis)
    const offWarp = onWarp((ms) => {
      warpTarget = 1
      clearTimeout(warpTimer)
      warpTimer = setTimeout(() => (warpTarget = 0), ms)
      if (reduce) return
      start()
    })

    return () => {
      stop()
      clearTimeout(warpTimer)
      offWarp()
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [reduce])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10" />
}

/** ערפיליות רכות מאחורי הכול: שכבת CSS בלבד */
export function Nebula() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-background">
      <div
        className="absolute -top-1/4 start-[-10%] h-[80vmax] w-[80vmax] rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, var(--color-primary-soft), transparent)' }}
      />
      <div
        className="absolute -bottom-1/3 end-[-15%] h-[90vmax] w-[90vmax] rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, var(--color-accent-soft), transparent)' }}
      />
      <div
        className="absolute top-1/3 start-1/3 h-[50vmax] w-[50vmax] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, var(--color-gold-soft), transparent)' }}
      />
    </div>
  )
}
