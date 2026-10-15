# Hartwell Gardens: build brief for Claude Code

You are building a demo website for **Hartwell Gardens**, a fictional design-and-build landscaping company in Surrey and Hampshire, UK. It is a showcase piece for Slate & Code (a web design studio) to show UK landscapers what a premium site looks like. The design is finished in Figma. Your job is to build it pixel-faithfully in code and, above all, to make the motion feel like a top-tier studio site. Motion is the point of this build. Read the whole brief before writing any code.

---

## 1. Stack and setup

- Next.js (latest, App Router) + React + TypeScript.
- Dev server **must run on port 3299**: set `"dev": "next dev -p 3299"` in package.json. The site lives at `http://localhost:3299`.
- Styling: Tailwind CSS v4 (or CSS modules if you prefer, but be consistent). Design tokens as CSS variables.
- Motion: **GSAP 3.13+** from npm (`gsap`), which now includes every plugin for free. Use `SplitText`, `ScrollTrigger`, `DrawSVGPlugin`, `MotionPathPlugin`, `CustomEase`. Use `@gsap/react` and the `useGSAP()` hook for every animated component so everything is scoped and cleaned up.
- Smooth scroll: **Lenis**, wired into the GSAP ticker (`lenis.on('scroll', ScrollTrigger.update)` and `gsap.ticker.add(t => lenis.raf(t * 1000))`, `gsap.ticker.lagSmoothing(0)`).
- Images via `next/image`. Single page (`/`) for now.

These are the same tools both reference sites use (era-residence.com and two26.studio both run GSAP + SplitText + ScrollTrigger + Lenis, and two26 adds DrawSVG + MotionPath for its step path). That is deliberate: copy their technique, not their content.

---

## 2. Source of truth: the Figma file

File key: `SniyFJSrl5e6JelsalvCYN`
URL: https://www.figma.com/design/SniyFJSrl5e6JelsalvCYN/Hartwell-Gardens

If the Figma MCP is available, call `get_design_context` and `get_screenshot` on each node below before building that section, and pull the image assets from it. If not, I will export the images into `/public/images` for you; ask me.

Build **only these frames, in this order**. Ignore every other frame in the file (old versions, "About v1", "Desktop - 4", blank frames and duplicates).

| # | Section | Node ID | Background |
|---|---|---|---|
| 0 | Hero (with intro) | `5:2` | Moss + hedge texture |
| 1 | About ("01") | `33:2` | Stone |
| 2 | Services ("02") | `33:45` | Stone |
| 3 | Featured garden (before/after) | `25:2` | Moss |
| 4 | How it works ("03") | `37:2` | Stone |
| 5 | What it costs ("04") | `38:2` | Stone |
| 6 | Enquiry + footer ("05") | `39:2` | Moss |

**Scale:** the Figma frames are drawn 2562px wide. Treat 2562px as the 1440px desktop layout (multiply Figma px values by ~0.562). Make the layout fluid with `clamp()` so it holds from 1280px to 1920px, then build proper tablet and mobile layouts (section 9).

### Design tokens

```
--stone:  #EEE8DC   (light background)
--moss:   #2E3A28   (dark background, primary text)
--loam:   #7B5236   (accent: CTAs on light, highlights, the "done" path)
--sage:   #B8BD9F   (tape measures, badges, surfaces only, never text)
--chip:   #E2DBCB   (section tag chips on stone)
--card:   #F6F2EA   (light cards)
--sand:   #D9D1C0   ("upcoming" step nodes)
```

### Fonts

The Figma file uses stand-in fonts in some layers (layer names say "swap to ..."). Use the real fonts:

- **Gambarino** (Fontshare, free): all display serif. Headings, wordmark, card titles, prices, step titles. Wherever Figma shows *Instrument Serif*, use Gambarino.
- **Neue Montreal** (Pangram Pangram): all sans. Body, nav, chips, buttons, the big About statement. Wherever Figma shows *Instrument Sans*, use Neue Montreal. I will put the .woff2 files in `/public/fonts`; load them with `next/font/local`. Until they're there, fall back to `Inter`.
- **Pinyon Script** (Google Fonts, `next/font/google`): only the word "Landscaping" under the hero wordmark and the "James Hartwell" signature.

