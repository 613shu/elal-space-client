import { useEffect, useRef, useState } from 'react'
import { motion, useMotionTemplate, useMotionValue, animate } from 'motion/react'
import { Logo } from '~/components/brand/Logo'

const WORDS = ['בְּרֵאשִׁית', 'בָּרָא', 'אֱלֹהִים', 'אֵת', 'הַשָּׁמַיִם', 'וְאֵת', 'הָאָרֶץ']
const SEEN_KEY = 'elal.intro.v1'

/** חוסם הבהוב: רץ בראש המסמך לפני הציור הראשון ומסמן אם הפתיחה צריכה להידלג */
export const introSkipScript = `try{if(sessionStorage.getItem('${SEEN_KEY}')||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('intro-skip')}catch(e){}`

/**
 * פתיחה קולנועית, פעם אחת בכל ביקור: נקודת אור, פסוק הפתיחה, והאור נפרש ומגלה את האתר.
 * דילוג: לחיצה, Enter או Esc. לא מופיעה בהפחתת תנועה.
 */
export function IntroOverlay() {
  const [alive, setAlive] = useState(true)
  const [phase, setPhase] = useState<'dot' | 'verse' | 'burst'>('dot')
  const r = useMotionValue(0)
  const mask = useMotionTemplate`radial-gradient(circle at 50% 50%, transparent ${r}%, #000 calc(${r}% + 7%))`
  const skipRef = useRef<HTMLButtonElement>(null)
  const done = useRef(false)

  const finish = () => {
    if (done.current) return
    done.current = true
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* ignore */
    }
    document.body.style.overflow = ''
    animate(r, 170, { duration: 0.01 })
    setAlive(false)
  }

  useEffect(() => {
    if (document.documentElement.classList.contains('intro-skip')) {
      setAlive(false)
      return
    }
    document.body.style.overflow = 'hidden'
    skipRef.current?.focus({ preventScroll: true })
    const t1 = setTimeout(() => setPhase('verse'), 900)
    const t2 = setTimeout(() => {
      setPhase('burst')
      animate(r, 170, { duration: 1.5, ease: [0.65, 0, 0.35, 1], onComplete: finish })
    }, 900 + WORDS.length * 260 + 1500)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!alive) return null

  return (
    <motion.div
      className="intro-overlay fixed inset-0 z-[100] grid place-items-center bg-background-deep"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      onClick={finish}
      role="presentation"
    >
      <span className="sr-only">פתיחה: בראשית ברא אלהים את השמים ואת הארץ</span>

      <motion.div
        aria-hidden="true"
        className="absolute size-3 rounded-full bg-foreground"
        initial={{ opacity: 0, scale: 0 }}
        animate={
          phase === 'burst'
            ? { opacity: 0, scale: 40 }
            : { opacity: 1, scale: phase === 'dot' ? [0, 1.6, 1] : 1 }
        }
        transition={{ duration: phase === 'burst' ? 1.2 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ boxShadow: '0 0 60px 20px var(--color-primary-soft), 0 0 140px 50px var(--color-accent-soft)' }}
      />

      {phase !== 'dot' && (
        <div aria-hidden="true" className="relative flex max-w-[90vw] flex-col items-center gap-8 px-6 text-center">
          <p className="flex flex-wrap items-center justify-center gap-x-[0.45em] font-display text-[clamp(1.9rem,1rem+4.4vw,4rem)] leading-[1.35] text-foreground">
            {WORDS.map((w, i) => (
              <motion.span
                key={w + i}
                initial={{ opacity: 0, y: 14, filter: 'blur(10px)' }}
                animate={phase === 'burst' ? { opacity: 0, filter: 'blur(14px)' } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: phase === 'burst' ? 0 : i * 0.26, duration: phase === 'burst' ? 0.5 : 0.9 }}
              >
                {w}
              </motion.span>
            ))}
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'burst' ? 0 : 0.7 }}
            transition={{ delay: phase === 'burst' ? 0 : WORDS.length * 0.26 + 0.2, duration: 0.8 }}
            className="text-caption text-foreground-muted"
          >
            בראשית א׳, א׳
          </motion.p>
        </div>
      )}

      <div className="absolute bottom-8 flex items-center gap-4">
        <Logo size={30} decorative />
        <button
          ref={skipRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            finish()
          }}
          className="rounded-full border border-border-strong px-5 py-2 text-caption text-foreground-muted transition hover:border-primary hover:text-foreground focus-visible:shadow-focus"
        >
          דילוג על הפתיחה
        </button>
      </div>
    </motion.div>
  )
}
