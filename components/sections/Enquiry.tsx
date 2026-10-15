'use client'

import Image from 'next/image'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, EASE, useGSAP } from '@/lib/gsap'
import { BREAKPOINTS, fontsReady } from '@/lib/ready'
import { fadeUpLines, reduceReveal, revealLines, scriptWrite, tagIn } from '@/lib/motion'
import { useSite } from '@/lib/store'
import { signature } from '@/lib/script-paths'
import { SectionTag } from '@/components/ui/SectionTag'
import { PillCta } from '@/components/ui/PillCta'
import { ScriptWord } from '@/components/ui/ScriptWord'
import s from './Enquiry.module.css'

type Option = { id: string; title: string; sub?: string }

const STEP_LABELS = ['Project', 'Budget', 'Size', 'Timing', 'Your details']

const PLANS: Option[] = [
  { id: 'patio', title: 'New patio or paving', sub: 'Terraces, paths, steps' },
  { id: 'planting', title: 'Planting and borders', sub: 'New beds and schemes' },
  { id: 'redesign', title: 'Full redesign', sub: 'Layout, levels, the lot' },
  { id: 'lighting', title: 'Garden lighting', sub: 'Paths, trees, terraces' },
  { id: 'else', title: 'Something else', sub: 'Tell us at the end' },
]

const BUDGETS: Option[] = [
  { id: 'under10', title: 'Under £10k', sub: 'A small refresh' },
  { id: '10to20', title: '£10k to £20k', sub: 'The refresh' },
  { id: '20to40', title: '£20k to £40k', sub: 'The redesign' },
  { id: '40plus', title: '£40k+', sub: 'Design and build' },
]

const SIZES: Option[] = [
  { id: 'small', title: 'Small', sub: 'Under 50m²' },
  { id: 'medium', title: 'Medium', sub: '50 to 150m²' },
  { id: 'large', title: 'Large', sub: '150m²+' },
  { id: 'unsure', title: 'Not sure', sub: 'We’ll measure up' },
]

const TIMINGS: Option[] = [
  { id: 'asap', title: 'As soon as possible' },
  { id: '3m', title: 'In the next 3 months' },
  { id: '6m', title: 'In the next 6 months' },
  { id: 'planning', title: 'Just planning for now' },
]

const budgetOption = (k: number) => (k < 10 ? 'under10' : k < 20 ? '10to20' : k < 40 ? '20to40' : '40plus')

