'use client'
import { useEffect, useRef, useState } from 'react'

// Affiche un nombre qui monte de 0 à `valeur` quand il apparaît à l'écran.
// Sans animation (ou si l'utilisateur réduit les animations), la valeur finale est affichée tout de suite.
export default function CompteurAnime({ valeur }: { valeur: number }) {
  const [n, setN] = useState(valeur)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    let raf = 0
    let demarre = false
    setN(0)
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || demarre) return
        demarre = true
        const t0 = performance.now()
        const duree = 1100
        const pas = (t: number) => {
          const k = Math.min(1, (t - t0) / duree)
          setN(Math.round(valeur * (1 - Math.pow(1 - k, 3))))
          if (k < 1) raf = requestAnimationFrame(pas)
        }
        raf = requestAnimationFrame(pas)
        obs.disconnect()
      },
      { threshold: 0.6 }
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [valeur])

  return <span ref={ref}>{n}</span>
}
