'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, EASE, useGSAP } from '@/lib/gsap'
import { useSite } from '@/lib/store'
import { scrollToHash } from '@/lib/scroll'
import { RollText } from '@/components/ui/RollText'
import s from './Nav.module.css'

const LINKS = [
  { label: 'Gardens', href: '#featured' },
  { label: 'Services', href: '#services' },
  { label: 'Process', href: '#process' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
]

export default function Nav() {
  const root = useRef<HTMLElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const menuBtn = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const openRef = useRef(false)

  // Hide on the way down, return on the way up; go solid once past the hero.
  useGSAP(
    () => {
      const shell = root.current!.querySelector<HTMLElement>('[data-nav-shell]')!
      const bg = root.current!.querySelector<HTMLElement>('[data-nav-bg]')!
      let hidden = false
      const setHidden = (h: boolean) => {
        if (h === hidden) return
        hidden = h
        gsap.to(shell, { yPercent: h ? -110 : 0, duration: 0.5, ease: EASE.inOut, overwrite: 'auto' })
      }
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          if (openRef.current) return
          const y = self.scroll()
          if (y < 140) setHidden(false)
          else if (self.direction === 1 && Math.abs(self.getVelocity()) > 20) setHidden(true)
          else if (self.direction === -1) setHidden(false)
        },
      })
      const hero = document.getElementById('top')
      ScrollTrigger.create({
        trigger: hero,
        start: 'bottom 90px',
        end: 'max',
        onToggle: (self) =>
          gsap.to(bg, { opacity: self.isActive ? 1 : 0, duration: 0.6, ease: EASE.soft, overwrite: 'auto' }),
      })
      // Keyboard users tabbing into a hidden nav get it back
      const onFocus = () => setHidden(false)
      root.current!.addEventListener('focusin', onFocus)
      return () => root.current?.removeEventListener('focusin', onFocus)
    },
    { scope: root },
  )

  // Menu sheet (tablet and mobile)
  const { contextSafe } = useGSAP({ scope: root })
  const toggle = contextSafe((next: boolean) => {
    const el = sheet.current
    if (!el) return
    openRef.current = next
    setOpen(next)
    const lenis = useSite.getState().lenis
    const links = el.querySelectorAll('[data-sheet-link]')
    const foot = el.querySelector('[data-sheet-foot]')
    if (next) {
      lenis?.stop()
      gsap
        .timeline()
        .to(el, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: EASE.inOut })
        .fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.06, ease: EASE.out }, '-=0.35')
        .fromTo(foot, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.6')
        .call(() => (links[0] as HTMLElement | undefined)?.querySelector('a')?.focus())
    } else {
      lenis?.start()
      gsap
        .timeline()
        .to(links, { yPercent: -110, duration: 0.45, stagger: 0.03, ease: EASE.inOut })
        .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: EASE.inOut }, '-=0.25')
    }
  })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggle(false)
        menuBtn.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, toggle])

  const go = (e: React.MouseEvent, href: string) => {
    if (openRef.current) {
      e.preventDefault()
      toggle(false)
      setTimeout(() => scrollToHash(null, href), 450)
      return
    }
    scrollToHash(e, href)
  }

  return (
    <>
    <a className="skip-link" href="#main">
      Skip to content
    </a>
    <header ref={root} className={`${s.nav} on-dark`} data-site-nav data-intro-hide>
      <div className={s.shell} data-nav-shell>
        <div className={s.bg} data-nav-bg aria-hidden="true" />
        <div className={s.inner}>
          <a href="#top" className={s.logo} onClick={(e) => go(e, '#top')}>
            Hartwell Gardens
          </a>
          <nav aria-label="Main">
            <ul className={s.links}>
              {LINKS.map((l) => (
                <li key={l.href}>
                  <RollText href={l.href} onClick={(e) => go(e, l.href)}>
                    {l.label}
                  </RollText>
                </li>
              ))}
            </ul>
          </nav>
          <div className={s.right}>
            <a href="tel:01483210448" className={s.phone}>
              <RollText>01483 210 448</RollText>
            </a>
            <a href="#enquiry" className={s.cta} onClick={(e) => go(e, '#enquiry')}>
              <span className={s.ctaFill} aria-hidden="true" />
              Book a garden visit
            </a>
            <button
              ref={menuBtn}
              type="button"
              className={s.menuBtn}
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => toggle(!openRef.current)}
            >
              <span className={s.burger} aria-hidden="true" />
              {open ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>
      </div>
    </header>

      {/* Outside the header: the header is transformed, which would trap a fixed child */}
      <div ref={sheet} id="site-menu" className={`${s.sheet} on-dark`} aria-hidden={!open} inert={!open}>
        <ul className={s.sheetLinks}>
          {[...LINKS, { label: 'Start your garden', href: '#enquiry' }].map((l) => (
            <li key={l.href + l.label} className={s.sheetLink} data-sheet-link>
              <a href={l.href} onClick={(e) => go(e, l.href)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className={s.sheetFoot} data-sheet-foot>
          <a href="tel:01483210448">01483 210 448</a>
          <a href="mailto:hello@hartwellgardens.co.uk">hello@hartwellgardens.co.uk</a>
        </div>
      </div>
    </>
  )
}
