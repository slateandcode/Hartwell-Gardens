'use client'

import { gsap, SplitText, EASE } from './gsap'

/*
  Reusable motion building blocks. Each returns a paused-friendly timeline so
  callers can place it on their own timeline with a position parameter, or
  attach a scrollTrigger to it.
*/

type SplitOpts = {
  stagger?: number
  duration?: number
  /** Revert the split once the reveal has played (default true). */
  revert?: boolean
}

function show(el: Element | Element[]) {
  gsap.set(el, { visibility: 'visible' })
}

/** Masked line rise: each line slides up from behind its own clip. */
export function revealLines(target: Element, { stagger = 0.1, duration = 1.15, revert = true }: SplitOpts = {}) {
  if (target.querySelector('.desk-br') && window.matchMedia('(max-width: 767px)').matches) {
    return riseWords(target, { stagger: Math.min(stagger, 0.06), duration: duration * 0.9, revert })
  }
  const split = SplitText.create(target, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'split-line',
    aria: 'none',
  })
  show(target)
  const tl = gsap.timeline({ onComplete: () => void (revert && split.revert()) })
  tl.fromTo(split.lines, { yPercent: 112 }, { yPercent: 0, duration, stagger, ease: EASE.out })
  return tl
}

/** Lines fade up softly (for body copy, where a hard mask feels heavy). */
export function fadeUpLines(target: Element, { stagger = 0.08, duration = 1, revert = true }: SplitOpts = {}) {
  const split = SplitText.create(target, { type: 'lines', linesClass: 'split-line', aria: 'none' })
  show(target)
  const tl = gsap.timeline({ onComplete: () => void (revert && split.revert()) })
  tl.fromTo(
    split.lines,
    { y: '0.9em', opacity: 0, filter: 'blur(6px)' },
    { y: 0, opacity: 1, filter: 'blur(0px)', duration, stagger, ease: EASE.out, clearProps: 'filter' },
  )
  return tl
}

/** Words rise from masks, one after another. */
export function riseWords(target: Element, { stagger = 0.06, duration = 1, revert = true }: SplitOpts = {}) {
  const split = SplitText.create(target, {
    type: 'words',
    mask: 'words',
    wordsClass: 'split-word',
    aria: 'none',
  })
  show(target)
  const tl = gsap.timeline({ onComplete: () => void (revert && split.revert()) })
  tl.fromTo(split.words, { yPercent: 115, rotate: 4 }, { yPercent: 0, rotate: 0, duration, stagger, ease: EASE.out })
  return tl
}

/** Words fade up with a slight blur, staggered (quotes, captions). */
export function wordFadeUp(target: Element, { stagger = 0.035, duration = 0.9, revert = true }: SplitOpts = {}) {
  const split = SplitText.create(target, { type: 'words', wordsClass: 'split-word', aria: 'none' })
  show(target)
  const tl = gsap.timeline({ onComplete: () => void (revert && split.revert()) })
  tl.fromTo(
    split.words,
    { y: '0.5em', opacity: 0, filter: 'blur(4px)' },
    { y: 0, opacity: 1, filter: 'blur(0px)', duration, stagger, ease: EASE.out, clearProps: 'filter' },
  )
  return tl
}

/** The ERA letter: chars arrive tall, translucent and blurred, and settle. */
export function charRise(
  chars: Element[],
  { stagger = 0.045, duration = 1.1 }: { stagger?: number; duration?: number } = {},
) {
  return gsap.fromTo(
    chars,
    { yPercent: 35, scaleY: 1.8, opacity: 0, filter: 'blur(10px)', transformOrigin: '50% 100%' },
    {
      yPercent: 0,
      scaleY: 1,
      opacity: 1,
      filter: 'blur(0px)',
      duration,
      stagger,
      ease: EASE.out,
      clearProps: 'filter',
    },
  )
}

