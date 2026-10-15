'use client'

import Image from 'next/image'
import { Fragment, useRef } from 'react'
import { gsap, EASE, useGSAP } from '@/lib/gsap'
import { BREAKPOINTS, fontsReady } from '@/lib/ready'
import { tagIn } from '@/lib/motion'
import { scrollToHash } from '@/lib/scroll'
import { SectionTag } from '@/components/ui/SectionTag'
import { ArrowSwap, ArrowGlyph } from '@/components/ui/ArrowGlyph'
import s from './About.module.css'

type Token =
  | { kind: 'word'; text: string; loam?: boolean }
  | { kind: 'pill'; src: string }
  | { kind: 'badge' }
  | { kind: 'avatar' }

const words = (text: string, loam = false): Token[] => text.split(' ').map((w) => ({ kind: 'word', text: w, loam }))

// Reading order. Media sit inline and take their turn like words.
const STATEMENT: Token[] = [
  ...words('We design and build'),
  { kind: 'pill', src: '/images/farnham.webp' },
  ...words('gardens across Surrey and Hampshire. Over'),
  { kind: 'badge' },
  ...words('finished so far, from tight town plots in'),
  { kind: 'pill', src: '/images/godalming.webp' },
  ...words('Godalming to sloping country gardens, all built by one crew'),
  { kind: 'avatar' },
  ...words('who stay with you'),
  ...words('from the first sketch to the last plant in the ground.', true),
]

const MOSS = '#2e3a28'
const LOAM = '#7b5236'
// "Almost written": faint but legible, the phone starting state
const ALMOST = 'rgba(46, 58, 40, 0.24)'
const ALMOST_LOAM = 'rgba(123, 82, 54, 0.28)'

