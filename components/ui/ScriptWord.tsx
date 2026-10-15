import type { ScriptWord as Word } from '@/lib/script-paths'

type Props = {
  word: Word
  className?: string
  /** Line height of the text box this replaces (Figma value). */
  lineHeight?: number
}

// Room around the ink so swashes and descenders sit inside the SVG (and its mask).
const PAD_X = 120
const PAD_TOP = 900
const PAD_BOTTOM = 440

/**
 * A word set in Pinyon Script, as outlines, so it can be written on with
 * DrawSVG. Sized in em: set `font-size` to the Figma text size and the SVG
 * lines up with where the live text box would have been (top of line box at
 * the element's position).
 */
export function ScriptWord({ word, className, lineHeight = 1.02 }: Props) {
  const box = lineHeight * 1000
  const baseline = (box - (word.ascent + word.descent)) / 2 + word.ascent
  const vbX = -PAD_X
  const vbW = word.advance + PAD_X * 2
  const vbH = PAD_TOP + PAD_BOTTOM
  const style = {
    width: `${vbW / 1000}em`,
    height: `${vbH / 1000}em`,
    marginTop: `${(baseline - PAD_TOP) / 1000}em`,
    marginLeft: `${-PAD_X / 1000}em`,
    marginRight: `${-PAD_X / 1000}em`,
    // footprint in the flow stays one line box tall, like the text it replaces
    marginBottom: `${(box - vbH - (baseline - PAD_TOP)) / 1000}em`,
  }
  return (
    <svg
      className={className}
      style={style}
      viewBox={`${vbX} ${-PAD_TOP} ${vbW} ${vbH}`}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      data-script
    >
      {word.glyphs.map((d, i) => (
        <path key={i} d={d} data-glyph />
      ))}
    </svg>
  )
}
