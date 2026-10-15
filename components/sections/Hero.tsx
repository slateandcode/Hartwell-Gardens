'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { gsap, ScrollTrigger, SplitText, EASE, useGSAP } from '@/lib/gsap'
import { BREAKPOINTS, decodeImages, fontsReady } from '@/lib/ready'
import { charRise, fadeUpLines, preserveKerning, revealLines, riseWords, scriptWrite } from '@/lib/motion'
import { useSite } from '@/lib/store'
import { landscaping } from '@/lib/script-paths'
import { ScriptWord } from '@/components/ui/ScriptWord'
import { scrollToHash } from '@/lib/scroll'
import s from './Hero.module.css'

const INTRO_KEY = 'hw-intro-seen'

/*
  Card geometry from Figma 5:2: centre of each rotated card's bounding box,
  card size, rotation, caption position. Order is left to right along the arc.
*/
const CARDS = [
  { town: 'Cobham', price: '£38k', weeks: '5 weeks', img: '/images/cobham.webp', cx: 66.47, cy: 1060.6, w: 459, h: 276, rot: 8, rotM: -2, capx: 183, capy: 217 },
  { town: 'Farnham', price: '£24k', weeks: '3 weeks', img: '/images/farnham.webp', cx: 545.28, cy: 1171.42, w: 401.558, h: 275.478, rot: 17, rotM: 2, capx: 18, capy: 216.48 },
  { town: 'Alresford', price: '£52k', weeks: '7 weeks', img: '/images/alresford.webp', cx: 1020.99, cy: 1279.34, w: 401.558, h: 275.478, rot: 8, rotM: -1.5, capx: 18, capy: 216.48 },
  { town: 'Haslemere', price: '£44k', weeks: '6 weeks', img: '/images/haslemere.webp', cx: 1510.99, cy: 1305.34, w: 401.558, h: 275.478, rot: -8, rotM: 2, capx: 18, capy: 216.48 },
  { town: 'Godalming', price: '£19k', weeks: '3 weeks', img: '/images/godalming.webp', cx: 1972.16, cy: 1197.22, w: 401.558, h: 275.478, rot: -18, rotM: -2, capx: 18, capy: 216.48 },
  { town: 'Petersfield', price: '£31k', weeks: '4 weeks', img: '/images/petersfield.webp', cx: 2406.52, cy: 1053.04, w: 401.558, h: 275.478, rot: -18, rotM: 1.5, capx: 18, capy: 216.48 },
]

// Slight disorder for the stacked deck before the deal
const DECK_JITTER = [-5, 4, -2, 3, -4, 6]

