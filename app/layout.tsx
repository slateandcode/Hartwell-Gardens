import type { Metadata, Viewport } from 'next'
import { gambarino, montreal } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hartwell Gardens | Garden design and build in Surrey and Hampshire',
  description:
    'Garden design and build across Surrey and Hampshire. One crew from the first sketch to the last plant in the ground.',
}

export const viewport: Viewport = {
  themeColor: '#2E3A28',
}

/*
  Runs before first paint: marks JS as available, measures the real viewport
  width for the layout unit, and decides whether this visit gets the intro so
  nothing flashes in its final state first.
*/
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');d.style.setProperty('--vw',d.clientWidth+'px');try{if(!sessionStorage.getItem('hw-intro-seen')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('intro-pending');if('scrollRestoration' in history)history.scrollRestoration='manual';}}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${gambarino.variable} ${montreal.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        {children}
      </body>
    </html>
  )
}
