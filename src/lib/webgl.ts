let cached: boolean | undefined

/** Detects whether the browser can create a WebGL context. Result is cached. */
export function hasWebGL(): boolean {
  if (cached !== undefined) return cached
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    cached = !!gl
    // Release the probe context immediately.
    ;(gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    cached = false
  }
  return cached
}

/** Rough device capability tier, used to scale rendering quality. */
export function deviceTier(): 'high' | 'low' {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  if (nav.connection?.saveData) return 'low'
  if (window.matchMedia('(max-width: 767px)').matches) return 'low'
  if ((nav.hardwareConcurrency ?? 8) <= 4) return 'low'
  if ((nav.deviceMemory ?? 8) <= 4) return 'low'
  return 'high'
}
