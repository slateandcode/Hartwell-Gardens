import s from './RollText.module.css'

/** Label for the nav-style text roll. Place inside a link (or render as one with `href`). */
export function RollText({ children, href, onClick, className }: {
  children: string
  href?: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  className?: string
}) {
  const inner = (
    <span className={s.stack}>
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  )
  if (href) {
    return (
      <a href={href} onClick={onClick} className={`${s.roll} ${className ?? ''}`}>
        {inner}
      </a>
    )
  }
  return <span className={`${s.roll} ${className ?? ''}`}>{inner}</span>
}