type Details = { name: string; email: string; phone: string; postcode: string; message: string }
type Photo = { file: File; url: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i

export default function Enquiry() {
  const root = useRef<HTMLElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const fromHeight = useRef<number | null>(null)
  const [step, setStep] = useState(0) // 0..4, 5 = sent
  const [plans, setPlans] = useState<string[]>([])
  const [budget, setBudget] = useState<string | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const [timing, setTiming] = useState<string | null>(null)
  const [details, setDetails] = useState<Details>({ name: '', email: '', phone: '', postcode: '', message: '' })
  const [photos, setPhotos] = useState<Photo[]>([])
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  const busy = useRef(false)

  /* ---------- section entrance ---------- */
  useGSAP(
    (context) => {
      const el = root.current!
      let mm: gsap.MatchMedia | undefined
      let cancelled = false
      fontsReady().then(() => {
        if (cancelled) return
        context.add(() => {
          mm = gsap.matchMedia()
          mm.add({ motion: BREAKPOINTS.motion, reduce: BREAKPOINTS.reduce }, (ctx) => {
            const card = el.querySelector('[data-form]')
            const contact = el.querySelectorAll('[data-contact] > *')
            const note = el.querySelector('[data-note]')
            if ((ctx.conditions as Record<string, boolean>).reduce) {
              reduceReveal(el, [card!, note!])
              return
            }
            gsap.set([card, note, ...Array.from(contact)], { autoAlpha: 0 })
            gsap
              .timeline({ scrollTrigger: { trigger: el, start: 'top 70%', once: true } })
              .add(tagIn(el.querySelector('[data-tag]')), 0)
              .add(revealLines(el.querySelector('[data-heading]')!, { stagger: 0.1, duration: 1.2 }), 0.1)
              .add(fadeUpLines(el.querySelector('[data-intro]')!), 0.4)
              .fromTo(contact, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.1 }, 0.55)
              .fromTo(
                card,
                { y: 80, autoAlpha: 0, clipPath: 'inset(12% 4% 0% 4% round 36px)' },
                { y: 0, autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.3, ease: EASE.inOut, clearProps: 'clipPath' },
                0.2,
              )
              .fromTo(note, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 1.1)
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

  const { contextSafe } = useGSAP({ scope: root })

  /* ---------- step transitions: out, swap, measure, in ---------- */
  const transition = contextSafe((to: number) => {
    const card = cardRef.current
    if (!card || busy.current) return
    busy.current = true
    setError('')
    setTouched(false)
    const reduce = window.matchMedia(BREAKPOINTS.reduce).matches
    fromHeight.current = card.offsetHeight
    const dir = to > step ? 1 : -1
    const out = card.querySelectorAll('[data-anim]')
    gsap.to(out, {
      y: -30 * dir,
      autoAlpha: 0,
      duration: reduce ? 0.2 : 0.4,
      ease: EASE.inOut,
      stagger: reduce ? 0 : 0.03,
      onComplete: () => setStep(to),
    })
  })

  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card || fromHeight.current === null) return
    const reduce = window.matchMedia(BREAKPOINTS.reduce).matches
    const from = fromHeight.current
    fromHeight.current = null
    const to = card.offsetHeight
    const ctx = gsap.context(() => {
      gsap.fromTo(card, { height: from }, {
        height: to,
        duration: reduce ? 0 : 0.7,
        ease: EASE.inOut,
        clearProps: 'height',
        // the page got taller or shorter; triggers below (the footer) need new positions
        onComplete: () => ScrollTrigger.refresh(),
      })
      const incoming = card.querySelectorAll('[data-anim]')
      gsap.fromTo(
        incoming,
        { y: reduce ? 0 : 30, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: reduce ? 0.3 : 0.75,
          ease: EASE.out,
          stagger: reduce ? 0 : 0.06,
          delay: reduce ? 0 : 0.12,
          onComplete: () => {
            busy.current = false
          },
        },
      )
      // Thank-you: the check draws itself, then James signs off.
      if (step === 5) {
        const check = card.querySelector<SVGSVGElement>('[data-check]')
        const sig = card.querySelector<SVGSVGElement>('[data-script]')
        if (check && !reduce) {
          gsap.fromTo(check.querySelector('circle'), { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.9, ease: EASE.inOut, delay: 0.2 })
          gsap.fromTo(check.querySelector('path'), { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.55, ease: EASE.out, delay: 0.85 })
        }
        if (sig && !reduce) scriptWrite(sig, 'script-writing', { duration: 1.3 }).delay(1.15)
      }
    }, card)
    return () => ctx.kill()
  }, [step])

  // Budget step pre-selects from the price tape.
  useEffect(() => {
    if (step === 1 && budget === null) setBudget(budgetOption(useSite.getState().budget))
  }, [step, budget])

  // Clean up preview URLs
  const photosRef = useRef(photos)
  photosRef.current = photos
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), [])

  const detailErrors = {
    name: details.name.trim().length < 2 ? 'Please add your name.' : '',
    email: !EMAIL.test(details.email.trim()) ? 'Please add a valid email.' : '',
    phone: details.phone.replace(/\D/g, '').length < 10 ? 'Please add a phone number.' : '',
    postcode: !POSTCODE.test(details.postcode.trim()) ? 'Please add a UK postcode.' : '',
  }

  const validity = [
    plans.length > 0 ? '' : 'Pick at least one so James knows where to start.',
    budget ? '' : 'Pick the closest budget.',
    size ? '' : 'Pick the closest size. Not sure is fine.',
    timing ? '' : 'Pick when you’d like it built.',
    Object.values(detailErrors).find(Boolean) ?? '',
  ]
  const valid = step < 5 && !validity[step]

  const shake = contextSafe(() => {
    if (!nextRef.current) return
    gsap.fromTo(
      nextRef.current,
      { x: 0 },
      { keyframes: { x: [0, -6, 6, -6, 6, -6, 6, 0] }, duration: 0.5, ease: 'none', overwrite: true },
    )
  })

  const next = () => {
    if (!valid) {
      setError(validity[step])
      setTouched(true)
      shake()
      return
    }
    if (step === 4) {
      const payload = {
        plans,
        budget,
        size,
        timing,
        ...details,
        photos: photos.map((p) => ({ name: p.file.name, size: p.file.size, type: p.file.type })),
        tapeBudget: `£${useSite.getState().budget}k`,
        sentAt: new Date().toISOString(),
      }
      console.log('Hartwell enquiry', payload)
      transition(5)
      return
    }
    transition(step + 1)
  }

  const onFiles = (list: FileList | null) => {
    if (!list) return
    const add = Array.from(list)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 8 - photos.length)
      .map((file) => ({ file, url: URL.createObjectURL(file) }))
    setPhotos((p) => [...p, ...add])
  }

  const removePhoto = (i: number) =>
    setPhotos((p) => {
      URL.revokeObjectURL(p[i].url)
      return p.filter((_, k) => k !== i)
    })

  const field = (key: keyof Details, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
    const err = key in detailErrors ? detailErrors[key as keyof typeof detailErrors] : ''
    return (
      <label className={s.field} data-anim>
        <span className={s.fieldLabel}>{label}</span>
        <input
          className={s.input}
          value={details[key]}
          onChange={(e) => setDetails((d) => ({ ...d, [key]: e.target.value }))}
          aria-invalid={touched && !!err}
          {...props}
        />
      </label>
    )
  }

  const choice = (
    name: string,
    options: Option[],
    selected: string[] | string | null,
    onPick: (id: string) => void,
    multi = false,
  ) => (
    <div className={s.options} role={multi ? 'group' : 'radiogroup'}>
      {options.map((o) => {
        const checked = Array.isArray(selected) ? selected.includes(o.id) : selected === o.id
        return (
          <label key={o.id} className={s.tile} data-anim>
            <input
              className="sr-only"
              type={multi ? 'checkbox' : 'radio'}
              name={name}
              value={o.id}
              checked={checked}
              onChange={() => onPick(o.id)}
            />
            <span className={s.radio} aria-hidden="true" />
            <span>
              <span className={s.tileTitle}>{o.title}</span>
              {o.sub && <span className={s.tileSub}>{o.sub}</span>}
            </span>
          </label>
        )
      })}
    </div>
  )

  const QUESTIONS = [
    { q: ['What are you', 'planning?'], help: 'Pick as many as you like. It helps James plan the visit.' },
    { q: ['Roughly what would you', 'like to spend?'], help: 'Not sure? Pick the closest. It just helps James bring the right ideas to the visit.' },
    { q: ['How big is', 'the garden?'], help: 'A rough guess is fine. James measures up properly on the visit.' },
    { q: ['When would you', 'like it built?'], help: 'Spring and summer book up first, so earlier is easier.' },
    { q: ['Last bit:', 'your details.'], help: 'James reads every one himself. Photos of the garden help, but are optional.' },
  ]

  return (
    <section id="enquiry" ref={root} className={`${s.enquiry} on-dark`} aria-labelledby="enquiry-title">
      <div>
        <SectionTag num="05" label="Start your garden" tone="dark" />
        <h2 id="enquiry-title" className={s.heading} data-heading data-reveal>
          Tell us about
          <br />
          your garden.
        </h2>
        <p className={s.intro} data-intro data-reveal>
          Five quick questions, about a minute. James reads every one himself and calls you back within one working day.
        </p>
        <div className={s.contact} data-contact>
          <div className={s.james}>
            <span className={s.avatar}>
              <Image src="/images/avatar-james.png" alt="James Hartwell" fill sizes="64px" />
            </span>
            <span>
              <span className={s.jamesName} style={{ display: 'block' }}>
                James Hartwell
              </span>
              <span className={s.jamesRole} style={{ display: 'block' }}>
                Founder, on site every week
              </span>
            </span>
          </div>
          <div>
            <a className={s.phone} href="tel:01483210448">
              01483 210 448
            </a>
            <br />
            <a className={s.email} href="mailto:hello@hartwellgardens.co.uk">
              hello@hartwellgardens.co.uk
            </a>
          </div>
        </div>
      </div>

      <div className={s.formCol}>
        <div className={s.card} ref={cardRef} data-form data-reveal>
          <form
            className={s.cardInner}
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              next()
            }}
            aria-label="Garden enquiry"
          >
            {step < 5 && (
              <div aria-live="polite">
                <div className={s.progressTop}>
                  <span>Step {step + 1} of 5</span>
                  <span>About a minute</span>
                </div>
                <div className={s.bar} aria-hidden="true">
                  {STEP_LABELS.map((l, i) => (
                    <span key={l} className={s.seg} data-on={i <= step}>
                      <span className={s.segFill} />
                    </span>
                  ))}
                </div>
                <div className={s.labels} aria-hidden="true">
                  {STEP_LABELS.map((l, i) => (
                    <span key={l} data-state={i < step ? 'done' : i === step ? 'current' : 'next'}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {step < 5 ? (
              <div className={s.pane} key={step}>
                <fieldset className={s.fieldset}>
                  <legend data-anim>
                    <span className={s.question} style={{ display: 'block' }}>
                      {QUESTIONS[step].q[0]}
                      <br />
                      {QUESTIONS[step].q[1]}
                    </span>
                    <span className={s.help} style={{ display: 'block' }}>
                      {QUESTIONS[step].help}
                    </span>
                  </legend>
                  <div style={{ marginTop: 'calc(44 * var(--u))' }}>
                    {step === 0 &&
                      choice('plans', PLANS, plans, (id) => setPlans((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), true)}
                    {step === 1 && choice('budget', BUDGETS, budget, setBudget)}
                    {step === 2 && choice('size', SIZES, size, setSize)}
                    {step === 3 && choice('timing', TIMINGS, timing, setTiming)}
                    {step === 4 && (
                      <div className={s.fields}>
                        {field('name', 'Name', { autoComplete: 'name', placeholder: 'Your name' })}
                        {field('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'you@example.com' })}
                        {field('phone', 'Phone', { type: 'tel', autoComplete: 'tel', placeholder: '07700 900123' })}
                        {field('postcode', 'Postcode', { autoComplete: 'postal-code', placeholder: 'GU7 1AA' })}
                        <div className={s.fieldWide} data-anim>
                          <span className={s.fieldLabel}>Photos of the garden (optional)</span>
                          <div className={s.upload}>
                            <label className={s.uploadBtn}>
                              <input
                                className="sr-only"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                  onFiles(e.target.files)
                                  e.target.value = ''
                                }}
                              />
                              <span aria-hidden="true">+</span> Add photos
                            </label>
                            {photos.map((p, i) => (
                              <span key={p.url} className={s.thumb}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.url} alt={`Photo ${i + 1}: ${p.file.name}`} />
                                <button type="button" className={s.thumbRemove} aria-label={`Remove ${p.file.name}`} onClick={() => removePhoto(i)}>
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                        <label className={s.fieldWide} data-anim>
                          <span className={s.fieldLabel}>Anything else (optional)</span>
                          <textarea
                            className={s.input}
                            value={details.message}
                            placeholder="Access, slopes, the bit you hate looking at..."
                            onChange={(e) => setDetails((d) => ({ ...d, message: e.target.value }))}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </fieldset>

                <div className={s.formNav} data-anim>
                  <p className={s.error} role="alert">
                    {error}
                  </p>
                  <button type="button" className={s.back} hidden={step === 0} onClick={() => transition(step - 1)}>
                    {'←  Back'}
                  </button>
                  <PillCta
                    ref={nextRef}
                    type="submit"
                    labelSize={46}
                    aria-disabled={!valid}
                  >
                    {step === 4 ? 'Send to James' : 'Next question'}
                  </PillCta>
                </div>
              </div>
            ) : (
              <div className={s.done} role="status">
                <svg className={s.check} viewBox="0 0 120 120" data-check data-anim aria-hidden="true">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="var(--loam)" strokeWidth="4" />
                  <path d="M37 62 L53 77 L84 44" fill="none" stroke="var(--loam)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className={s.doneTitle} data-anim>
                  Thanks. James will call you within one working day.
                </p>
                <div data-anim>
                  <ScriptWord word={signature} className={s.signature} />
                  <span className="sr-only">James Hartwell</span>
                </div>
              </div>
            )}
          </form>
        </div>
        <p className={s.note} data-note>
          No sales calls, no mailing list. Just James.
        </p>
      </div>
    </section>
  )
}