**Important:** SplitText must run after fonts load. Await `document.fonts.ready` before splitting, then call `ScrollTrigger.refresh()`. Otherwise line splits will be wrong.

---

## 3. Motion philosophy (read this twice)

This is not a "fade things in on scroll" site. Nothing should just pop, fade or slide into place generically. Every movement should feel physical and intentional, like a high-end studio built it. Rules:

1. **Slow, fast, slow.** The default curve for anything that travels is a strong ease-in-out: it starts gently, moves quickly through the middle and lands softly. Register these with `CustomEase` and use them everywhere instead of GSAP defaults:
   - `hw.inOut` = `cubic-bezier(0.76, 0, 0.24, 1)`: travel, reveals, big moves (the signature curve)
   - `hw.out` = `cubic-bezier(0.16, 1, 0.3, 1)`: things arriving (text rising, cards landing)
   - `hw.soft` = `cubic-bezier(0.65, 0, 0.35, 1)`: hovers and small state changes
   - For physical landings use a gentle overshoot (`back.out(1.4)` or a custom ease that goes ~3% past and settles). Never `linear` except when scrubbed to scroll, and never the browser default `ease`.
2. **Durations:** hovers 0.35 to 0.5s, UI changes 0.6 to 0.8s, hero and section reveals 1.0 to 1.6s. Longer and slower beats cheaper.
3. **Overlap everything.** Use timeline position parameters (`"<0.15"`, `"-=0.4"`) so the next element starts before the previous one finishes. Sequential one-after-another motion looks amateur.
4. **Stagger with intent.** Text by characters, words or lines (via SplitText), cards from the centre outward (`stagger: { each: 0.08, from: "center" }`), lists top-down.
5. **Reveal, don't fade.** Text rises from behind a mask (split into lines, wrap each in `overflow: hidden`, animate `yPercent: 110 → 0`). Images reveal with `clip-path: inset()` while the image inside counter-scales from 1.15 to 1. Opacity alone is the weakest tool; pair it with motion or blur.
6. **Follow-through.** Things that land settle: a card rotates 2 to 3 degrees past its final angle and eases back. Things that travel come from somewhere meaningful (cards deal out of a stack, a wordmark glides to its home).
7. **Scroll-scrubbed moments** use `scrub: 0.8 to 1.2` for smoothing, so they feel like they're on a damped spring, not glued to the scrollbar.
8. **Only animate transforms, opacity, clip-path and filter.** Never width, height, top or left. Use `will-change` only during animation.
9. **`prefers-reduced-motion`:** no pinning, no scrubbing, no intro. Show final states with a simple 0.4s opacity fade.

---

## 4. Section 0: Hero intro (the most important part, build and nail this first)

**Reference:** https://www.era-residence.com/ (watch how it opens). Their intro: a solid colour screen with a thin inset border, a wordmark whose letters arrive one by one from a tall, stretched, translucent, blurred state (later letters are still stretched while earlier ones have settled), a script word that writes itself in, spaced side words, a tagline at the bottom, then a reveal into the full photographic hero while the wordmark stays. Ours is the same idea, **shorter (about 3.5s total)** and built from our own design.

The final state is Figma node `5:2`: a moss background with a subtle hedge texture, nav on top, the "HARTWELL / GARDENS" wordmark with "Landscaping" in script under it, an arc of six tilted project cards (Cobham, Farnham, Alresford, Haslemere, Godalming, Petersfield) each with a caption chip ("Cobham · £38k · 5 weeks"), then the headline "We build gardens that get better with age.", a short paragraph and the "Start your garden" CTA.

### Intro timeline (one GSAP timeline, times are start positions)