export default function Hero() {
  const root = useRef<HTMLElement>(null)
  const setIntroDone = useSite((st) => st.setIntroDone)

  useGSAP(
    (context) => {
      const el = root.current
      if (!el) return
      const html = document.documentElement
      const playIntro = html.classList.contains('intro-pending')
      let cancelled = false
      let mm: gsap.MatchMedia | null = null
      const listeners: Array<() => void> = []

      const q = <T extends Element = HTMLElement>(sel: string) => Array.from(el.querySelectorAll(sel)) as T[]

      const start = async () => {
        await fontsReady()
        if (playIntro) await decodeImages(q<HTMLImageElement>('[data-preload] img'))
        if (cancelled) return
        context.add(() => (playIntro ? intro() : entranceOnly()))
      }

      /* ---------- shared pieces ---------- */

      const wordmark = el.querySelector<HTMLElement>('[data-wm-intro]')!
      const markLines = q('[data-mark-line]')
      const script = el.querySelector<SVGSVGElement>('[data-script]')!
      const texture = el.querySelector<HTMLElement>('[data-texture]')!
      const slots = q('[data-slot]')
      const layer = (name: string) => slots.map((slot) => slot.querySelector<HTMLElement>(`[data-l="${name}"]`)!)
      const headline = el.querySelector<HTMLElement>('[data-headline]')!
      const lede = el.querySelector<HTMLElement>('[data-lede]')!
      const cta = el.querySelector<HTMLElement>('[data-cta]')!
      const nav = document.querySelector<HTMLElement>('[data-site-nav]')

      const splitMark = () => {
        const split = SplitText.create(markLines, { type: 'chars', charsClass: 'hw-char', aria: 'none' })
        preserveKerning(split.chars as HTMLElement[])
        return split
      }

      /** Nav, headline, paragraph and CTA. Copy below the fold waits for scroll. */
      const copyEntrance = (tl: gsap.core.Timeline, at: number) => {
        if (nav) {
          tl.fromTo(nav, { yPercent: -100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: EASE.out }, at)
        }
        const fold = window.innerHeight * 0.94
        const visible = (node: HTMLElement) => node.getBoundingClientRect().top < fold
        const parts = [
          {
            node: headline,
            // phones let the headline wrap freely, so words rise instead of fixed lines
            make: () =>
              window.matchMedia(BREAKPOINTS.mobile).matches
                ? riseWords(headline, { stagger: 0.05, duration: 1 })
                : revealLines(headline, { stagger: 0.1, duration: 1.15 }),
          },
          { node: lede, make: () => fadeUpLines(lede, { stagger: 0.08, duration: 1 }) },
          {
            node: cta,
            make: () =>
              gsap.fromTo(
                cta,
                { scale: 0.9, autoAlpha: 0, y: 14 },
                { scale: 1, autoAlpha: 1, y: 0, duration: 0.9, ease: EASE.out },
              ),
          },
        ]
        let offset = at + 0.1
        const deferred: typeof parts = []
        for (const part of parts) {
          if (visible(part.node)) {
            tl.add(part.make(), offset)
            offset += 0.22
          } else {
            deferred.push(part)
          }
        }
        if (deferred.length) {
          gsap.set(deferred.map((p) => p.node), { autoAlpha: 0 })
          ScrollTrigger.create({
            trigger: deferred[0].node,
            start: 'top 88%',
            once: true,
            onEnter: () => {
              const later = gsap.timeline()
              deferred.forEach((p, i) => {
                gsap.set(p.node, { autoAlpha: 1 })
                later.add(p.make(), i * 0.2)
              })
            },
          })
        }
      }

      /* ---------- the intro (first visit only) ---------- */

      const intro = () => {
        const isMobile = window.matchMedia(BREAKPOINTS.mobile).matches
        const overlay = el.querySelector<HTMLElement>('[data-intro]')!
        const frameSvg = overlay.querySelector<SVGSVGElement>('[data-intro-frame]')!
        const rect = frameSvg.querySelector('rect')!
        const sideL = overlay.querySelector<HTMLElement>('[data-intro-left]')!
        const sideR = overlay.querySelector<HTMLElement>('[data-intro-right]')!
        const tagline = overlay.querySelector<HTMLElement>('[data-intro-tagline]')!
        const lenis = useSite.getState().lenis
        const deal = layer('deal')

        window.scrollTo(0, 0)
        lenis?.stop()
        gsap.set(overlay, { display: 'block' })
        document.body.style.touchAction = 'none'

        // The frame: inset from the viewport edge, drawn as one stroke.
        const inset = isMobile ? 16 : 40
        const W = window.innerWidth
        const H = window.innerHeight
        frameSvg.setAttribute('viewBox', `0 0 ${W} ${H}`)
        rect.setAttribute('x', `${inset}`)
        rect.setAttribute('y', `${inset}`)
        rect.setAttribute('width', `${W - inset * 2}`)
        rect.setAttribute('height', `${H - inset * 2}`)

        // Wordmark starts centred in the viewport, then glides home (measured FLIP).
        const split = splitMark()
        const markBox = wordmark.getBoundingClientRect()
        const scriptBox = script.getBoundingClientRect()
        const top = markBox.top
        const bottom = Math.max(markBox.bottom, scriptBox.top + scriptBox.height * 0.72)
        const centreY = (top + bottom) / 2
        const dx = W / 2 - (markBox.left + markBox.width / 2)
        const dy = H / 2 - centreY
        // A touch larger while it holds the stage; smaller on phones so the side words keep their margin.
        const startScale = isMobile ? 0.86 : W < 1280 ? 1.22 : 1.04
        gsap.set(wordmark, { x: dx, y: dy, scale: startScale, transformOrigin: `50% ${centreY - top}px` })
        gsap.set(split.chars, { opacity: 0 })
        gsap.set(texture, { opacity: 0, scale: 1.12 })
        gsap.set(deal, { opacity: 0 })
        if (nav) gsap.set(nav, { yPercent: -100, autoAlpha: 0 })

        // Everything now has an explicit start state; lift the pre-paint mask.
        html.classList.remove('intro-pending')

        const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.out } })

        // 0.00 the frame draws itself
        gsap.set(frameSvg, { visibility: 'visible' })
        tl.fromTo(rect, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.8, ease: EASE.inOut }, 0)

        // 0.20 side words tighten in
        tl.fromTo(
          [sideL, sideR],
          { letterSpacing: '1.2em', opacity: 0 },
          { letterSpacing: '0.45em', opacity: 0.85, duration: 1, ease: EASE.out },
          0.2,
        )

        // 0.30 / 0.55 the letters arrive tall, blurred and translucent, and settle
        const lineChars = markLines.map((line) => Array.from(line.querySelectorAll('.hw-char')))
        tl.add(charRise(lineChars[0]), 0.3)
        tl.add(charRise(lineChars[1]), 0.55)

        // 1.10 "Landscaping" writes itself
        tl.add(scriptWrite(script, 'script-writing'), 1.1)

        // 1.30 tagline rises
        tl.fromTo(tagline, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8 }, 1.3)

        // 2.00 the reveal
        tl.to(frameSvg, { scale: 1.14, opacity: 0, duration: 1, ease: EASE.inOut }, 2)
        tl.to(sideL, { x: -120, opacity: 0, duration: 1, ease: EASE.inOut }, 2)
        tl.to(sideR, { x: 120, opacity: 0, duration: 1, ease: EASE.inOut }, 2)
        tl.to(tagline, { yPercent: 60, opacity: 0, duration: 0.7, ease: EASE.inOut }, 2)
        tl.to(texture, { opacity: 1, scale: 1, duration: 1.4, ease: EASE.inOut }, 2)
        tl.to(wordmark, { x: 0, y: 0, scale: 1, duration: 1.2, ease: EASE.inOut }, 2)

        // 2.45 the cards deal out of a stack, centre first
        const deckX = W / 2
        const deckY = isMobile ? H * 0.62 : H * 0.6
        const n = slots.length
        slots.forEach((slot, i) => {
          const r = slot.getBoundingClientRect()
          const card = CARDS[i]
          const rest = isMobile ? card.rotM : card.rot
          const over = rest + (rest >= 0 ? 3.2 : -3.2)
          const order = Math.abs(i - (n - 1) / 2) - 0.5
          const t = 2.45 + order * 0.08
          const d = deal[i]
          gsap.set(d, {
            x: deckX - (r.left + r.width / 2) + (i - 2.5) * 6,
            y: deckY - (r.top + r.height / 2) + Math.abs(i - 2.5) * 4,
            scale: 0.55,
            rotation: DECK_JITTER[i],
            zIndex: 10 - Math.round(order * 2),
          })
          tl.to(d, { opacity: 1, duration: 0.28, ease: 'power1.out' }, t)
          tl.to(d, { x: 0, duration: 1.05, ease: EASE.out }, t)
          tl.to(d, { y: 0, duration: 1.05, ease: 'power2.out' }, t)
          tl.to(d, { scale: 1, duration: 1.0, ease: EASE.out }, t)
          tl.to(d, { rotation: over, duration: 0.72, ease: 'power2.out' }, t)
          tl.to(d, { rotation: rest, duration: 0.55, ease: EASE.soft }, t + 0.66)
        })

        // 2.90 nav, headline, paragraph, CTA
        copyEntrance(tl, 2.9)

        // Let people scroll while the last cards settle.
        tl.call(() => unlock(), [], 3.35)

        let unlocked = false
        const unlock = () => {
          if (unlocked) return
          unlocked = true
          document.body.style.touchAction = ''
          lenis?.start()
          window.removeEventListener('keydown', onKey, true)
        }

        const finish = () => {
          unlock()
          try {
            sessionStorage.setItem(INTRO_KEY, '1')
          } catch {}
          if ('scrollRestoration' in history) history.scrollRestoration = 'auto'
          gsap.set(overlay, { display: 'none' })
          gsap.set(deal, { clearProps: 'transform,zIndex' })
          gsap.set(wordmark, { clearProps: 'transform' })
          setIntroDone()
          idle()
        }
        tl.eventCallback('onComplete', finish)

        // Any click, wheel, touch or key fast-forwards. Never trap anyone.
        let skipping = false
        const skip = () => {
          if (skipping || !tl.isActive()) return
          skipping = true
          tl.timeScale(4)
        }
        const scrollKeys = new Set([' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'])
        const onKey = (e: KeyboardEvent) => {
          if (scrollKeys.has(e.key) && !unlocked) e.preventDefault()
          skip()
        }
        overlay.addEventListener('pointerdown', skip)
        window.addEventListener('wheel', skip, { passive: true })
        window.addEventListener('touchstart', skip, { passive: true })
        window.addEventListener('keydown', onKey, true)
        listeners.push(() => {
          overlay.removeEventListener('pointerdown', skip)
          window.removeEventListener('wheel', skip)
          window.removeEventListener('touchstart', skip)
          window.removeEventListener('keydown', onKey, true)
          document.body.style.touchAction = ''
        })

        // Mobile runs the same choreography, compressed to ~2.8s.
        tl.timeScale(isMobile ? 1.25 : 1)
        // Dev hook for frame-by-frame checks: /?introPause holds the intro at 0.
        if (process.env.NODE_ENV !== 'production') {
          ;(window as unknown as { __hwIntro: gsap.core.Timeline }).__hwIntro = tl
          if (location.search.includes('introPause')) return
        }
        tl.play(0)
      }

      /* ---------- repeat visits: straight to the hero, only the 2.90 entrance ---------- */

      const entranceOnly = () => {
        const reduce = window.matchMedia(BREAKPOINTS.reduce).matches
        splitMark()
        if (reduce) {
          gsap.fromTo([headline, lede, cta, nav].filter(Boolean), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'none' })
          setIntroDone()
          idle()
          return
        }
        const tl = gsap.timeline({ onComplete: () => void 0 })
        copyEntrance(tl, 0.15)
        setIntroDone()
        idle()
      }

      /* ---------- after the intro: breathing, parallax, scroll-out ---------- */

      const idle = () => {
        mm = gsap.matchMedia()
        mm.add(
          {
            desktop: BREAKPOINTS.desktop,
            tablet: BREAKPOINTS.tablet,
            mobile: BREAKPOINTS.mobile,
            motion: BREAKPOINTS.motion,
            fine: '(hover: hover) and (pointer: fine)',
          },
          (ctx) => {
            const { mobile, motion, fine } = ctx.conditions as Record<string, boolean>
            if (!motion) return

            // Each card breathes on its own sine, so the arc never moves in step.
            layer('float').forEach((f, i) => {
              const dur = 3 + ((i * 7) % 6) * 0.3
              const amp = mobile ? 4 : 6
              const tw = gsap.fromTo(f, { y: -amp }, { y: amp, duration: dur, ease: 'sine.inOut', repeat: -1, yoyo: true })
              tw.totalTime(dur * (i % 2 ? 1.5 : 0.5)) // start at y=0, half going up, half going down
            })

            if (fine && !mobile) {
              const depth = [0.7, 1, 0.85, 0.9, 1, 0.75]
              const movers = layer('mouse').map((m, i) => ({
                x: gsap.quickTo(m, 'x', { duration: 1.1, ease: 'power3.out' }),
                y: gsap.quickTo(m, 'y', { duration: 1.1, ease: 'power3.out' }),
                k: depth[i] ?? 1,
              }))
              const wmMouse = el.querySelector<HTMLElement>('[data-wm-mouse]')!
              const wx = gsap.quickTo(wmMouse, 'x', { duration: 1.4, ease: 'power3.out' })
              const wy = gsap.quickTo(wmMouse, 'y', { duration: 1.4, ease: 'power3.out' })
              const onMove = (e: PointerEvent) => {
                const nx = e.clientX / window.innerWidth - 0.5
                const ny = e.clientY / window.innerHeight - 0.5
                movers.forEach((m) => {
                  m.x(-nx * 24 * m.k)
                  m.y(-ny * 24 * m.k)
                })
                wx(-nx * 8)
                wy(-ny * 8)
              }
              window.addEventListener('pointermove', onMove, { passive: true })
              ctx.add(() => () => window.removeEventListener('pointermove', onMove))
            }

            if (!mobile) {
              // Scroll out: the arc lifts faster than the copy and fans a little wider.
              const out = gsap.timeline({
                scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 1, invalidateOnRefresh: true },
              })
              const unit = () => el.offsetWidth / 2562
              layer('scroll').forEach((sl, i) => {
                const c = CARDS[i]
                out.to(
                  sl,
                  {
                    y: () => -(380 + Math.abs(i - 2.5) * 50) * unit(),
                    x: () => (c.cx - 1281) * 0.1 * unit(),
                    rotation: c.rot * 0.2,
                    ease: 'none',
                  },
                  0,
                )
              })
              const wmScroll = el.querySelector<HTMLElement>('[data-wm-scroll]')!
              out.to(wmScroll, { y: () => 260 * unit(), scale: 0.92, ease: 'none' }, 0)
              out.to(wmScroll, { opacity: 0, ease: 'power1.in', duration: 0.45 }, 0.12)
            }
          },
        )
      }

      start()

      return () => {
        cancelled = true
        listeners.forEach((off) => off())
        mm?.revert()
      }
    },
    { scope: root },
  )

  return (
    <section id="top" ref={root} className={`${s.hero} on-dark`} aria-labelledby="hero-title">
      <div className={s.texture} data-texture data-intro-hide data-preload>
        <Image src="/images/hedge-texture.webp" alt="" fill sizes="(max-width: 767px) 150vh, 100vw" preload />
      </div>

      <div className={s.wordmark}>
        <div className={s.wmScroll} data-wm-scroll>
          <div className={s.wmMouse} data-wm-mouse>
            <div className={s.wmIntro} data-wm-intro data-intro-hide>
              <p className={s.mark} aria-hidden="true">
                <span className={s.markLine} data-mark-line>
                  HARTWELL
                </span>
                <span className={s.markLine} data-mark-line>
                  GARDENS
                </span>
              </p>
              <ScriptWord word={landscaping} className={s.script} />
            </div>
          </div>
        </div>
      </div>

      <ul className={s.cards} aria-label="Recent gardens">
        {CARDS.map((c) => (
          <li
            key={c.town}
            className={s.slot}
            data-slot
            style={
              {
                '--cx': c.cx,
                '--cy': c.cy,
                '--w': c.w,
                '--h': c.h,
                '--rot': `${c.rot}deg`,
                '--rot-m': `${c.rotM}deg`,
              } as React.CSSProperties
            }
          >
            <div className={s.layer} data-l="scroll">
              <div className={s.layer} data-l="mouse">
                <div className={`${s.layer} ${s.lift}`}>
                  <div className={s.layer} data-l="float">
                    <div className={`${s.layer} ${s.deal}`} data-l="deal" data-intro-hide>
                      <div className={`${s.layer} ${s.tilt}`}>
                        <a
                          href="#featured"
                          className={s.card}
                          data-preload
                          onClick={(e) => scrollToHash(e, '#featured')}
                        >
                          <Image src={c.img} alt="" fill sizes="(max-width: 767px) 72vw, 22vw" loading="eager" />
                          <span
                            className={s.caption}
                            style={{ '--capx': c.capx, '--capy': c.capy } as React.CSSProperties}
                          >
                            {`${c.town}  ·  ${c.price}  ·  ${c.weeks}`}
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <h1 id="hero-title" className={s.headline} data-headline data-reveal>
        We build gardens that{' '}
        <br />
        get better with age.
      </h1>
      <p className={s.lede} data-lede data-reveal>
        Garden design and build across Surrey and Hampshire. From the first sketch to the last plant in the ground.
      </p>
      <div className={s.ctaWrap}>
        <a href="#enquiry" className={s.cta} data-cta data-reveal onClick={(e) => scrollToHash(e, '#enquiry')}>
          <span className={s.ctaFill} aria-hidden="true" />
          Start your garden
          <span className={s.ctaArrow} aria-hidden="true">
            →
          </span>
        </a>
      </div>

      <div className={s.intro} data-intro aria-hidden="true">
        <svg className={s.frame} data-intro-frame preserveAspectRatio="none">
          <rect x="40" y="40" width="0" height="0" />
        </svg>
        <span className={`${s.side} ${s.sideLeft}`} data-intro-left>
          Surrey
        </span>
        <span className={`${s.side} ${s.sideRight}`} data-intro-right>
          Hampshire
        </span>
        <span className={s.taglineMask}>
          <span className={s.tagline} data-intro-tagline>
            Garden design and build · Est. 2009
          </span>
        </span>
      </div>
    </section>
  )
}
