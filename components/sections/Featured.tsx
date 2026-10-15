'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { gsap, ScrollTrigger, EASE, useGSAP } from '@/lib/gsap'
import { BREAKPOINTS, fontsReady } from '@/lib/ready'
import { clipReveal, countUp, fadeUpLines, reduceReveal, revealLines, wordFadeUp } from '@/lib/motion'
import { scrollToHash } from '@/lib/scroll'
import { PillCta } from '@/components/ui/PillCta'
import s from './Featured.module.css'

const FACTS = [
  { value: 52, prefix: '£', suffix: 'k', label: 'Budget' },
  { value: 7, prefix: '', suffix: ' weeks', label: 'Build time' },
  { value: 3, prefix: '', suffix: '', label: 'New levels' },
]

const WEEKS = [
  { week: 'Week 1', what: 'Groundworks and drainage', img: '/images/week-1.webp' },
  { week: 'Week 4', what: 'Walls and steps', img: '/images/week-4.webp' },
  { week: 'Week 7', what: 'Planting', img: '/images/week-7.webp' },
]

export default function Featured() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    (context) => {
      const el = root.current!
      let mm: gsap.MatchMedia | undefined
      let cancelled = false

      /* ---------- before / after: works without any scroll motion ---------- */
      const slider = el.querySelector<HTMLElement>('[data-slider]')!
      const before = slider.querySelector<HTMLElement>('[data-before]')!
      const rail = slider.querySelector<HTMLElement>('[data-rail]')!
      const handle = slider.querySelector<HTMLElement>('[data-handle]')!
      const labelBefore = slider.querySelector<HTMLElement>('[data-label-before]')!
      const labelAfter = slider.querySelector<HTMLElement>('[data-label-after]')!
      const state = { p: 50 }
      const apply = () => {
        const p = state.p
        before.style.clipPath = `inset(0 ${100 - p}% 0 0)`
        rail.style.transform = `translateX(${p}%)`
        labelBefore.style.opacity = `${gsap.utils.clamp(0, 1, (p - 6) / 14)}`
        labelAfter.style.opacity = `${gsap.utils.clamp(0, 1, (94 - p) / 14)}`
      }
      // Damped follow: the image chases the pointer rather than snapping to it.
      const follow = gsap.quickTo(state, 'p', { duration: 0.5, ease: 'power3.out', onUpdate: apply })
      let target = 50
      const setTarget = (p: number, instant = false) => {
        target = gsap.utils.clamp(0, 100, p)
        handle.setAttribute('aria-valuenow', `${Math.round(target)}`)
        handle.setAttribute('aria-valuetext', `${Math.round(target)}% before, ${100 - Math.round(target)}% after`)
        if (instant) {
          gsap.set(state, { p: target })
          apply()
        } else follow(target)
      }
      let sweep: gsap.core.Timeline | null = null
      const stopSweep = () => {
        if (sweep) {
          sweep.kill()
          sweep = null
          follow.tween.invalidate()
        }
      }
      let dragging = false
      const fromPointer = (e: PointerEvent) => {
        const r = slider.getBoundingClientRect()
        return ((e.clientX - r.left) / r.width) * 100
      }
      const onDown = (e: PointerEvent) => {
        if (e.button !== 0) return
        stopSweep()
        dragging = true
        slider.classList.add(s.dragging)
        slider.setPointerCapture(e.pointerId)
        setTarget(fromPointer(e))
      }
      const onMove = (e: PointerEvent) => dragging && setTarget(fromPointer(e))
      const onUp = (e: PointerEvent) => {
        dragging = false
        slider.classList.remove(s.dragging)
        if (slider.hasPointerCapture(e.pointerId)) slider.releasePointerCapture(e.pointerId)
      }
      const onKey = (e: KeyboardEvent) => {
        const big = e.shiftKey ? 10 : 5
        const map: Record<string, number> = {
          ArrowLeft: target - big,
          ArrowDown: target - big,
          ArrowRight: target + big,
          ArrowUp: target + big,
          Home: 0,
          End: 100,
          PageDown: target - 20,
          PageUp: target + 20,
        }
        if (e.key in map) {
          e.preventDefault()
          stopSweep()
          setTarget(map[e.key])
        }
      }
      slider.addEventListener('pointerdown', onDown)
      slider.addEventListener('pointermove', onMove)
      slider.addEventListener('pointerup', onUp)
      slider.addEventListener('pointercancel', onUp)
      handle.addEventListener('keydown', onKey)
      setTarget(50, true)

      fontsReady().then(() => {
        if (cancelled) return
        context.add(() => {
          const headline = el.querySelector<HTMLElement>('[data-headline]')!
          const brief = el.querySelector<HTMLElement>('[data-brief]')!
          const facts = Array.from(el.querySelectorAll<HTMLElement>('[data-fact]'))
          const quote = el.querySelector<HTMLElement>('[data-quote]')!
          const cite = el.querySelector<HTMLElement>('[data-cite]')!
          const cta = el.querySelector<HTMLElement>('[data-cta]')!
          const media = slider.querySelector<HTMLElement>('[data-media]')!
          const labels = [labelBefore, labelAfter]
          const weeks = Array.from(el.querySelectorAll<HTMLElement>('[data-week]'))

          mm = gsap.matchMedia()
          mm.add({ motion: BREAKPOINTS.motion, reduce: BREAKPOINTS.reduce }, (ctx) => {
            const { reduce } = ctx.conditions as Record<string, boolean>
            if (reduce) {
              reduceReveal(el)
              return
            }

            // Copy column
            gsap.set([cite, cta, ...facts], { autoAlpha: 0 })
            gsap
              .timeline({ scrollTrigger: { trigger: el, start: 'top 70%', once: true } })
              .add(revealLines(headline, { stagger: 0.1, duration: 1.2 }), 0)
              .add(fadeUpLines(brief), 0.35)
              .fromTo(facts, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.1 }, 0.6)
              .add(
                () => {
                  facts.forEach((f, i) => {
                    const v = f.querySelector<HTMLElement>('[data-value]')!
                    const fact = FACTS[i]
                    countUp(v, fact.value, { prefix: fact.prefix, suffix: fact.suffix, duration: 1.6 })
                  })
                },
                0.6,
              )

            gsap
              .timeline({ scrollTrigger: { trigger: quote, start: 'top 85%', once: true } })
              .add(wordFadeUp(quote.querySelector('p')!, { stagger: 0.035 }), 0)
              .fromTo(cite, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 }, 0.5)
              .fromTo(cta, { y: 24, scale: 0.94, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.9, ease: EASE.out }, 0.65)

            // Slider opens left to right, then the week strip follows it up.
            gsap.set(weeks, { autoAlpha: 0 })
            gsap.set([...labels, handle], { autoAlpha: 0 })
            const vis = gsap.timeline({ scrollTrigger: { trigger: slider, start: 'top 78%', once: true } })
            vis
              .add(clipReveal(slider, media, { from: 'inset(0% 100% 0% 0% round 0px)', duration: 1.4, scale: 1.18 }), 0)
              .fromTo(labels, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'back.out(2)', stagger: 0.08, clearProps: 'transform' }, 0.9)
              .to(handle, { autoAlpha: 1, duration: 0.6, ease: EASE.soft }, 1)
              .fromTo(weeks, { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.1, ease: EASE.out }, 0.7)

            // One hint sweep the first time the slider is properly in view.
            ScrollTrigger.create({
              trigger: slider,
              start: 'top 55%',
              once: true,
              onEnter: () => {
                if (dragging || target !== 50) return
                sweep = gsap
                  .timeline({ delay: 0.6, onUpdate: apply, onComplete: () => (sweep = null) })
                  .to(state, { p: 75, duration: 0.8, ease: EASE.inOut })
                  .to(state, { p: 30, duration: 0.95, ease: EASE.inOut })
                  .to(state, { p: 50, duration: 0.65, ease: EASE.inOut })
              },
            })
          })
        })
      })

      return () => {
        cancelled = true
        mm?.revert()
        slider.removeEventListener('pointerdown', onDown)
        slider.removeEventListener('pointermove', onMove)
        slider.removeEventListener('pointerup', onUp)
        slider.removeEventListener('pointercancel', onUp)
        handle.removeEventListener('keydown', onKey)
      }
    },
    { scope: root },
  )

  return (
    <section id="featured" ref={root} className={`${s.featured} on-dark`} aria-labelledby="featured-title">
      <div className={s.copy}>
        <h2 id="featured-title" className={s.headline} data-headline data-reveal>
          A slope nobody used,
          <br />
          turned into the best
          <br />
          room in the house.
        </h2>
        <p className={s.brief} data-brief data-reveal>
          The Thompsons had a steep, waterlogged garden they walked past instead of into. We cut it into three levels with
          natural stone walls, fixed the drainage for good, and planted it to look as good in October as it does in June.
        </p>
        <dl className={s.facts}>
          {FACTS.map((f) => (
            <div key={f.label} className={s.fact} data-fact>
              <dt className={s.factLabel}>{f.label}</dt>
              <dd className={s.factValue} data-value>
                {`${f.prefix}${f.value}${f.suffix}`}
              </dd>
            </div>
          ))}
        </dl>
        <figure className={s.quote} data-quote>
          <blockquote>
            <p className={s.quoteText} data-reveal>
              “We spend more evenings out there than in the living room now.”
            </p>
          </blockquote>
          <figcaption className={s.cite} data-cite>
            Sarah Thompson, Alresford
          </figcaption>
        </figure>
        <div className={s.cta} data-cta>
          <PillCta href="#process" tone="dark" labelSize={37.189} onClick={(e) => scrollToHash(e, '#process')}>
            See the full project
          </PillCta>
        </div>
      </div>

      <div className={s.visual}>
        <div className={s.slider} data-slider data-reveal>
          <div className={s.media} data-media>
            <Image src="/images/after.webp" alt="The Alresford garden after: three stone-walled terraces with planting" fill sizes="(max-width: 1279px) 92vw, 52vw" />
            <div className={s.before} data-before>
              <Image src="/images/before.webp" alt="The same garden before: a steep, overgrown slope" fill sizes="(max-width: 1279px) 92vw, 52vw" />
            </div>
          </div>
          <span className={`${s.label} ${s.labelBefore}`} data-label-before aria-hidden="true">
            BEFORE
          </span>
          <span className={`${s.label} ${s.labelAfter}`} data-label-after aria-hidden="true">
            AFTER
          </span>
          <div className={s.rail} data-rail>
            <span className={s.line} aria-hidden="true" />
            <div
              className={s.handle}
              data-handle
              role="slider"
              tabIndex={0}
              aria-label="Before and after comparison"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={50}
              aria-orientation="horizontal"
            >
              <span aria-hidden="true">{'←  →'}</span>
            </div>
          </div>
        </div>

        <ul className={s.weeks}>
          {WEEKS.map((w) => (
            <li key={w.week} className={s.week} data-week>
              <Image src={w.img} alt={`${w.week}: ${w.what.toLowerCase()}`} fill sizes="(max-width: 767px) 74vw, 17vw" />
              <span className={s.weekCap} aria-hidden="true">
                <b>{w.week}</b>
                <span>{`·  ${w.what}`}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
