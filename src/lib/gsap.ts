import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
gsap.defaults({ ease: 'expo.out', duration: 1.1 })
// Keep animations on wall-clock time. With the default lag smoothing, a slow
// device (or a busy main thread while WebGL warms up) stretches entrance
// animations and leaves content hidden for longer than intended.
gsap.ticker.lagSmoothing(0)

/** Media query used with gsap.matchMedia() so motion is only added when allowed. */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)'

export { gsap, ScrollTrigger }
