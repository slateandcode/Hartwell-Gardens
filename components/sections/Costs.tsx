'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { gsap, EASE, useGSAP } from '@/lib/gsap'
import { BREAKPOINTS, fontsReady } from '@/lib/ready'
import { fadeUpLines, reduceReveal, revealLines, tagIn } from '@/lib/motion'
import { bandFor, BUDGET_MAX, BUDGET_MIN, useSite, type Band } from '@/lib/store'
import { scrollToHash } from '@/lib/scroll'
import { SectionTag } from '@/components/ui/SectionTag'
import { PillCta } from '@/components/ui/PillCta'
import s from './Costs.module.css'

// Tape scale from Figma: £0 sits at x=91 and every £1k is 39.667px.
const PER_K = 39.667
const ORIGIN = 91
const xOf = (k: number) => ORIGIN + k * PER_K
const TICKS = Array.from({ length: 63 }, (_, k) => k)

type BandId = Exclude<Band, null>

const BANDS: { id: BandId; name: string; lo: number; hi: number; x0: number; x1: number; mid: number }[] = [
  { id: 'refresh', name: 'The refresh', lo: 10, hi: 20, x0: 495.67, x1: 876.33, mid: 15 },
  { id: 'redesign', name: 'The redesign', lo: 20, hi: 40, x0: 892.33, x1: 1669.67, mid: 30 },
  { id: 'build', name: 'Design and build', lo: 40, hi: 60, x0: 1685.67, x1: 2463, mid: 50 },
]

const CARDS: {
  id: BandId
  weeks: string
  name: string
  price: string
  items: string[]
  example: { name: string; meta: string; img: string }
  booked?: boolean
}[] = [
  {
    id: 'refresh',
    weeks: '1 to 3 weeks',
    name: 'The refresh',
    price: '£10–20k',
    items: ['New patio or terrace', 'Fresh turf and clean edging', 'Replanted borders', 'Light layout changes'],
    example: { name: 'Like our Godalming garden', meta: '£19k · 3 weeks', img: '/images/godalming.webp' },
  },
  {
    id: 'redesign',
    weeks: '3 to 5 weeks',
    name: 'The redesign',
    price: '£20–40k',
    items: ['A new layout and levels', 'Paving, paths and steps', 'A full planting scheme', 'Garden lighting'],
    example: { name: 'Like our Cobham garden', meta: '£38k · 5 weeks', img: '/images/cobham.webp' },
    booked: true,
  },
  {
    id: 'build',
    weeks: '5 to 8 weeks',
    name: 'Design and build',
    price: '£40k+',
    items: ['Terracing and retaining walls', 'Drainage and groundworks', 'Pergolas, rills and structures', 'Design, build and aftercare'],
    example: { name: 'Like our Alresford garden', meta: '£52k · 7 weeks', img: '/images/alresford.webp' },
  },
]

const money = (k: number) => `£${(k * 1000).toLocaleString('en-GB')}`

