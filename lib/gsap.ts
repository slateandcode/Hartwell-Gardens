'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { CustomEase } from 'gsap/CustomEase'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'
import { useGSAP } from '@gsap/react'

let registered = false

if (typeof window !== 'undefined' && !registered) {
  registered = true
  gsap.registerPlugin(
    useGSAP,
    ScrollTrigger,
    SplitText,
    DrawSVGPlugin,
    MotionPathPlugin,
    CustomEase,
    Draggable,
    InertiaPlugin,
  )

  // The house curves. Nothing on the site uses GSAP's or the browser's defaults.
  CustomEase.create('hw.inOut', '0.76,0,0.24,1') // travel, reveals, big moves
  CustomEase.create('hw.out', '0.16,1,0.3,1') // arrivals: text rising, cards landing
  CustomEase.create('hw.soft', '0.65,0,0.35,1') // hovers and small state changes
  // Physical landing: runs ~3% past the target and settles back
  CustomEase.create('hw.land', 'M0,0 C0.13,0.58 0.3,1.034 0.52,1.034 0.72,1.034 0.84,1 1,1')

  gsap.defaults({ ease: 'hw.out', duration: 1 })
  ScrollTrigger.config({ ignoreMobileResize: true })
}

export const EASE = {
  inOut: 'hw.inOut',
  out: 'hw.out',
  soft: 'hw.soft',
  land: 'hw.land',
} as const

export {
  gsap,
  ScrollTrigger,
  SplitText,
  DrawSVGPlugin,
  MotionPathPlugin,
  CustomEase,
  Draggable,
  InertiaPlugin,
  useGSAP,
}
