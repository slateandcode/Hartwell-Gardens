'use client'

import { useRef } from 'react'
import { gsap, ScrollTrigger, SplitText, EASE, useGSAP } from '@/lib/gsap'
import { BREAKPOINTS, fontsReady } from '@/lib/ready'
import { reduceReveal, revealLines, tagIn } from '@/lib/motion'
import { scrollToHash } from '@/lib/scroll'
import { SectionTag } from '@/components/ui/SectionTag'
import { PillCta } from '@/components/ui/PillCta'
import { StepIcon } from './StepIcon'
import s from './Process.module.css'

/*
  The path from Figma 37:2 ("Path - done" + "Path - to come"), joined and moved
  into frame coordinates. It enters from the left edge, loops between 01 and
  02, and leaves through the right edge under the step 04 CTA.
*/
const FIGMA_PATH =
  'M-176 183.5C-176 612.5 900 271 900 700C900 930 1150 1050 1330 1050C1440 1050 1530 960 1530 850C1530 740 1440 650 1330 650C1220 650 1130 740 1130 850C1130 1060 1250 1170 1450 1180C1580 1186 1650 1230 1650 1300C1650 1630 900 1570 900 1900C900 2230 1650 2170 1650 2500C1650 3120 2000 3090 2802 3090'

const TAPE_TR = 'M486.131 527.885C126.131 527.885 -43.869 347.885 66.131 177.885C146.131 57.8849 296.131 17.8849 486.131 37.8849'
const TAPE_BL = 'M24.8952 32.8976C404.895 62.8976 564.895 252.898 444.895 412.898C354.895 532.898 204.895 612.898 4.89524 642.898'
const TAPE_TEXT = 'Hartwell Gardens · Design and build · '.repeat(6)

type Step = {
  n: string
  chip: string
  title: [string, string?]
  icon: 'visit' | 'design' | 'build' | 'care'
  body: string
  side: 'left' | 'right'
  nx: number
  ny: number
  ty: number
}

const STEPS: Step[] = [
  {
    n: '01',
    chip: 'Free, about an hour',
    title: ['The', 'visit'],
    icon: 'visit',
    body: 'James walks the garden with you, measures up and talks budget on the day. You’ll know straight away if we’re the right fit.',
    side: 'left',
    nx: 900,
    ny: 700,
    ty: 610,
  },
  {
    n: '02',
    chip: 'Within two weeks',
    title: ['The', 'design'],
    icon: 'design',
    body: 'A scaled plan, planting scheme and materials list, with one fixed price. What we quote is what you pay.',
    side: 'right',
    nx: 1650,
    ny: 1300,
    ty: 1210,
  },
  {
    n: '03',
    chip: '3 to 7 weeks',
    title: ['The', 'build'],
    icon: 'build',
    body: 'Our own crew from the first dig to the last plant. A weekly update and one number to call, so you’re never chasing.',
    side: 'left',
    nx: 900,
    ny: 1900,
    ty: 1810,
  },
  {
    n: '04',
    chip: '10-year guarantee',
    title: ['Aftercare'],
    icon: 'care',
    body: 'We come back after the first season to check the planting and paving, and we’re a phone call away after that.',
    side: 'right',
    nx: 1650,
    ny: 2500,
    ty: 2410,
  },
]

const STONE = '#eee8dc'
const LOAM = '#7b5236'

/** A path running parallel to `path`, `offset` units to its right. */
function offsetPath(path: SVGPathElement, offset: number, samples = 180) {
  const total = path.getTotalLength()
  const out: string[] = []
  for (let i = 0; i <= samples; i++) {
    const l = (i / samples) * total
    const p = path.getPointAtLength(l)
    const a = path.getPointAtLength(Math.max(0, l - 0.5))
    const b = path.getPointAtLength(Math.min(total, l + 0.5))
    let dx = b.x - a.x
    let dy = b.y - a.y
    const m = Math.hypot(dx, dy) || 1
    dx /= m
    dy /= m
    out.push(`${(p.x - dy * offset).toFixed(1)} ${(p.y + dx * offset).toFixed(1)}`)
  }
  return `M${out.join(' L')}`
}

