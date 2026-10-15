/*
  Little single-weight line "stickers" for the process steps, in the spirit of
  two26's path. Moss strokes, loam fills, stone where paper would be.
*/
const STROKE = {
  fill: 'none',
  stroke: 'var(--moss)',
  strokeWidth: 2.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function StepIcon({ kind, className }: { kind: 'visit' | 'design' | 'build' | 'care'; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false" data-icon>
      {kind === 'visit' && (
        <>
          {/* folded site plan */}
          <path d="M8 17 L22 12 L36 17 L50 12 V47 L36 52 L22 47 L8 52 Z" {...STROKE} fill="var(--card)" />
          <path d="M22 12 L36 17 V52 L22 47 Z" fill="var(--loam)" opacity="0.9" />
          <path d="M22 12 V47 M36 17 V52" {...STROKE} />
          <path d="M12 41 C16 33 26 38 29 28" {...STROKE} strokeWidth={2} strokeDasharray="2.5 4" stroke="var(--stone)" />
          {/* pencil */}
          <path d="M47 40.5 L60.8 22.1 L55.2 17.9 L41.4 36.3 Z" {...STROKE} fill="var(--stone)" />
          <path d="M41.4 36.3 L39.6 44.6 L47 40.5" {...STROKE} fill="var(--sand)" />
          <path d="M58.4 25.3 L52.8 21.1" {...STROKE} />
        </>
      )}
      {kind === 'design' && (
        <>
          {/* set square */}
          <path d="M9 55 V9 L55 55 Z M17 47 H35 L17 29 Z" {...STROKE} fill="var(--loam)" fillRule="evenodd" />
          <path d="M9 17 H14 M9 24 H16 M9 31 H14 M9 38 H16 M17 55 V50 M24 55 V48 M31 55 V50 M38 55 V48 M45 55 V50" {...STROKE} strokeWidth={2} stroke="var(--stone)" />
          <circle cx="13" cy="51" r="2" fill="var(--stone)" />
        </>
      )}
      {kind === 'build' && (
        <g transform="rotate(24 32 32) translate(32 33) scale(1.18) translate(-32 -35)">
          {/* spade */}
          <path d="M26 17 V9 H38 V17" {...STROKE} />
          <path d="M32 17 V35" {...STROKE} strokeWidth={3.4} />
          <path d="M22 35 H42 V45 C42 53 36 58 32 61 C28 58 22 53 22 45 Z" {...STROKE} fill="var(--loam)" />
          <path d="M27 40 V46" {...STROKE} strokeWidth={2} stroke="var(--stone)" />
        </g>
      )}
      {kind === 'care' && (
        <>
          {/* watering can */}
          <path d="M19 28 C19 15 38 15 38 28" {...STROKE} />
          <path d="M12 28 H42 L39.5 51 C39.3 53 38 54 36 54 H18 C16 54 14.7 53 14.5 51 Z" {...STROKE} fill="var(--loam)" />
          <path d="M41 45 L53 27" {...STROKE} strokeWidth={3} />
          <path d="M49.5 23.5 L57.5 30" {...STROKE} strokeWidth={3.6} />
          <path d="M17 34 H37" {...STROKE} strokeWidth={2} stroke="var(--stone)" opacity="0.8" />
          <path d="M57 36 C58.6 38 58.6 40 57 40.6 C55.4 40 55.4 38 57 36 Z M52 39 C53.4 40.8 53.4 42.6 52 43.2 C50.6 42.6 50.6 40.8 52 39 Z M60 43 C61.4 44.8 61.4 46.6 60 47.2 C58.6 46.6 58.6 44.8 60 43 Z" fill="var(--loam)" />
        </>
      )}
    </svg>
  )
}