/** Image reveal: the frame opens with clip-path while the image settles from 1.15. */
export function clipReveal(
  frame: Element,
  image: Element | null,
  { from = 'inset(100% 0% 0% 0%)', duration = 1.3, scale = 1.15 }: { from?: string; duration?: number; scale?: number } = {},
) {
  show(frame)
  const tl = gsap.timeline()
  tl.fromTo(frame, { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0%)', duration, ease: EASE.inOut })
  if (image) tl.fromTo(image, { scale }, { scale: 1, duration: duration + 0.3, ease: EASE.inOut }, 0)
  return tl
}

/** Section tag: the number pops, then the label slides out from behind it. */
export function tagIn(tag: Element | null) {
  const tl = gsap.timeline()
  if (!tag) return tl
  const num = tag.querySelector('[data-tag-num]')
  const label = tag.querySelector('[data-tag-label]')
  show(tag)
  tl.fromTo(num, { scale: 0, rotate: -40 }, { scale: 1, rotate: 0, duration: 0.8, ease: 'back.out(1.8)' })
  tl.fromTo(
    label,
    { xPercent: -55, opacity: 0, clipPath: 'inset(0% 0% 0% 40% round 100px)' },
    { xPercent: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 100px)', duration: 0.9, ease: EASE.out },
    '<0.2',
  )
  return tl
}

/** Count a number up inside an element, keeping any prefix/suffix. */
export function countUp(
  el: Element,
  to: number,
  { prefix = '', suffix = '', duration = 1.6 }: { prefix?: string; suffix?: string; duration?: number } = {},
) {
  const state = { v: 0 }
  el.textContent = `${prefix}0${suffix}`
  return gsap.to(state, {
    v: to,
    duration,
    ease: EASE.inOut,
    onUpdate: () => {
      el.textContent = `${prefix}${Math.round(state.v)}${suffix}`
    },
  })
}

/** Pop in with a little bounce (buttons, chips). */
export function popIn(target: gsap.TweenTarget, { rotate = 0, duration = 0.8 }: { rotate?: number; duration?: number } = {}) {
  show(target as Element)
  return gsap.fromTo(
    target,
    { scale: 0.6, opacity: 0, rotate },
    { scale: 1, opacity: 1, rotate: 0, duration, ease: 'back.out(2)' },
  )
}

/**
 * Splitting into chars drops kerning between them. Measure each pair on a
 * canvas (which kerns) and give the first char the difference as a margin.
 */
export function preserveKerning(chars: HTMLElement[]) {
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return
  for (let i = 0; i < chars.length - 1; i++) {
    const a = chars[i]
    const b = chars[i + 1]
    if (a.parentElement !== b.parentElement || !a.textContent || !b.textContent) continue
    const cs = getComputedStyle(a)
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    ;(ctx as CanvasRenderingContext2D & { fontKerning: string }).fontKerning = 'normal'
    const pair = ctx.measureText(a.textContent + b.textContent).width
    const apart = ctx.measureText(a.textContent).width + ctx.measureText(b.textContent).width
    const kern = pair - apart
    if (Math.abs(kern) > 0.05) a.style.marginRight = `${kern}px`
  }
}

/**
 * Handwriting for a ScriptWord: each glyph outline draws on left to right,
 * its fill follows, and a feathered mask wipes across the word.
 */
export function scriptWrite(svg: SVGSVGElement, maskClass: string, { duration = 1.1 }: { duration?: number } = {}) {
  const paths = Array.from(svg.querySelectorAll('path'))
  const each = (duration - 0.45) / Math.max(1, paths.length - 1)
  svg.classList.add(maskClass)
  gsap.set(svg, { '--wipe': '-14%' })
  gsap.set(paths, { fillOpacity: 0, stroke: 'currentColor', strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' })
  const tl = gsap.timeline({
    onComplete: () => {
      svg.classList.remove(maskClass)
      gsap.set(paths, { clearProps: 'all' })
    },
  })
  tl.to(svg, { '--wipe': '114%', duration: duration + 0.15, ease: 'power2.inOut' }, 0)
  tl.fromTo(paths, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.55, ease: 'power1.inOut', stagger: each }, 0)
  tl.to(paths, { fillOpacity: 1, duration: 0.5, ease: 'power1.out', stagger: each }, 0.3)
  tl.to(paths, { strokeWidth: 0, duration: 0.4, ease: 'none', stagger: each }, 0.75)
  return tl
}

/** Reduced motion: no travel, no scrub, just a short fade on everything held back. */
export function reduceReveal(scope: Element, extra: Element[] = []) {
  const held = [...Array.from(scope.querySelectorAll('[data-reveal]')), ...extra]
  return gsap.fromTo(held, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'none' })
}
