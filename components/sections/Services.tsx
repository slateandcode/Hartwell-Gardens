'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { gsap, Draggable, EASE, useGSAP } from '@/lib/gsap'
import { BREAKPOINTS, fontsReady } from '@/lib/ready'
import { clipReveal, revealLines, riseWords, tagIn } from '@/lib/motion'
import { scrollToHash } from '@/lib/scroll'
import { SectionTag } from '@/components/ui/SectionTag'
import { ArrowSwap } from '@/components/ui/ArrowGlyph'
import s from './Services.module.css'

type Service = { title: string; img: string; style: 'light' | 'photo' }

const SERVICES: Service[] = [
  { title: 'Patios and paving', img: '/images/cobham.webp', style: 'light' },
  { title: 'Planting', img: '/images/farnham.webp', style: 'photo' },
  { title: 'Garden lighting', img: '/images/petersfield.webp', style: 'photo' },
  { title: 'Walls and steps', img: '/images/alresford.webp', style: 'light' },
  { title: 'Aftercare', img: '/images/godalming.webp', style: 'photo' },
]

function Plus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3v18M3 12h18" />
    </svg>
  )
}

export default function Services() {
  const root = useRef<HTMLElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const api = useRef<{ go: (dir: 1 | -1) => void; reveal: (i: number) => void } | null>(null)

  useGSAP(
    (context) => {
      const el = root.current!
      let mm: gsap.MatchMedia | undefined
      let cancelled = false

      fontsReady().then(() => {
        if (cancelled) return
        context.add(() => {
          const viewport = el.querySelector<HTMLElement>('[data-viewport]')!
          const track = el.querySelector<HTMLElement>('[data-track]')!
          const cards = Array.from(track.children) as HTMLElement[]

          /* ----- carousel: buttons, drag with inertia, snap to cards ----- */
          const step = () => cards[1].offsetLeft - cards[0].offsetLeft
          const minX = () => Math.min(0, viewport.clientWidth - track.scrollWidth)
          const snaps = () => {
            const pts: number[] = []
            const lo = minX()
            for (let x = 0; x > lo; x -= step()) pts.push(x)
            pts.push(lo)
            return pts
          }
          const sync = () => {
            const x = gsap.getProperty(track, 'x') as number
            setAtStart(x > -4)
            setAtEnd(x < minX() + 4)
          }
          const drag = Draggable.create(track, {
            type: 'x',
            bounds: viewport,
            inertia: true,
            edgeResistance: 0.85,
            dragClickables: true,
            allowContextMenu: true,
            minimumMovement: 6,
            snap: { x: (v: number) => gsap.utils.snap(snaps(), v) },
            onDrag: sync,
            onThrowUpdate: sync,
            onThrowComplete: sync,
            onClick: () => undefined,
          })[0]
          // Suppress the click that ends a drag, so swiping never opens a card.
          let dragged = false
          drag.addEventListener('dragstart', () => (dragged = true))
          const onClickCapture = (e: MouseEvent) => {
            if (dragged) {
              e.preventDefault()
              e.stopPropagation()
              dragged = false
            }
          }
          track.addEventListener('click', onClickCapture, true)
          track.addEventListener('pointerdown', () => (dragged = false))

          const moveTo = (x: number) =>
            gsap.to(track, {
              x,
              duration: 0.9,
              ease: EASE.inOut,
              overwrite: true,
              onUpdate: () => {
                drag.update()
                sync()
              },
            })
          api.current = {
            go: (dir) => {
              const pts = snaps()
              const x = gsap.getProperty(track, 'x') as number
              const i = pts.reduce((best, p, k) => (Math.abs(p - x) < Math.abs(pts[best] - x) ? k : best), 0)
              moveTo(pts[gsap.utils.clamp(0, pts.length - 1, i + dir)])
            },
            // keep a focused card in view when tabbing
            reveal: (i) => {
              const card = cards[i]
              const x = gsap.getProperty(track, 'x') as number
              const left = card.offsetLeft + x
              const right = left + card.offsetWidth
              if (left < 0 || right > viewport.clientWidth) {
                moveTo(gsap.utils.clamp(minX(), 0, -card.offsetLeft))
              }
            },
          }
          const onResize = () => {
            gsap.set(track, { x: gsap.utils.clamp(minX(), 0, gsap.getProperty(track, 'x') as number) })
            drag.applyBounds(viewport)
            sync()
          }
          window.addEventListener('resize', onResize)

          /* ----- entrance ----- */
          const tag = el.querySelector('[data-tag]')
          const heading = el.querySelector<HTMLElement>('[data-heading]')!
          const big = el.querySelector<HTMLElement>('[data-big]')!
          const bigImg = big.querySelector('img')
          const bigBits = big.querySelectorAll('[data-big-bit]')
          const bigTitle = big.querySelector<HTMLElement>('[data-big-title]')!
          const bigArrow = big.querySelector('[data-big-arrow]')
          const nav = el.querySelector('[data-carousel-nav]')
          const caption = el.querySelector<HTMLElement>('[data-caption]')!

          mm = gsap.matchMedia()
          mm.add({ motion: BREAKPOINTS.motion, reduce: BREAKPOINTS.reduce }, (ctx) => {
            const { reduce } = ctx.conditions as Record<string, boolean>
            const all = [tag, heading, big, ...cards, nav, caption]
            if (reduce) {
              gsap.fromTo(all, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'none' })
              return
            }
            gsap.set([big, nav, ...cards], { autoAlpha: 0 })
            const tl = gsap.timeline({
              scrollTrigger: { trigger: el, start: 'top 72%', once: true },
            })
            tl.add(tagIn(tag), 0)
              .add(revealLines(heading, { stagger: 0.1 }), 0.1)
              .set(big, { autoAlpha: 1 }, 0.25)
              .add(clipReveal(big, bigImg, { from: 'inset(100% 0% 0% 0% round 0px)', duration: 1.3, scale: 1.2 }), 0.25)
              .fromTo(bigBits, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.08 }, 1.05)
              .add(riseWords(bigTitle, { stagger: 0.08 }), 1.1)
              .fromTo(bigArrow, { scale: 0, rotate: -45 }, { scale: 1, rotate: 0, duration: 0.8, ease: 'back.out(2)' }, 1.35)
              .fromTo(cards, { x: 140, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1, stagger: 0.1, ease: EASE.out, clearProps: 'x' }, 0.55)
              .fromTo(nav, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 }, 1.1)
              .add(revealLines(caption, { stagger: 0.06, duration: 1 }), 1.35)
          })

          return () => {
            window.removeEventListener('resize', onResize)
            track.removeEventListener('click', onClickCapture, true)
            drag.kill()
          }
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
    <section id="services" ref={root} className={s.services} aria-labelledby="services-title">
      <div className={s.head}>
        <div className={s.tagCell}>
          <SectionTag num="02" label="Services" />
        </div>
        <h2 id="services-title" className={s.heading} data-heading data-reveal>
          Every part of the garden,
          <br />
          under one crew.
        </h2>
      </div>

      <div className={s.main}>
        <a
          href="#pricing"
          className={s.big}
          data-big
          data-reveal
          onClick={(e) => scrollToHash(e, '#pricing')}
        >
          <span className={s.bigMedia}>
            <Image src="/images/haslemere.webp" alt="" fill sizes="(max-width: 1279px) 92vw, 44vw" />
          </span>
          <span className={s.shade} aria-hidden="true" />
          <span className={s.bigTags}>
            <span className={s.bigTag} data-big-bit>
              Most booked
            </span>
            <span className={s.bigTag} data-big-bit>
              From £15k
            </span>
          </span>
          <span className={s.bigTitle} data-big-title>
            Design
            <br />
            and build
          </span>
          <span className={s.bigArrow} data-big-arrow aria-hidden="true">
            <ArrowSwap className={s.bigArrowGlyph} />
          </span>
        </a>

        <div className={s.side}>
          <div className={s.viewport} data-viewport>
            <ul className={s.track} data-track aria-label="Services">
              {SERVICES.map((svc, i) => (
                <li
                  key={svc.title}
                  className={`${s.card} ${svc.style === 'light' ? s.light : s.photo}`}
                  data-reveal
                >
                  <a
                    href="#featured"
                    className={s.cardLink}
                    onFocus={() => api.current?.reveal(i)}
                    onClick={(e) => scrollToHash(e, '#featured')}
                    draggable={false}
                  >
                    <span className={svc.style === 'light' ? s.lightMedia : s.photoMedia}>
                      <Image src={svc.img} alt="" fill sizes={svc.style === 'light' ? '160px' : '(max-width: 767px) 72vw, 24vw'} draggable={false} />
                    </span>
                    {svc.style === 'photo' && <span className={s.shade} aria-hidden="true" />}
                    <span className={s.plus} aria-hidden="true">
                      <Plus />
                    </span>
                    <span className={s.cardTitle}>{svc.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={s.nav} data-carousel-nav data-reveal>
            <button
              type="button"
              className={`${s.navBtn} ${s.prev}`}
              aria-label="Previous services"
              aria-disabled={atStart}
              onClick={() => !atStart && api.current?.go(-1)}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              className={`${s.navBtn} ${s.next}`}
              aria-label="Next services"
              aria-disabled={atEnd}
              onClick={() => !atEnd && api.current?.go(1)}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <p className={s.caption} data-caption data-reveal>
            From a single patio to a full redesign, every job is drawn, priced and built by the same team. Pick a service to see
            recent gardens.
          </p>
        </div>
      </div>
    </section>
  )
}
