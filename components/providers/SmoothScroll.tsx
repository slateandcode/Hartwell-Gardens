'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { fontsReady } from '@/lib/ready'
import { prefersReducedMotion } from '@/lib/useReducedMotion'
import { useSite } from '@/lib/store'

/**
 * Lenis drives the document scroll and is stepped by GSAP's ticker, so
 * ScrollTrigger and every tween share one clock.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    const setVw = () => root.style.setProperty('--vw', `${root.clientWidth}px`)
    setVw()

    const lenis = new Lenis({
      lerp: prefersReducedMotion() ? 1 : 0.1,
      smoothWheel: !prefersReducedMotion(),
      wheelMultiplier: 1,
      autoRaf: false,
    })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    useSite.getState().setLenis(lenis)

    if (root.classList.contains('intro-pending')) {
      window.scrollTo(0, 0)
      lenis.scrollTo(0, { immediate: true, force: true })
      lenis.stop()
    }

    // Sections build their ScrollTriggers once fonts are in. Child effects run
    // first, so this refresh lands after all of them.
    let cancelled = false
    fontsReady().then(() => {
      requestAnimationFrame(() => {
        if (cancelled) return
        ScrollTrigger.sort()
        ScrollTrigger.refresh()
      })
    })

    let resizeRaf = 0
    const onResize = () => {
      cancelAnimationFrame(resizeRaf)
      resizeRaf = requestAnimationFrame(setVw)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelled = true
      window.removeEventListener('resize', onResize)
      gsap.ticker.remove(tick)
      lenis.destroy()
      useSite.getState().setLenis(null)
    }
  }, [])

  return <>{children}</>
}