export default function Costs() {
  const root = useRef<HTMLElement>(null)
  const budget = useSite((st) => st.budget)
  const [band, setBand] = useState<Band>(bandFor(budget))
  const setValueRef = useRef<(k: number, animate?: boolean) => void>(() => undefined)

  useGSAP(
    (context) => {
      const el = root.current!
      let mm: gsap.MatchMedia | undefined
      let cancelled = false

      /* ---------- the budget pin (always interactive, independent of entrance motion) ---------- */
      const wrap = el.querySelector<HTMLElement>('[data-tape]')!
      const bandEl = el.querySelector<HTMLElement>('[data-band]')!
      const pin = el.querySelector<HTMLElement>('[data-pin]')!
      const knob = el.querySelector<HTMLElement>('[data-knob]')!
      const num = el.querySelector<HTMLElement>('[data-bubble-value]')!
      const tint = el.querySelector<HTMLElement>('[data-tint]')!
      const reduce = window.matchMedia(BREAKPOINTS.reduce).matches

      const pos = { v: useSite.getState().budget }
      const shown = { n: pos.v }
      const bubble = el.querySelector<HTMLElement>('[data-bubble]')!
      // Keep the bubble on screen at the ends of the tape (it sits centred under the pin otherwise).
      const paint = () => {
        pin.style.setProperty('--pv', `${pos.v}`)
        // measured from the pin's own track, which (unlike the tape) never slides
        const origin = pin.parentElement!.getBoundingClientRect().left
        const view = document.documentElement.clientWidth
        const edge = Math.min(24, view * 0.04)
        const w = bubble.offsetWidth
        const pinX = origin + (pos.v * PER_K * bandEl.offsetWidth) / 2560
        const left = gsap.utils.clamp(edge, view - edge - w, pinX - w / 2)
        bubble.style.setProperty('--nudge', `${(left - (pinX - w / 2)).toFixed(1)}px`)
      }
      const follow = gsap.quickTo(pos, 'v', { duration: reduce ? 0 : 0.4, ease: 'power3.out', onUpdate: paint })
      let current = pos.v

      const tintFor = (k: number) => {
        const b = BANDS.find((x) => x.id === bandFor(k))
        if (!b) return { xPercent: ((xOf(10) - ORIGIN) / 2380) * 100, scaleX: 0, autoAlpha: 0 }
        return {
          xPercent: ((xOf(b.lo) - ORIGIN) / 2380) * 100,
          scaleX: (xOf(b.hi) - xOf(b.lo)) / 2380,
          autoAlpha: 1,
        }
      }

      const setValue = (raw: number, animate = true) => {
        const k = gsap.utils.clamp(BUDGET_MIN, BUDGET_MAX, Math.round(raw))
        if (k === current && animate) return
        current = k
        useSite.getState().setBudget(k)
        knob.setAttribute('aria-valuenow', `${k}`)
        knob.setAttribute('aria-valuetext', money(k))
        wrap.classList.toggle(s.low, k < 10)
        setBand(bandFor(k))
        if (animate) {
          follow(k)
          gsap.to(shown, {
            n: k,
            duration: reduce ? 0 : 0.4,
            ease: EASE.soft,
            overwrite: true,
            onUpdate: () => (num.textContent = `£${Math.round(shown.n)}k`),
          })
          gsap.to(tint, { ...tintFor(k), duration: reduce ? 0 : 0.5, ease: EASE.soft, overwrite: true })
        } else {
          pos.v = k
          paint()
          num.textContent = `£${k}k`
          gsap.set(tint, tintFor(k))
        }
      }
      setValueRef.current = setValue
      setValue(pos.v, false)

      let dragging = false
      const fromPointer = (e: PointerEvent) => {
        const r = bandEl.getBoundingClientRect()
        const unit = r.width / 2560
        return (e.clientX - r.left) / unit / PER_K
      }
      const onDown = (e: PointerEvent) => {
        if (e.button !== 0) return
        dragging = true
        wrap.classList.add(s.dragging)
        wrap.setPointerCapture(e.pointerId)
        setValue(fromPointer(e))
        knob.focus({ preventScroll: true })
      }
      const onMove = (e: PointerEvent) => dragging && setValue(fromPointer(e))
      const onUp = (e: PointerEvent) => {
        dragging = false
        wrap.classList.remove(s.dragging)
        if (wrap.hasPointerCapture(e.pointerId)) wrap.releasePointerCapture(e.pointerId)
      }
      const onKey = (e: KeyboardEvent) => {
        const big = e.shiftKey ? 5 : 1
        const map: Record<string, number> = {
          ArrowLeft: current - big,
          ArrowDown: current - big,
          ArrowRight: current + big,
          ArrowUp: current + big,
          PageDown: current - 5,
          PageUp: current + 5,
          Home: BUDGET_MIN,
          End: BUDGET_MAX,
        }
        if (e.key in map) {
          e.preventDefault()
          setValue(map[e.key])
        }
      }
      window.addEventListener('resize', paint)
      wrap.addEventListener('pointerdown', onDown)
      wrap.addEventListener('pointermove', onMove)
      wrap.addEventListener('pointerup', onUp)
      wrap.addEventListener('pointercancel', onUp)
      knob.addEventListener('keydown', onKey)

      /* ---------- entrance ---------- */
      fontsReady().then(() => {
        if (cancelled) return
        context.add(() => {
          const tag = el.querySelector('[data-tag]')
          const heading = el.querySelector<HTMLElement>('[data-heading]')!
          const intro = el.querySelector<HTMLElement>('[data-intro]')!
          const roll = el.querySelector<HTMLElement>('[data-roll]')!
          const ticks = el.querySelectorAll('[data-tick]')
          const values = el.querySelectorAll('[data-value] > span')
          const brackets = el.querySelectorAll('[data-bracket]')
          const bracketLabels = el.querySelectorAll('[data-bracket-label] > span')
          const pinWrap = el.querySelector('[data-pin-wrap]')
          const hint = el.querySelectorAll('[data-hint]')
          const cards = el.querySelectorAll<HTMLElement>('[data-card]')
          const booked = el.querySelector('[data-booked]')
          const closingLine = el.querySelector<HTMLElement>('[data-closing]')!
          const cta = el.querySelector('[data-closing-cta]')

          mm = gsap.matchMedia()
          mm.add({ motion: BREAKPOINTS.motion, reduce: BREAKPOINTS.reduce }, (ctx) => {
            if ((ctx.conditions as Record<string, boolean>).reduce) {
              reduceReveal(el, [wrap, ...Array.from(cards), cta as Element])
              return
            }

            gsap
              .timeline({ scrollTrigger: { trigger: el, start: 'top 72%', once: true } })
              .add(tagIn(tag), 0)
              .add(revealLines(heading, { stagger: 0.1 }), 0.1)
              .add(fadeUpLines(intro), 0.35)

            // The tape is pulled out from the left, ticks follow, then the bands mark themselves out.
            gsap.set(pinWrap, { autoAlpha: 0 })
            gsap
              .timeline({ scrollTrigger: { trigger: wrap, start: 'top 82%', once: true } })
              .fromTo(roll, { xPercent: -100 }, { xPercent: 0, duration: 1.4, ease: EASE.out }, 0)
              .fromTo(ticks, { scaleY: 0 }, { scaleY: 1, duration: 0.5, stagger: 0.012, ease: 'back.out(2)' }, 0.25)
              .fromTo(values, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.06 }, 0.7)
              .fromTo(brackets, { scaleX: 0 }, { scaleX: 1, duration: 0.9, stagger: 0.12, ease: EASE.inOut, transformOrigin: '50% 50%' }, 0.85)
              .fromTo(bracketLabels, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.12 }, 1.15)
              .fromTo(pinWrap, { y: -40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'back.out(1.6)' }, 1.25)
              .fromTo(hint, { y: 10 }, { y: 0, duration: 0.8, clearProps: 'transform' }, 1.4)

            gsap.set(cards, { autoAlpha: 0 })
            gsap
              .timeline({ scrollTrigger: { trigger: el.querySelector('[data-cards]'), start: 'top 82%', once: true } })
              .fromTo(cards, { y: 90, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.15, stagger: 0.12, ease: EASE.out, clearProps: 'transform' }, 0)
              .fromTo(booked, { scale: 0, rotation: -14 }, { scale: 1, rotation: 0, duration: 0.8, ease: 'back.out(2.4)' }, 0.55)

            gsap.set(cta, { autoAlpha: 0 })
            gsap
              .timeline({ scrollTrigger: { trigger: closingLine, start: 'top 88%', once: true } })
              .add(revealLines(closingLine, { stagger: 0.1 }), 0)
              .fromTo(cta, { scale: 0.8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.8, ease: 'back.out(1.8)' }, 0.3)
          })
        })
      })

      return () => {
        cancelled = true
        mm?.revert()
        window.removeEventListener('resize', paint)
        wrap.removeEventListener('pointerdown', onDown)
        wrap.removeEventListener('pointermove', onMove)
        wrap.removeEventListener('pointerup', onUp)
        wrap.removeEventListener('pointercancel', onUp)
        knob.removeEventListener('keydown', onKey)
      }
    },
    { scope: root },
  )

  // Keep band highlights honest if the budget is changed elsewhere.
  useEffect(() => setBand(bandFor(budget)), [budget])

  return (
    <section id="pricing" ref={root} className={s.costs} aria-labelledby="pricing-title">
      <div className={s.head}>
        <div className={s.headLeft}>
          <SectionTag num="04" label="What it costs" />
          <p className={s.intro} data-intro data-reveal>
            Most of our gardens land in one of three bands. Slide to your budget and we’ll show you one we’ve built for about
            that.
          </p>
        </div>
        <h2 id="pricing-title" className={s.heading} data-heading data-reveal>
          Honest prices,{' '}
          <br className="desk-br" />
          before anyone visits.
        </h2>
      </div>

      <div className={s.tapeWrap} data-tape>
        <div className={s.roll} data-roll aria-hidden="true">
          <span className={`${s.abs} ${s.band}`} data-band />
          <span className={`${s.abs} ${s.tint}`} data-tint />
          <span className={`${s.abs} ${s.hook}`} />
          {TICKS.map((k) => (
            <span
              key={k}
              className={`${s.abs} ${s.tick} ${k % 5 === 0 ? s.major : ''}`}
              style={{ '--k': k } as React.CSSProperties}
              data-tick
            />
          ))}
          {[10, 20, 30, 40, 50, 60].map((k) => (
            <span key={k} className={`${s.abs} ${s.value}`} style={{ '--k': k } as React.CSSProperties} data-value>
              <span>£{k}k</span>
            </span>
          ))}
        </div>

        {BANDS.map((b) => (
          <span
            key={b.id}
            className={`${s.abs} ${s.bracket}`}
            style={{ '--x0': b.x0, '--x1': b.x1 } as React.CSSProperties}
            data-bracket
            data-band-on={band === b.id}
            aria-hidden="true"
          />
        ))}
        {BANDS.map((b) => (
          <span
            key={b.id}
            className={`${s.abs} ${s.bracketLabel}`}
            style={{ '--x0': b.x0, '--x1': b.x1 } as React.CSSProperties}
            data-bracket-label
            data-band-on={band === b.id}
            aria-hidden="true"
          >
            <span>{b.name}</span>
          </span>
        ))}

        <span className={`${s.abs} ${s.hint}`} data-hint aria-hidden="true">
          {'←  Slide to your budget  →'}
        </span>
        <span className={`${s.abs} ${s.note}`} data-hint role="status">
          {budget < 10 ? 'Most of our gardens start around £10k. Still worth a chat.' : ''}
        </span>

        <div className={`${s.abs} ${s.pin}`} data-pin-wrap>
          <div className={s.pinMove} data-pin>
            <span className={s.pinLine} aria-hidden="true" />
            <span
              className={s.knob}
              data-knob
              role="slider"
              tabIndex={0}
              aria-label="Your budget"
              aria-valuemin={BUDGET_MIN}
              aria-valuemax={BUDGET_MAX}
              aria-valuenow={budget}
              aria-valuetext={money(budget)}
              aria-orientation="horizontal"
            />
            <span className={s.bubble} data-bubble aria-hidden="true">
              <span className={s.bubbleLabel}>Your budget</span>
              <span className={s.bubbleValue} data-bubble-value>
                £{budget}k
              </span>
            </span>
          </div>
        </div>
      </div>

      <ul className={s.cards} data-cards>
        {CARDS.map((c) => {
          const b = BANDS.find((x) => x.id === c.id)!
          return (
            <li key={c.id} className={s.card} data-card data-active={band === c.id} data-reveal>
              <button
                type="button"
                className={s.cardHit}
                aria-pressed={band === c.id}
                aria-label={`${c.name}, ${c.price}: set my budget to £${b.mid}k`}
                onClick={() => setValueRef.current(b.mid)}
              />
              <div className={s.topRow}>
                <span className={s.chip}>{c.weeks}</span>
                {c.booked && (
                  <span className={s.chipBooked} data-booked>
                    Most booked
                  </span>
                )}
              </div>
              <h3 className={s.name}>{c.name}</h3>
              <p className={s.price}>{c.price}</p>
              <div className={s.divider} />
              <p className={s.incLabel}>TYPICALLY INCLUDES</p>
              <ul className={s.list}>
                {c.items.map((it) => (
                  <li key={it} className={s.item}>
                    <span className={s.itemDot} aria-hidden="true" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
              <div className={s.spacer} />
              <div className={s.example}>
                <span className={s.examplePill}>
                  <Image src={c.example.img} alt="" fill sizes="120px" />
                </span>
                <span>
                  <span className={s.exampleName}>{c.example.name}</span>
                  <span className={s.exampleMeta} style={{ display: 'block' }}>
                    {c.example.meta}
                  </span>
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      <div className={s.closing}>
        <p className={s.closingLine} data-closing data-reveal>
          Every garden gets one fixed quote after the first visit.{' '}
          <br className="desk-br" />
          No extras later.
        </p>
        <div data-closing-cta>
          <PillCta href="#enquiry" labelSize={46} onClick={(e) => scrollToHash(e, '#enquiry')}>
            Book the first visit
          </PillCta>
        </div>
      </div>
    </section>
  )
}
