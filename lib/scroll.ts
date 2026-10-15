'use client'

import { gsap } from './gsap'
import { useSite } from './store'

/** Smooth-scroll to an in-page anchor through Lenis (falls back to native). */
export function scrollToHash(e: React.MouseEvent | null, hash: string, offset = 0) {
  const target = document.querySelector<HTMLElement>(hash)
  if (!target) return
  e?.preventDefault()
  const lenis = useSite.getState().lenis
  const ease = gsap.parseEase('hw.inOut')
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.6, easing: (t: number) => ease(t) })
  } else {
    target.scrollIntoView({ behavior: 'smooth' })
  }
  // Move focus for keyboard and screen reader users without jumping the page
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
  history.replaceState(null, '', hash)
}
