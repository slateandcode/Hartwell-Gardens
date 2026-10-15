/** The diagonal arrow from the Figma file (CTA badges, "Learn more", the 180+ badge). */
export function ArrowGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 41.2047 47.2153" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M41.2047 0L13.8511 9.53945L35.7893 28.4586L41.2047 0ZM1.89991 45.5768L3.79981 47.2153L28.3585 18.7376L26.4586 17.0991L24.5587 15.4607L0 43.9384L1.89991 45.5768Z" />
    </svg>
  )
}

/** Overflow-hidden icon swap: the arrow leaves up-right while a copy arrives from bottom-left. */
export function ArrowSwap({ className, glyphClassName }: { className?: string; glyphClassName?: string }) {
  return (
    <span className={`arrow-swap ${className ?? ''}`} aria-hidden="true">
      <ArrowGlyph className={`arrow-swap__a ${glyphClassName ?? ''}`} />
      <ArrowGlyph className={`arrow-swap__b ${glyphClassName ?? ''}`} />
    </span>
  )
}
