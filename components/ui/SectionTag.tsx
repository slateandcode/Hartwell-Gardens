import { forwardRef } from 'react'
import { cx } from '@/lib/cx'
import s from './SectionTag.module.css'

type Props = { num: string; label: string; tone?: 'light' | 'dark'; className?: string }

/** "01 About" style tag. Animated in by `tagIn()` from lib/motion. */
export const SectionTag = forwardRef<HTMLDivElement, Props>(function SectionTag(
  { num, label, tone = 'light', className },
  ref,
) {
  return (
    <div ref={ref} className={cx(s.tag, s[tone], className)} data-tag data-reveal>
      <span className={s.num} data-tag-num aria-hidden="true">
        {num}
      </span>
      <span className={s.label} data-tag-label>
        <span className="sr-only">Section {num}: </span>
        {label}
      </span>
    </div>
  )
})
