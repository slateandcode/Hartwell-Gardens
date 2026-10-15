'use client'

import { useRef } from 'react'
import { gsap, SplitText, EASE, useGSAP } from '@/lib/gsap'
import { BREAKPOINTS, fontsReady } from '@/lib/ready'
import { preserveKerning, reduceReveal } from '@/lib/motion'
import { scrollToHash } from '@/lib/scroll'
import s from './Footer.module.css'

const EXPLORE = [
  { label: 'Gardens', href: '#featured' },
  { label: 'Services', href: '#services' },
  { label: 'How it works', href: '#process' },
  { label: 'Prices', href: '#pricing' },
  { label: 'About', href: '#about' },
]

const TOWNS = [
  ['Guildford', 'Godalming', 'Farnham', 'Haslemere', 'Cobham'],
  ['Esher', 'Weybridge', 'Petersfield', 'Alresford', 'Winchester'],
]

export default function Footer() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    (context) => {
      const el = root.current!
      let mm: gsap.MatchMedia | undefined
      let cancelled = false
      fontsReady().then(() => {
        if (cancelled) return
        context.add(() => {
          const cols = el.querySelectorAll('[data-col]')
          const mark = el.querySelector<HTMLElement>('[data-mark]')!
          mm = gsap.matchMedia()
          mm.add({ motion: BREAKPOINTS.motion, reduce: BREAKPOINTS.reduce }, (ctx) => {
            if ((ctx.conditions as Record<string, boolean>).reduce) {
              reduceReveal(el)
              return
            }
            gsap.fromTo(
              cols,
              { y: 50, autoAlpha: 0 },
              {
                y: 0,
                autoAlpha: 1,
                duration: 1.1,
                stagger: 0.1,
                ease: EASE.out,
                scrollTrigger: { trigger: el, start: 'top 85%', once: true },
              },
            )
            // The giant wordmark rises out of the page edge, letter by letter.
            const split = SplitText.create(mark, { type: 'chars', charsClass: 'hw-char', aria: 'none' })
            preserveKerning(split.chars as HTMLElement[])
            gsap.set(mark, { visibility: 'visible' })
            gsap.fromTo(
              split.chars,
              { yPercent: 100 },
              {
                yPercent: 0,
                duration: 1.2,
                stagger: 0.03,
                ease: EASE.out,
                scrollTrigger: { trigger: mark.parentElement, start: 'top bottom-=40', once: true },
              },
            )
          })
        })
      })
      return () => {
        cancelled = true
        mm?.revert()
      }
    },
    { scope: root },
  )

  return (
    <footer ref={root} className={`${s.footer} on-dark`}>
      <div className={s.rule} aria-hidden="true" />
      <div className={s.cols}>
        <div className={`${s.col} ${s.brand}`} data-col data-reveal>
          <p className={s.brandName}>Hartwell Gardens</p>
          <p className={s.brandLine}>Garden design and build across Surrey and Hampshire since 2009.</p>
          <div className={s.badges}>
            <span className={s.badge}>APL member</span>
            <span className={s.badge}>10-year guarantee</span>
          </div>
        </div>
        <nav className={s.col} data-col data-reveal aria-label="Footer">
          <p className={s.label}>EXPLORE</p>
          <ul className={s.col}>
            {EXPLORE.map((l) => (
              <li key={l.href} className={s.item}>
                <a className={s.link} href={l.href} onClick={(e) => scrollToHash(e, l.href)}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className={s.col} data-col data-reveal>
          <p className={s.label}>AREAS WE COVER</p>
          <div className={s.towns}>
            {TOWNS.map((col, i) => (
              <ul key={i}>
                {col.map((t) => (
                  <li key={t} className={s.item}>
                    {t}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
        <div className={s.col} data-col data-reveal>
          <p className={s.label}>GET IN TOUCH</p>
          <a className={`${s.item} ${s.link}`} href="tel:01483210448">
            01483 210 448
          </a>
          <a className={`${s.item} ${s.link}`} href="mailto:hello@hartwellgardens.co.uk">
            hello@hartwellgardens.co.uk
          </a>
          <p className={s.item}>Mon to Fri, 8am to 6pm</p>
          <p className={s.item}>Godalming, Surrey</p>
        </div>
      </div>
      <div className={s.rule} aria-hidden="true" />
      <div className={s.bottom}>
        <p>© 2026 Hartwell Gardens Ltd</p>
        <p style={{ whiteSpace: 'pre' }}>{'Privacy  ·  Terms'}</p>
        <a className={s.link} href="https://slateandcode.studio" target="_blank" rel="noopener">
          Website by Slate &amp; Code
        </a>
      </div>
      <div className={s.mark} aria-hidden="true">
        <p className={s.markText} data-mark data-reveal>
          HARTWELL GARDENS
        </p>
      </div>
    </footer>
  )
}