| Time | What happens |
|---|---|
| 0.00 | Screen is solid moss. A 1px stone border (35% opacity), inset ~40px from the viewport edges, **draws itself**: an SVG rect with DrawSVG from `0% 0%` to `0% 100%`, 0.8s `hw.inOut`. |
| 0.20 | "SURREY" (left) and "HAMPSHIRE" (right), small spaced serif caps at vertical centre: letter-spacing tightens from `1.2em` to `0.45em` while fading from 0 to 85%, 1.0s `hw.out`. |
| 0.30 | **"HARTWELL" chars** (SplitText `chars`), centred in the viewport, not yet at their hero position: each char from `yPercent: 35, scaleY: 1.8, opacity: 0, filter: blur(10px)`, `transformOrigin: "50% 100%"`, to its normal state. 1.1s `hw.out`, `stagger: 0.045`. This is the ERA letter effect. |
| 0.55 | **"GARDENS" chars**, same treatment. |
| 1.10 | **"Landscaping" writes itself** left to right: animate a `clip-path: inset(0 100% 0 0)` to `inset(0 0% 0 0)` over 1.1s `power2.inOut`, with a soft feathered leading edge (a CSS mask gradient on a wrapper works). If you can convert the word to an SVG path (Figma: outline the text and export as SVG), do a real handwriting draw with DrawSVG plus a fill fade at the end. That is the premium version, so try it. |
| 1.30 | Tagline at the bottom ("GARDEN DESIGN AND BUILD · EST. 2009", tiny spaced sans) rises in, 0.8s `hw.out`. |
| 2.00 | **The reveal** (our version of ERA's arch opening): the border scales outward past the viewport and fades (1.0s `hw.inOut`). The side words drift ~120px outward and fade. The tagline fades down. The **hedge texture background** fades in from `scale 1.12, opacity 0` to `scale 1, opacity 1` (1.4s `hw.inOut`). The **wordmark glides from the viewport centre to its hero position** with a FLIP (`gsap.Flip` or a measured x/y + scale tween), 1.2s `hw.inOut`. |
| 2.45 | **The cards deal out.** All six start stacked in the centre under the wordmark at `scale: 0.55, rotation: 0, opacity: 0`, slightly overlapping like a deck. Each flies to its arc position and its final rotation from Figma (roughly -8, -17, -8, +8, +18, +18 degrees), `stagger: { each: 0.08, from: "center" }`, 1.15s. Each card overshoots its final rotation by about 3 degrees and settles back (a second tiny tween, or a custom ease). They should feel dealt by a hand, not slid on rails. |
| 2.90 | Nav drops in from `yPercent: -100` (0.8s `hw.out`). Headline lines rise from masks (`stagger: 0.1`), then the paragraph lines, then the CTA (scale 0.9 to 1 plus fade). |
| ~3.6 | Done. Scrolling unlocks (lock scroll with Lenis `stop()` during the intro, `start()` at the end). |

Rules for the intro:
- It plays **once per session** (`sessionStorage`). On repeat loads, go straight to the final hero with only the step 2.90 entrance.
- Any click, wheel or key during the intro fast-forwards the timeline to the end (`tl.timeScale(4)` then complete). Never trap the user.
- Preload the hedge texture and card images before starting (a quick promise on `img.decode()`), so nothing pops in half-loaded.

### Hero idle and scroll states (after the intro)

- Cards float gently: each gets its own sine `y` yoyo (±6px, 3 to 4.5s, different delays) so the arc breathes.
- Subtle mouse parallax: cards shift up to ±12px and the wordmark ±4px opposite the cursor, smoothed with `gsap.quickTo`.
- On scroll out of the hero: the card arc moves up faster than the text (parallax) and fans slightly wider (rotations increase ~20%). The wordmark scales down ~8% and fades as the About section arrives.
- **Card hover:** lift `y: -14`, rotation eases to 0, `scale: 1.04`, the image inside zooms to 1.06, and the caption chip background changes stone to loam with the text going stone. 0.5s `hw.soft`. Hovering a card raises its z-index.

---

## 5. Section 1: About (node `33:2`): the fade-up word statement

**Reference:** the "A BIT ABOUT US" statement on https://two26.studio/. The section pins, and as you scroll the paragraph fills in word by word. Unread words are pale; the words at the "reading front" flash the accent colour, then settle into the final dark colour. Small rotated pills pop in over the text as you reach them.

Ours: the big centred statement "We design and build [image pill] gardens across Surrey and Hampshire. Over [180+ badge] finished so far, from tight town plots in [image pill] Godalming to sloping country gardens, all built by one crew [avatar] who stay with you from the first sketch to the last plant in the ground." The last phrase ("from the first sketch to the last plant in the ground.") ends in loam.

- Pin the section (`pin: true`, `end: "+=120%"`, `scrub: 1`).
- SplitText into words. Every word starts at moss 14% opacity, `y: 0.25em`. As scroll progresses, words **fade up** in reading order to full opacity and `y: 0`. The front 3 to 4 words pass through **loam** before settling to moss (do it with a timeline where each word goes pale → loam → moss with an offset stagger). The final phrase settles in loam, not moss.
- The **inline image pills, the badge and the avatar** are part of the reading order. When the front reaches them they scale from 0 with a -10° rotation to 1 / 0° with `back.out(1.8)`. The "180+" counts up from 0 as it appears.
- After the statement completes, the divider plays: the two lines draw outward from the emblem (`scaleX: 0 → 1`, origin at the emblem side), the dots pop, and the "HG" emblem rotates in from -90° with `hw.out`.
- The "01 About" tag and "Learn more ↗" fade in at the start.
- "Learn more" hover: the arrow slides out up and to the right while a copy slides in from the bottom left (an overflow-hidden icon swap). Text colour moss to loam.

---

## 6. Section 2: Services (node `33:45`): clean and controlled

- The "02 Services" tag slides in. The heading "Every part of the garden, under one crew." rises line by line from masks.
- **Big card (Design and build):** clip-path reveal from the bottom (`inset(100% 0 0 0)` to `inset(0)`), 1.3s `hw.inOut`, while its image counter-scales 1.2 to 1. Then its tags and title rise, and the arrow button pops (scale 0 to 1, `back.out`).
- **Small cards:** stagger in from `x: 140, opacity: 0`, `stagger: 0.1`, 1.0s `hw.out`, overlapping the big card's reveal.
- **Carousel:** the small cards are a horizontal track that overflows off the right edge (the "Garden lighting" card is half visible on purpose). Prev and next buttons move the track one card width, 0.9s `hw.inOut`. Also support drag or swipe with inertia. The caption fades in last.
- **Hovers:** card image zooms to 1.05. The "+" button rotates 90° and fills moss (or loam on dark cards). The title nudges up 6px. Big card arrow button: background stone to loam, the arrow turns stone, and the arrow swaps out diagonally as in "Learn more". Nav buttons: the outline one fills moss and its arrow turns stone.

---

## 7. Section 3: Featured garden (node `25:2`): keep the layout, add life

- The headline "A slope nobody used, turned into the best room in the house." rises line by line. The brief fades up. The facts (£52k, 7 weeks, 3) count up from 0. The quote words fade up with a slight stagger.
- **Before/after slider:** a fully working draggable handle (pointer events plus arrow keys, `role="slider"`). Clip the "before" image with `clip-path: inset(0 X% 0 0)` driven by a GSAP `quickTo`, so dragging feels smooth and slightly damped. The first time the slider scrolls into view, do one auto sweep as a hint: 50% to 75% to 30% to 50%, `hw.inOut`, about 2.4s total. Stop the sweep immediately if the user grabs the handle.
- The week strip (Week 1, 4, 7) staggers up after the slider. On hover each thumbnail zooms slightly and its caption chip turns loam.

---

## 8. Section 4: How it works (node `37:2`): the scroll-drawn path (signature section)

**Reference:** the services path on https://two26.studio/ (scroll to "BRAND STRATEGY"). A pale version of the whole path is always visible. As you scroll, a solid path draws over it in the accent colour, and a small object rides at the drawing head. When the head reaches a step, that step comes alive: the title animates, a little sticker icon pops in between its words, and a rotated description pill pops in.

Ours, from Figma node `37:2`:

- One SVG spanning the section, using the **exact path geometry from Figma**. The path enters from the **left edge** at the top, goes down through node 01, makes a **loop** between 01 and 02, then winds through 02, 03, 04 and **exits through the right edge** at the bottom under the step 04 CTA. It must never visibly end inside the section or run into a neighbouring section.
- **Two layers:**
  - "To come": the full path, moss at 10% opacity, 58px stroke at 2562 scale (scale down proportionally), round caps.
  - "Done": the same path in loam, drawn with DrawSVG scrubbed to scroll (`start: "top 70%"`, `end: "bottom 80%"`, `scrub: 1`). In Figma the done part stops at step 02; in code the whole path draws progressively.
- **Rider:** a small loam circle with a stone ring (or a simple little leaf or seed shape) rides the drawing head with MotionPathPlugin on the same progress, auto-rotating with the path.
- **Step triggers:** compute each node's position as a fraction of the path length (sample `getPointAtLength` to find the closest point to each node centre) and put labels in the same scrubbed timeline, so the steps fire exactly when the drawn line reaches them, not on a separate trigger. When the head reaches a node:
  - The node goes sand to moss, with its number turning stone, and pulses `scale 0.7 → 1.12 → 1` (`back.out(2)`).
  - The timing chip pops in rotated from -8° to 0 and from scale 0.8 to 1 (`back.out(2)`), then turns loam.
  - The step title rises word by word from masks, then the body lines fade up.
  - Scrolling back up reverses everything cleanly (all of it lives on the scrubbed timeline).
- **Optional but encouraged (two26's sticker detail):** a small hand-drawn line icon pops in next to each step title (a pencil and plan for The visit, a set square for The design, a spade for The build, a watering can for Aftercare), drawn as simple single-weight SVG line icons in moss with loam fills, popping in with a little bounce. Only do this if they come out genuinely good. No clip-art.
- **Tape measures** (top right and bottom left, sage with moss tick marks): they drift with scroll parallax and rotate a couple of degrees. Bonus: put a `textPath` along each tape with "HARTWELL GARDENS · DESIGN AND BUILD ·" repeating and animate `startOffset` slowly with scroll, like two26's marquee ribbon.
- The step 04 CTA "Book the first visit" pops in after step 04 completes.

---

## 9. Section 5: What it costs (node `38:2`): the tape measure price scale

- The "04 What it costs" tag and heading enter as in Services.
- **The tape measure slides out** from the left edge like a tape being pulled from its case: `x: -100% → 0`, 1.4s `hw.out`. The tick marks stagger in slightly behind the slide. Then the band brackets draw (`scaleX: 0 → 1` from their centres) and the band labels fade up.
- **Budget pin (interactive, a key moment for the reel):** the pin is draggable along the tape (pointer events plus arrow keys, `role="slider"`, `aria-valuetext="£35,000"`), snapping to £1k steps between £5k and £60k. The "Your budget £35k" bubble follows it, and the number tweens as it changes.
  - The active band tint on the tape slides and resizes to the band the pin is in (0.5s `hw.soft`).
  - The matching price card becomes active: its background crossfades to moss, its text to stone, and its chip to loam. The other cards return to the light style. 0.5s `hw.soft`.
  - Below £10k, no band is active. Show a small line under the tape: "Most of our gardens start around £10k. Still worth a chat."
- The three price cards stagger up when the section enters. The "Most booked" chip on the redesign card does a small rotate-pop.
- **Store the slider value** (React context or a small Zustand store). The enquiry form's budget step uses it to pre-select the matching option.
- The closing line rises, and the CTA pops.

---

## 10. Section 6: Enquiry + footer (node `39:2`)

### The click-through enquiry form (functional client-side, no backend)

The form card shows step 2 of 5 in Figma. Build all five steps with React state:

1. **What are you planning?** Multi-select tiles: New patio or paving, Planting and borders, Full redesign, Garden lighting, Something else.
2. **Roughly what would you like to spend?** Four tiles: Under £10k, £10k to £20k, £20k to £40k, £40k+. Pre-selected from the Costs slider value.
3. **How big is the garden?** Small (under 50m²), Medium (50 to 150m²), Large (150m²+), Not sure.
4. **When would you like it built?** As soon as possible, In the next 3 months, In the next 6 months, Just planning for now.
5. **Your details:** name, email, phone, postcode, a photo upload (input type file, multiple, image previews as small rounded thumbnails), optional message. Submit.

Motion and behaviour:
- **Step transition:** the outgoing question and options move up 30px and fade out (0.4s `hw.inOut`). The incoming ones come from 30px below, with the options staggered (0.06s). The card height animates smoothly between steps (measure the content and tween the height; this is the one allowed height animation).
- The **progress bar** segments fill with loam (`scaleX` from the left), and the step labels change colour.
- **Option tiles:** on hover the border goes to loam and the tile lifts 2px. When selected, the background crossfades to moss, the text goes stone and the radio fills loam with a small scale pop.
- "Next question" is disabled until the step is valid. Shake gently (x ±6px, 3 times) if clicked while invalid, and show an inline message.
- **Submit:** `console.log` the payload and show a success state in the card. A loam checkmark draws with DrawSVG, then the text "Thanks. James will call you within one working day."

### Footer
- The columns stagger up. Link hovers: an underline draws from the left (`scaleX`), with the colour going stone to sage.
- **Giant "HARTWELL GARDENS" wordmark** at the bottom, cropped by the bottom edge: when the footer enters, its chars rise from a mask (`yPercent: 100 → 0`, `stagger: 0.03`, 1.2s `hw.out`).
- "Website by Slate & Code" links to https://slateandcode.studio.

---

## 11. Global components and interactions

- **Nav:** hides on scroll down (`yPercent: -100`) and shows on scroll up, 0.5s `hw.inOut`. After the hero, it gets a moss background with a backdrop blur, faded in. Nav link hover is a **text roll**: each link holds two stacked copies of its label in an overflow-hidden box, and on hover both move up 100% (0.45s `hw.soft`) while the colour shifts to sage.
- **Pill CTAs** (the dark pill with the round loam arrow badge, used everywhere): on hover a circle grows from the arrow badge and fills the whole pill (clip-path circle from the badge's centre), changing moss to loam on light sections and stone to moss on dark ones. The label colour flips and the arrow rotates 45°. 0.5s `hw.soft`. Reverse on leave.
- **Section tags** ("01 About" and so on): the number circle pops, then the label chip slides out from behind it.
- **Hover colour changes are required everywhere something is clickable**: links, cards, chips, buttons, tiles. Use the palette: moss ↔ loam on light, stone ↔ sage on dark.
- Cursor: system default. No custom cursor.

---

## 12. Responsive

- **Tablet (768 to 1279px):** same structure, scaled down. Services becomes a swipe carousel. The path in How it works gets a recomputed, simpler geometry.
- **Mobile (<768px):**
  - Intro: same timeline, compressed to about 2.8s. The cards deal into a horizontal swipeable row under the wordmark instead of the arc.
  - About: no pinning. The word fade-up runs on a normal scroll trigger.
  - How it works: the path becomes a vertical wiggle down the left side with the steps stacked on the right. It still draws on scroll and still enters and exits through the side edges.
  - Costs: the tape scrolls horizontally if needed. The pin stays draggable with a large touch target (min 44px). The cards stack.
  - The form is full width, with tiles in one column.
- Test at 1440, 1920, 1280, 1024, 768, 390.

---

## 13. How to work

1. **Set up the project and the motion system first:** Lenis + GSAP wiring, CustomEase registration, fonts, tokens, a `useReducedMotion` hook, and small reusable helpers (`revealLines`, `charRise`, `wordFadeUp`, `clipReveal`, `pillHover`).
2. **Build the hero and the intro, then STOP and tell me.** I'll review it at `http://localhost:3299` before you do anything else. The hero is the make-or-break part, so spend the time there. Record a screen capture or take screenshots at several points in the timeline (0.5s, 1.2s, 2.2s, 2.8s, final) using a headless browser (Playwright is fine) and check them against the Figma screenshot of `5:2` yourself before telling me it's done.
3. Then build the sections in order. After each one, screenshot it at 1440px and compare against its Figma node.
4. Keep every section in its own component (`/components/sections/Hero.tsx` and so on), and keep the GSAP code inside `useGSAP` in that component.
5. Before calling anything finished: no console errors, no layout shift when fonts load, a Lighthouse performance score of 85+ on desktop, reduced motion respected, and keyboard focus visible on every interactive element (styled, loam outline).

Quality bar: when a UK landscaper opens this at `localhost:3299`, their reaction should be "how is this a landscaping website." Every animation should look intentional, eased and choreographed. If something looks like a default fade-in, it isn't done.