/** Path for the reflowed layouts: in from the left edge, S-curves through every node, out through a side edge. */
function flowPath(pts: { x: number; y: number }[], width: number, mobile: boolean) {
  const first = pts[0]
  const last = pts[pts.length - 1]
  const lead = mobile ? 150 : 380
  const sx = -80
  const sy = first.y - lead
  let d = `M${sx} ${sy} C${first.x * 0.55} ${sy} ${first.x} ${first.y - lead * 0.55} ${first.x} ${first.y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const k = (b.y - a.y) * 0.5
    const wiggle = mobile ? (i % 2 ? -1 : 1) * 90 : 0
    d += ` C${a.x + wiggle} ${a.y + k} ${b.x - wiggle} ${b.y - k} ${b.x} ${b.y}`
  }
  const ex = mobile ? -80 : width + 80
  const ey = last.y + (mobile ? 300 : 460)
  d += ` C${last.x} ${last.y + (ey - last.y) * 0.7} ${mobile ? last.x * 0.6 : last.x + (ex - last.x) * 0.3} ${ey} ${ex} ${ey}`
  return d
}

export default function Process() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    (context) => {
      const el = root.current!
      let mm: gsap.MatchMedia | undefined
      let cancelled = false

      /* ---------- tape measures: ticks on one half, lettering on the other ---------- */
      el.querySelectorAll<SVGSVGElement>('[data-tape]').forEach((tape) => {
        const band = tape.querySelector<SVGPathElement>('[data-band]')!
        const ticks = offsetPath(band, 15)
        tape.querySelectorAll('[data-ticks]').forEach((t) => t.setAttribute('d', ticks))
        tape.querySelector('[data-text-path]')!.setAttribute('d', offsetPath(band, -6))
      })

      fontsReady().then(() => {
        if (cancelled) return
        context.add(() => {
          const svg = el.querySelector<SVGSVGElement>('[data-paths]')!
          const toCome = svg.querySelector<SVGPathElement>('[data-tocome]')!
          const done = svg.querySelector<SVGPathElement>('[data-done]')!
          const rider = svg.querySelector<SVGGElement>('[data-rider]')!
          const probe = el.querySelector<HTMLElement>('[data-u]')!
          const tag = el.querySelector('[data-tag]')
          const heading = el.querySelector<HTMLElement>('[data-heading]')!
          const steps = Array.from(el.querySelectorAll<HTMLElement>('[data-step]'))
          const tapes = Array.from(el.querySelectorAll<SVGSVGElement>('[data-tape]'))
          const marquees = Array.from(el.querySelectorAll<SVGTextPathElement>('[data-marquee]'))
          const cta = el.querySelector<HTMLElement>('[data-cta]')!

          mm = gsap.matchMedia()
          mm.add(
            // Tablet keeps the desktop geometry (scaled); only mobile reflows.
            { desktop: '(min-width: 768px)', mobile: BREAKPOINTS.mobile, reduce: BREAKPOINTS.reduce },
            (ctx) => {
              const { desktop, mobile, reduce } = ctx.conditions as Record<string, boolean>

              // Head
              if (reduce) {
                reduceReveal(el)
              } else {
                gsap
                  .timeline({ scrollTrigger: { trigger: el, start: 'top 75%', once: true } })
                  .add(tagIn(tag))
                  .add(revealLines(heading, { stagger: 0.1, duration: 1.2 }), 0.1)
              }

              // Tapes drift and turn a little with scroll; their lettering slides along.
              if (!reduce) {
                tapes.forEach((tape, i) => {
                  gsap.fromTo(
                    tape,
                    { y: () => (i ? 60 : -90) * (probe.offsetWidth / 1000), rotation: i ? 2 : -3 },
                    {
                      y: () => (i ? -120 : 140) * (probe.offsetWidth / 1000),
                      rotation: i ? -2 : 2.5,
                      ease: 'none',
                      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.2, invalidateOnRefresh: true },
                    },
                  )
                })
                marquees.forEach((m, i) => {
                  const guide = m.ownerSVGElement!.querySelector<SVGPathElement>('[data-text-path]')!
                  const len = guide.getTotalLength()
                  const o = { v: i ? -0.3 : 0 }
                  const paint = () => m.setAttribute('startOffset', `${(o.v * len).toFixed(1)}`)
                  paint()
                  gsap.to(o, {
                    v: i ? 0 : -0.3,
                    ease: 'none',
                    onUpdate: paint,
                    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
                  })
                })
              }

              /* ----- geometry: Figma path on desktop, rebuilt from the nodes elsewhere ----- */
              let tl: gsap.core.Timeline | null = null
              const splits: SplitText[] = []

              const build = () => {
                const u = probe.offsetWidth / 1000
                let width = 58
                if (desktop) {
                  svg.setAttribute('viewBox', '0 0 2562 3219')
                  toCome.setAttribute('d', FIGMA_PATH)
                  done.setAttribute('d', FIGMA_PATH)
                } else {
                  const box = el.getBoundingClientRect()
                  svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`)
                  const pts = steps.map((st) => {
                    const r = st.querySelector('[data-node]')!.getBoundingClientRect()
                    return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top }
                  })
                  const d = flowPath(pts, box.width, mobile)
                  toCome.setAttribute('d', d)
                  done.setAttribute('d', d)
                  width = 34 * u
                }
                toCome.style.strokeWidth = `${width}`
                done.style.strokeWidth = `${width}`
                gsap.set(rider, { scale: width / 58, transformOrigin: '50% 50%' })
              }

              /** Where along the path (0..1) each node sits: nearest sampled point to its centre. */
              const nodeFractions = () => {
                const total = done.getTotalLength()
                const inv = svg.getScreenCTM()!.inverse()
                const samples = 1400
                const pts = Array.from({ length: samples + 1 }, (_, i) => done.getPointAtLength((i / samples) * total))
                return steps.map((st) => {
                  const r = st.querySelector('[data-node]')!.getBoundingClientRect()
                  const c = new DOMPoint(r.left + r.width / 2, r.top + r.height / 2).matrixTransform(inv)
                  let best = 0
                  let bestD = Infinity
                  pts.forEach((p, i) => {
                    const dd = (p.x - c.x) ** 2 + (p.y - c.y) ** 2
                    if (dd < bestD) {
                      bestD = dd
                      best = i
                    }
                  })
                  return best / samples
                })
              }

              const timeline = () => {
                build()
                if (reduce) {
                  // final state: path drawn, every step awake
                  gsap.set(done, { drawSVG: '0% 100%' })
                  gsap.set(rider, { autoAlpha: 0 })
                  steps.forEach((st) => {
                    gsap.set(st.querySelector('[data-node-fill]'), { opacity: 1 })
                    gsap.set(st.querySelector('[data-node-num]'), { color: STONE })
                    gsap.set(st.querySelector('[data-chip]'), { backgroundColor: LOAM, color: STONE })
                  })
                  return
                }

                const fr = nodeFractions()
                const D = 10
                tl = gsap.timeline({
                  defaults: { ease: 'none' },
                  scrollTrigger: { trigger: el, start: 'top 70%', end: 'bottom 80%', scrub: 1, invalidateOnRefresh: false },
                })
                tl.fromTo(done, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: D }, 0)
                tl.fromTo(rider, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, 0)
                tl.to(
                  rider,
                  { motionPath: { path: done, align: done, alignOrigin: [0.5, 0.5], autoRotate: true }, duration: D },
                  0,
                )

                steps.forEach((st, i) => {
                  const t = fr[i] * D
                  const node = st.querySelector('[data-node]')!
                  const chip = st.querySelector('[data-chip]')!
                  const title = st.querySelector<HTMLElement>('[data-title]')!
                  const icon = st.querySelector('[data-icon]')
                  const body = st.querySelector<HTMLElement>('[data-body]')!
                  const titleSplit = SplitText.create(title, { type: 'words', mask: 'words', wordsClass: 'split-word', aria: 'none' })
                  const bodySplit = SplitText.create(body, { type: 'lines', linesClass: 'split-line', aria: 'none' })
                  splits.push(titleSplit, bodySplit)
                  gsap.set([title, body], { visibility: 'visible' })

                  tl!
                    .to(node, { scale: 0.7, duration: 0.14, ease: 'power2.in' }, Math.max(0, t - 0.14))
                    .to(st.querySelector('[data-node-fill]'), { opacity: 1, duration: 0.2 }, t - 0.04)
                    .to(st.querySelector('[data-node-num]'), { color: STONE, duration: 0.2 }, t - 0.04)
                    .to(node, { scale: 1, duration: 0.6, ease: 'back.out(3.2)' }, t)
                    .fromTo(
                      chip,
                      { autoAlpha: 0, rotation: -8, scale: 0.8 },
                      { autoAlpha: 1, rotation: 0, scale: 1, duration: 0.45, ease: 'back.out(2)' },
                      t + 0.08,
                    )
                    .to(chip, { backgroundColor: LOAM, color: STONE, duration: 0.3 }, t + 0.5)
                    .fromTo(titleSplit.words, { yPercent: 115 }, { yPercent: 0, duration: 0.55, stagger: 0.1, ease: EASE.out }, t + 0.14)
                    .fromTo(bodySplit.lines, { y: '0.9em', autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, stagger: 0.07, ease: EASE.out }, t + 0.32)
                  if (icon) {
                    tl!.fromTo(icon, { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2.6)', transformOrigin: '50% 60%' }, t + 0.36)
                  }
                })
                tl.fromTo(cta, { autoAlpha: 0, scale: 0.85, y: 20 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.8)' }, fr[3] * D + 0.9)
              }

              timeline()

              // The reflowed path depends on where the nodes land; rebuild it on resize.
              let resizeTimer = 0
              const onResize = () => {
                if (desktop) return
                clearTimeout(resizeTimer)
                resizeTimer = window.setTimeout(() => {
                  const progress = tl?.scrollTrigger?.progress ?? 0
                  tl?.scrollTrigger?.kill()
                  tl?.kill()
                  splits.splice(0).forEach((sp) => sp.revert())
                  timeline()
                  ScrollTrigger.refresh()
                  if (tl?.scrollTrigger) tl.progress(progress)
                }, 250)
              }
              window.addEventListener('resize', onResize)
              return () => {
                window.removeEventListener('resize', onResize)
                clearTimeout(resizeTimer)
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
    <section id="process" ref={root} className={s.process} aria-labelledby="process-title">
      <span className={s.uProbe} data-u aria-hidden="true" />

      <svg className={`${s.tape} ${s.tapeTR}`} viewBox="0 0 489.586 560.885" data-tape aria-hidden="true">
        <path className={s.tapeBand} d={TAPE_TR} data-band />
        <path className={s.tapeTicks} data-ticks />
        <path className={s.tapeMajor} data-ticks />
        <path id="tape-tr-text" fill="none" data-text-path />
        <text className={s.tapeText}>
          <textPath href="#tape-tr-text" data-marquee>
            {TAPE_TEXT}
          </textPath>
        </text>
      </svg>
      <svg className={`${s.tape} ${s.tapeBL}`} viewBox="0 0 517.081 675.533" data-tape aria-hidden="true">
        <path className={s.tapeBand} d={TAPE_BL} data-band />
        <path className={s.tapeTicks} data-ticks />
        <path className={s.tapeMajor} data-ticks />
        <path id="tape-bl-text" fill="none" data-text-path />
        <text className={s.tapeText}>
          <textPath href="#tape-bl-text" data-marquee>
            {TAPE_TEXT}
          </textPath>
        </text>
      </svg>

      <svg className={s.paths} viewBox="0 0 2562 3219" data-paths aria-hidden="true">
        <path className={s.toCome} d={FIGMA_PATH} data-tocome />
        <path className={s.done} d={FIGMA_PATH} data-done />
        <g className={s.rider} data-rider>
          <circle r="36" fill={LOAM} stroke={STONE} strokeWidth="9" />
          <path d="M-13 0 C-7 -10 6 -10 15 0 C6 10 -7 10 -13 0 Z" fill={STONE} />
          <path d="M-11 0 H11" stroke={LOAM} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      </svg>

      <div className={s.head}>
        <SectionTag num="03" label="How it works" />
        <h2 id="process-title" className={s.heading} data-heading data-reveal>
          From first visit
          <br />
          to first summer.
        </h2>
      </div>

      <ol className={s.steps}>
        {STEPS.map((st, i) => (
          <li
            key={st.n}
            className={`${s.step} ${st.side === 'left' ? s.left : s.right}`}
            data-step
            style={{ '--nx': st.nx, '--ny': st.ny, '--ty': st.ty } as React.CSSProperties}
          >
            <span className={s.node} data-node aria-hidden="true">
              <span className={s.nodeFill} data-node-fill />
              <span className={s.nodeNum} data-node-num>
                {st.n}
              </span>
            </span>
            <div className={s.text}>
              <span className={s.chip} data-chip>
                {st.chip}
              </span>
              <h3 className={s.title} data-title data-reveal>
                <span className="sr-only">Step {i + 1}: </span>
                {st.title[0]}{' '}
                {st.title[1] ? (
                  <>
                    <StepIcon kind={st.icon} className={s.icon} /> {st.title[1]}
                  </>
                ) : (
                  <StepIcon kind={st.icon} className={s.icon} />
                )}
              </h3>
              <p className={s.body} data-body data-reveal>
                {st.body}
              </p>
              {i === STEPS.length - 1 && (
                <div className={s.cta} data-cta>
                  <PillCta href="#enquiry" labelSize={40.458} onClick={(e) => scrollToHash(e, '#enquiry')}>
                    Book the first visit
                  </PillCta>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
