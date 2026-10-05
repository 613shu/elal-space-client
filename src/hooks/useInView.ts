import { useEffect, useRef, useState } from 'react'

/** האם האלמנט נראה כעת במסך. משמש להשהיית אנימציות כבדות כשאינן נראות. */
export function useInView<T extends Element>(rootMargin = '120px') {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])
  return [ref, inView] as const
}
