'use client'

let fontsPromise: Promise<void> | null = null

/**
 * Resolves once the web fonts are in. Anything that measures or splits text
 * waits on this, otherwise SplitText measures fallback-font line breaks.
 */
export function fontsReady(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()
  if (!fontsPromise) {
    fontsPromise = document.fonts.ready.then(() => undefined)
  }
  return fontsPromise
}

/** Decode a set of images so nothing pops in half-loaded mid-animation. */
export function decodeImages(images: Iterable<HTMLImageElement>, timeoutMs = 2500) {
  const all = Promise.all(
    Array.from(images).map((img) => {
      if (img.complete && img.naturalWidth) return img.decode().catch(() => undefined)
      return new Promise<void>((resolve) => {
        const done = () => resolve()
        img.addEventListener('load', () => img.decode().then(done, done), { once: true })
        img.addEventListener('error', done, { once: true })
      })
    }),
  ).then(() => undefined)
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs))
  return Promise.race([all, timeout])
}

export const BREAKPOINTS = {
  desktop: '(min-width: 1280px)',
  tablet: '(min-width: 768px) and (max-width: 1279px)',
  mobile: '(max-width: 767px)',
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
} as const
