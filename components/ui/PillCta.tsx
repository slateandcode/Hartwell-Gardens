import { forwardRef } from 'react'
import { ArrowGlyph } from './ArrowGlyph'
import { cx } from '@/lib/cx'
import s from './PillCta.module.css'

type Common = {
  children: React.ReactNode
  /** light: moss pill on stone sections. dark: stone pill on moss sections. */
  tone?: 'light' | 'dark'
  /** Label size in Figma px. */
  labelSize?: number
  className?: string
}

type AnchorProps = Common & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children'>
type ButtonProps = Common & { href?: undefined } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>

function Inner({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span className={s.fill} aria-hidden="true" />
      <span className={s.label}>{children}</span>
      <span className={s.badge} aria-hidden="true">
        <ArrowGlyph className={s.arrow} />
      </span>
    </>
  )
}

export const PillCta = forwardRef<HTMLAnchorElement | HTMLButtonElement, AnchorProps | ButtonProps>(
  function PillCta({ children, tone = 'light', labelSize = 40, className, ...rest }, ref) {
    const classes = cx(s.pill, s[tone], className)
    const style = { '--label': labelSize, ...(rest.style ?? {}) } as React.CSSProperties
    if ('href' in rest && rest.href !== undefined) {
      const { href, ...a } = rest as AnchorProps
      return (
        <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} {...a} className={classes} style={style}>
          <Inner>{children}</Inner>
        </a>
      )
    }
    const b = rest as ButtonProps
    return (
      <button ref={ref as React.Ref<HTMLButtonElement>} type="button" {...b} className={classes} style={style}>
        <Inner>{children}</Inner>
      </button>
    )
  },
)