export default function About() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    (context) => {
      const el = root.current!
      let mm: gsap.MatchMedia | undefined
      let cancelled = false

      fontsReady().then(() => {
        if (cancelled) return
        context.add(() => {
          const tag = el.querySelector('[data-tag]')
          const learn = el.querySelector('[data-learn]')
          const seq = Array.from(el.querySelectorAll<HTMLElement>('[data-seq]'))
          const count = el.querySelector<HTMLElement>('[data-count]')!
          const divider = el.querySelector<HTMLElement>('[data-divider]')!
          const lines = divider.querySelectorAll('[data-line]')
          const dots = divider.querySelectorAll('[data-dot]')
          const emblem = divider.querySelector('[data-emblem]')

          const dividerTl = () =>
            gsap
              .timeline({ paused: true })
              .fromTo(emblem, { rotation: -90, scale: 0.6, opacity: 0 }, { rotation: 0, scale: 1, opacity: 1, duration: 1.1, ease: EASE.out })
              .fromTo(lines, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: EASE.inOut }, 0.1)
              .fromTo(dots, { scale: 0 }, { scale: 1, duration: 0.6, ease: 'back.out(2.4)', stagger: 0.05 }, 0.25)

          mm = gsap.matchMedia()
          mm.add(
            { motion: BREAKPOINTS.motion, reduce: BREAKPOINTS.reduce },
            (ctx) => {
              const { reduce } = ctx.conditions as Record<string, boolean>

              if (reduce) {
                gsap.set([tag, learn], { visibility: 'visible' })
                gsap.from([tag, learn, el.querySelector('[data-statement]'), divider], { opacity: 0, duration: 0.4, ease: 'none' })
                return
              }

              // Tag and "Learn more" arrive as the section does.
              gsap
                .timeline({ scrollTrigger: { trigger: el, start: 'top 75%', once: true } })
                .add(tagIn(tag))
                .fromTo(learn, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE.out }, 0.2)

              const wordsEls = seq.filter((n) => n.dataset.seq === 'word')
              const media = seq.filter((n) => n.dataset.seq !== 'word')
              const counter = { v: 0 }
              const countTo = (t: number, target: gsap.core.Timeline) =>
                target.to(
                  counter,
                  {
                    v: 180,
                    duration: 0.9,
                    ease: 'power2.out',
                    onUpdate: () => {
                      count.textContent = `${Math.round(counter.v)}+`
                    },
                  },
                  t,
                )
              count.textContent = '0+'
              const div = dividerTl() // fromTo renders the folded start state immediately

              // Every screen size: no pin, nothing rises. The sentence is already there,
              // faintly, like it's been pencilled in, and inks in word by word as you scroll past.
              gsap.set(wordsEls, { color: (_i: number, n: HTMLElement) => (n.dataset.loam === 'true' ? ALMOST_LOAM : ALMOST) })
              gsap.set(media, { opacity: 0.28 })
              const ink = gsap.timeline({
                defaults: { ease: 'none' },
                scrollTrigger: {
                  trigger: el.querySelector('[data-statement]'),
                  start: 'top 82%',
                  end: 'bottom 42%',
                  scrub: 0.8,
                  onLeave: () => div.timeScale(1).play(),
                  onEnterBack: () => div.timeScale(1.6).reverse(),
                },
              })
              seq.forEach((node, i) => {
                const t = i * 0.12
                if (node.dataset.seq === 'word') {
                  ink.to(node, { color: node.dataset.loam === 'true' ? LOAM : MOSS, duration: 0.55 }, t)
                } else {
                  ink.to(node, { opacity: 1, duration: 0.55 }, t)
                  if (node.dataset.seq === 'badge') countTo(t, ink)
                }
              })
              return () => {
                count.textContent = '180+'
              }
            },
          )
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
    <section id="about" ref={root} className={s.about} aria-labelledby="about-title">
      <div className={s.top}>
        <SectionTag num="01" label="About" />
        <a
          href="#process"
          className={s.learn}
          data-learn
          data-reveal
          onClick={(e) => scrollToHash(e, '#process')}
        >
          Learn more
          <ArrowSwap className={s.learnArrow} />
        </a>
      </div>

      <div className={s.body}>
        <h2 id="about-title" className="sr-only">
          About Hartwell Gardens
        </h2>
        <p className={s.statement} data-statement>
          {STATEMENT.map((tok, i) => {
            const space = i < STATEMENT.length - 1 ? ' ' : ''
            if (tok.kind === 'word') {
              return (
                <Fragment key={i}>
                  <span className={`${s.word} ${tok.loam ? s.loamFinal : ''}`} data-seq="word" data-loam={tok.loam ? 'true' : undefined}>
                    {tok.text}
                  </span>
                  {space}
                </Fragment>
              )
            }
            if (tok.kind === 'pill') {
              return (
                <Fragment key={i}>
                  <span className={`${s.media} ${s.pill}`} data-seq="pill">
                    <Image src={tok.src} alt="" fill sizes="160px" />
                  </span>
                  {space}
                </Fragment>
              )
            }
            if (tok.kind === 'badge') {
              return (
                <Fragment key={i}>
                  <span className={`${s.media} ${s.badge}`} data-seq="badge">
                    <span className={s.badgeIcon} aria-hidden="true">
                      <ArrowGlyph />
                    </span>
                    <span className={s.badgeNum} data-count aria-hidden="true">
                      180+
                    </span>
                    <span className="sr-only">180+</span>
                  </span>
                  {space}
                </Fragment>
              )
            }
            return (
              <Fragment key={i}>
                <span className={`${s.media} ${s.avatar}`} data-seq="avatar">
                  <Image src="/images/avatar-james-small.png" alt="" fill sizes="64px" />
                </span>
                {space}
              </Fragment>
            )
          })}
        </p>

        <div className={s.divider} data-divider aria-hidden="true">
          <span className={`${s.line} ${s.lineL}`} data-line />
          <span className={s.dot} data-dot />
          <span className={s.emblem} data-emblem>
            <span className={s.emblemInner}>HG</span>
          </span>
          <span className={s.dot} data-dot />
          <span className={`${s.line} ${s.lineR}`} data-line />
        </div>
      </div>
      <div className={s.rule} aria-hidden="true" />
    </section>
  )
}
