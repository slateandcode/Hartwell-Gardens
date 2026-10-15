import localFont from 'next/font/local'

/** Display serif: headings, wordmark, card titles, prices, step titles. */
export const gambarino = localFont({
  src: '../public/fonts/Gambarino-Regular.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--font-gambarino',
  adjustFontFallback: 'Times New Roman',
  fallback: ['Georgia', 'serif'],
})

/** Sans: body, nav, chips, buttons and the About statement. */
export const montreal = localFont({
  src: [
    { path: '../public/fonts/NeueMontreal-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/NeueMontreal-Medium.woff2', weight: '500', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-montreal',
  adjustFontFallback: 'Arial',
  fallback: ['Helvetica Neue', 'Arial', 'sans-serif'],
})
