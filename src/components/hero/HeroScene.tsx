import { Environment, Html, Lightformer, Line, MeshTransmissionMaterial, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { site } from '../../config/site'

/**
 * THE GROWTH ENGINE
 *
 * A living model of the marketing ecosystem:
 *  - Channel nodes (SEO, Ads, Social…) — gold diamonds, like the circuit nodes
 *    in the Kunnect mark — travel on three tilted orbits and stream light into
 *    a refractive glass core: many channels converging into one strategy.
 *  - A geodesic network of diamonds surrounds the core, with signals firing
 *    across it: connection.
 *  - Thousands of particles spiral upwards around everything, and a radial
 *    bar chart rises beneath it: growth.
 *  - Scrolling into the company introduction bursts the engine open into a
 *    constellation.
 *
 * Rendering is paused off-screen, frozen for reduced-motion users, and scaled
 * down (no post-processing, fewer particles, 30 fps) on constrained devices.
 */

export interface SceneProgress {
  /** 0 → 1 while the hero scrolls out of view. */
  hero: number
  /** 0 → 1 while the company introduction scrolls through. */
  journey: number
}

export interface HeroSceneProps {
  channels: string[]
  progress: RefObject<SceneProgress>
  /** Pointer position, normalised to -1…1. */
  pointer: RefObject<{ x: number; y: number }>
  active: boolean
  reducedMotion: boolean
  quality: 'high' | 'low'
  onReady?: () => void
}

const C = {
  ink: new THREE.Color(site.colors.ink),
  paper: new THREE.Color(site.colors.paper),
  accent: new THREE.Color(site.colors.accent),
  signal: new THREE.Color(site.colors.signal),
  goldLight: new THREE.Color(site.colors.goldLight),
  goldDeep: new THREE.Color(site.colors.goldDeep),
  dim: new THREE.Color(site.colors.ink).lerp(new THREE.Color(site.colors.paper), 0.18),
}

const RINGS = [
  { radius: 1.95, tilt: new THREE.Euler(1.18, 0, 0.32), speed: 0.11 },
  { radius: 2.6, tilt: new THREE.Euler(1.36, 0, -0.42), speed: -0.075 },
  { radius: 3.25, tilt: new THREE.Euler(1.05, 0.2, 0.12), speed: 0.05 },
]

const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x))
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (current: number, target: number, rate: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-rate * dt))

/** Entrance progress 0→1 over the first seconds after mount (the canvas clock starts at mount). */
function introAt(clockTime: number, reduced: boolean) {
  return reduced ? 1 : clamp01((clockTime - 0.15) / 2.8)
}

/** Seconds since the scene mounted, or a fixed value when motion is reduced (final state). */
function sceneTime(clockTime: number, reduced: boolean) {
  return reduced ? 100 : clockTime
}

/** How far the engine has burst open (0 = assembled, 1 = constellation). */
function burstOf(progress: RefObject<SceneProgress>, reduced: boolean) {
  if (reduced) return 0
  return easeInOutCubic(clamp01((progress.current?.journey ?? 0) * 1.35))
}

// ─── Core ───────────────────────────────────────────────────────────────────

function useHaloTexture() {
  const texture = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.25, 'rgba(255,255,255,0.35)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

function Core({ quality, reducedMotion, progress }: { quality: 'high' | 'low'; reducedMotion: boolean; progress: RefObject<SceneProgress> }) {
  const root = useRef<THREE.Group>(null)
  const shell = useRef<THREE.Group>(null)
  const heart = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.Sprite>(null)
  const light = useRef<THREE.PointLight>(null)
  const halotex = useHaloTexture()
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.87, 0)), [])
  useEffect(() => () => edges.dispose(), [edges])
  // A bright, slightly over-range gold so bloom picks it up.
  const heartColor = useMemo(() => C.accent.clone().lerp(C.goldLight, 0.35).multiplyScalar(2.2), [])

  useFrame(({ clock }, dt) => {
    const t = sceneTime(clock.elapsedTime, reducedMotion)
    const m = reducedMotion ? 0 : 1
    const burst = burstOf(progress, reducedMotion)
    if (root.current) root.current.scale.setScalar(1 - burst * 0.3)
    if (shell.current) {
      shell.current.rotation.y += dt * 0.12 * m
      shell.current.rotation.x = 0.35 + Math.sin(t * 0.3) * 0.08 * m
    }
    // A slow "heartbeat" as the channels feed the core.
    const beat = Math.sin(t * 2.1)
    heart.current?.scale.setScalar(1 + beat * 0.07 * m)
    if (heart.current) heart.current.rotation.y -= dt * 0.4 * m
    halo.current?.scale.setScalar(4.2 * (1 + beat * 0.08 * m) * (1 + burst * 0.6))
    if (light.current) light.current.intensity = 10 + beat * 2.5 * m
  })

  return (
    <group ref={root}>
      <group ref={shell}>
        <mesh>
          <icosahedronGeometry args={[0.85, 0]} />
          {quality === 'high' ? (
            <MeshTransmissionMaterial
              samples={6}
              resolution={512}
              transmission={1}
              thickness={1.1}
              roughness={0.06}
              ior={1.5}
              chromaticAberration={0.22}
              anisotropicBlur={0.2}
              distortion={0.25}
              distortionScale={0.4}
              temporalDistortion={0.08}
              clearcoat={1}
              attenuationColor={C.accent}
              attenuationDistance={1.6}
              color={C.paper}
              flatShading
            />
          ) : (
            <meshPhysicalMaterial color={C.dim} roughness={0.18} metalness={0.6} clearcoat={1} transparent opacity={0.55} envMapIntensity={1.4} flatShading />
          )}
        </mesh>
        <lineSegments geometry={edges}>
          <lineBasicMaterial color={C.goldLight} transparent opacity={0.4} />
        </lineSegments>
      </group>
      <mesh ref={heart}>
        <icosahedronGeometry args={[0.32, 1]} />
        <meshBasicMaterial color={heartColor} toneMapped={false} />
      </mesh>
      <sprite ref={halo} scale={4.2}>
        <spriteMaterial map={halotex} color={C.accent} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <pointLight ref={light} color={C.accent} intensity={10} distance={7} decay={1.6} />
    </group>
  )
}

// ─── Network shell: a geodesic of gold diamonds with signals firing ─────────

function NetworkShell({ reducedMotion, progress }: { reducedMotion: boolean; progress: RefObject<SceneProgress> }) {
  const group = useRef<THREE.Group>(null)
  const nodes = useRef<THREE.InstancedMesh>(null)
  const linesMat = useRef<THREE.LineBasicMaterial>(null)

  const { vertices, edges } = useMemo(() => {
    const base = new THREE.IcosahedronGeometry(1.35, 1)
    base.deleteAttribute('normal')
    base.deleteAttribute('uv')
    const merged = mergeVertices(base)
    const pos = merged.getAttribute('position') as THREE.BufferAttribute
    const vertices = Array.from({ length: pos.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(pos, i))
    const edges = new THREE.EdgesGeometry(base, 1)
    base.dispose()
    merged.dispose()
    return { vertices, edges }
  }, [])
  useEffect(() => () => edges.dispose(), [edges])

  const seeds = useMemo(() => vertices.map((_, i) => ((Math.sin(i * 91.7) * 43758.5) % 1 + 1) % 1), [vertices])
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(), p: new THREE.Vector3(), c: new THREE.Color(), e: new THREE.Euler() }), [])

  useFrame(({ clock }, dt) => {
    const t = sceneTime(clock.elapsedTime, reducedMotion)
    const m = reducedMotion ? 0 : 1
    const intro = introAt(clock.elapsedTime, reducedMotion)
    const burst = burstOf(progress, reducedMotion)
    const g = group.current
    if (g) {
      g.rotation.y -= dt * 0.07 * m
      g.rotation.z += dt * 0.025 * m
      g.scale.setScalar(easeOutExpo(clamp01((intro - 0.2) / 0.8)))
    }
    // Burst: the lattice dissolves and its nodes drift apart into a constellation.
    if (linesMat.current) linesMat.current.opacity = 0.14 * clamp01((intro - 0.3) / 0.7) * (1 - clamp01(burst * 2.5))
    const im = nodes.current
    if (!im) return
    vertices.forEach((v, i) => {
      // Signals: each node flares briefly at its own rhythm.
      const flare = Math.pow(Math.max(0, Math.sin(t * 0.9 + seeds[i] * 40)), 18)
      tmp.e.set(0, t * 0.8 * m + i, Math.PI / 4)
      tmp.q.setFromEuler(tmp.e)
      tmp.p.copy(v).multiplyScalar(1 + burst * (1.6 + seeds[i] * 2.2))
      tmp.m.compose(tmp.p, tmp.q, tmp.s.setScalar((0.035 + flare * 0.035) * (1 - burst * 0.3)))
      im.setMatrixAt(i, tmp.m)
      tmp.c.copy(C.goldDeep).lerp(C.goldLight, flare).multiplyScalar(0.9 + flare * 2.6)
      im.setColorAt(i, tmp.c)
    })
    im.instanceMatrix.needsUpdate = true
    if (im.instanceColor) im.instanceColor.needsUpdate = true
  })

  return (
    <group ref={group}>
      <lineSegments geometry={edges}>
        <lineBasicMaterial ref={linesMat} color={C.goldLight} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <instancedMesh ref={nodes} args={[undefined, undefined, vertices.length]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

// ─── Growth vortex: GPU particles spiralling upward ─────────────────────────

const vortexVertex = /* glsl */ `
  uniform float uTime;
  uniform float uBurst;
  uniform float uIntro;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aSeed;
  attribute float aT;
  varying float vT;
  varying float vSeed;
  void main() {
    float t = fract(aT + uTime * 0.018);
    float ang = t * 6.2831853 * 3.0 + aSeed * 0.9 + uTime * 0.12;
    float spread = (fract(aSeed * 91.7) - 0.5) * 0.7;
    float r = (mix(1.7, 3.6, t) + spread) * (1.0 + uBurst * 1.3);
    float y = mix(-2.4, 3.0, t) + (fract(aSeed * 37.3) - 0.5) * 0.4;
    y *= (1.0 - uBurst * 0.55);
    vec3 p = vec3(cos(ang) * r, y, sin(ang) * r);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float fade = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.82, 1.0, t)) * uIntro;
    gl_PointSize = uSize * uPixelRatio * (0.35 + fract(aSeed * 13.1)) * fade / -mv.z;
    vT = t;
    vSeed = aSeed;
  }
`

const vortexFragment = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uGold;
  uniform vec3 uLight;
  varying float vT;
  varying float vSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    vec3 col = mix(uDeep, uGold, smoothstep(0.0, 0.5, vT));
    col = mix(col, uLight, smoothstep(0.55, 1.0, vT));
    // A few particles burn bright white-gold.
    col *= 1.0 + step(0.96, fract(vSeed * 7.7)) * 2.0;
    gl_FragColor = vec4(col, a * 0.85);
  }
`

function GrowthVortex({ count, reducedMotion, progress }: { count: number; reducedMotion: boolean; progress: RefObject<SceneProgress> }) {
  const dpr = useThree((s) => s.viewport.dpr)
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const seed = new Float32Array(count)
    const tt = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      seed[i] = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1
      tt[i] = i / count
    }
    // Positions are computed in the vertex shader; this only sizes the draw call.
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    g.setAttribute('aT', new THREE.BufferAttribute(tt, 1))
    return g
  }, [count])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vortexVertex,
        fragmentShader: vortexFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uBurst: { value: 0 },
          uIntro: { value: 0 },
          uSize: { value: 26 },
          uPixelRatio: { value: 1 },
          uDeep: { value: C.goldDeep.clone().multiplyScalar(0.6) },
          uGold: { value: C.accent.clone() },
          uLight: { value: C.goldLight.clone().multiplyScalar(1.4) },
        },
      }),
    [],
  )
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  const points = useRef<THREE.Points>(null)
  useFrame(({ clock }) => {
    const mat = points.current?.material as THREE.ShaderMaterial | undefined
    if (!mat) return
    const u = mat.uniforms
    u.uTime.value = reducedMotion ? 40 : clock.elapsedTime
    u.uBurst.value = burstOf(progress, reducedMotion)
    u.uIntro.value = easeOutExpo(clamp01((introAt(clock.elapsedTime, reducedMotion) - 0.25) / 0.75))
    u.uPixelRatio.value = dpr
  })

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}

// ─── Orbits, channels and flows ─────────────────────────────────────────────

function ringPoints(radius: number, segments = 160) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
  }
  return pts
}

const FLOW_SEGMENTS = 36
const PACKETS_PER_CHANNEL = 5

/** Quadratic Bézier from a channel node (p) to the core (origin), arcing via control point c. */
function bezier(out: THREE.Vector3, p: THREE.Vector3, c: THREE.Vector3, t: number) {
  const u = 1 - t
  return out.set(u * u * p.x + 2 * u * t * c.x, u * u * p.y + 2 * u * t * c.y, u * u * p.z + 2 * u * t * c.z)
}

function Channels({
  channels,
  showLabels,
  reducedMotion,
  progress,
}: {
  channels: string[]
  showLabels: boolean
  reducedMotion: boolean
  progress: RefObject<SceneProgress>
}) {
  const nodes = useMemo(
    () =>
      channels.map((label, i) => {
        const ring = RINGS[i % RINGS.length]
        return {
          label,
          index: i,
          ring,
          quat: new THREE.Quaternion().setFromEuler(ring.tilt),
          angle0: (i / channels.length) * Math.PI * 2 + (i % RINGS.length) * 0.6,
        }
      }),
    [channels],
  )

  const nodeRefs = useRef<(THREE.Group | null)[]>([])
  const ringRefs = useRef<(THREE.Group | null)[]>([])
  // Flat diamond outline around each node.
  const diamondFrame = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.26, 0.26).rotateZ(Math.PI / 4)), [])
  useEffect(() => () => diamondFrame.dispose(), [diamondFrame])
  const labelRefs = useRef<(HTMLDivElement | null)[]>([])
  const nodeGlow = useMemo(() => C.accent.clone().multiplyScalar(1.6), [])

  // One dynamic line per channel: the light stream from node to core.
  const flows = useMemo(
    () =>
      nodes.map(() => {
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array((FLOW_SEGMENTS + 1) * 3), 3))
        const colors = new Float32Array((FLOW_SEGMENTS + 1) * 3)
        for (let s = 0; s <= FLOW_SEGMENTS; s++) {
          const t = s / FLOW_SEGMENTS
          // Brighter as the stream approaches the core (additive blending).
          const c = C.signal.clone().lerp(C.accent, t * t).multiplyScalar(0.1 + 0.9 * t)
          colors.set([c.r, c.g, c.b], s * 3)
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        const material = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        })
        return new THREE.Line(geometry, material)
      }),
    [nodes],
  )
  useEffect(
    () => () =>
      flows.forEach((l) => {
        l.geometry.dispose()
        ;(l.material as THREE.Material).dispose()
      }),
    [flows],
  )

  const packetCount = nodes.length * PACKETS_PER_CHANNEL
  const packets = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = packets.current
    if (!mesh) return
    const bright = C.goldLight.clone().multiplyScalar(2.4)
    const gold = C.accent.clone().multiplyScalar(2)
    for (let i = 0; i < packetCount; i++) mesh.setColorAt(i, i % 3 === 0 ? gold : bright)
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [packetCount])

  const tmp = useMemo(
    () => ({ p: new THREE.Vector3(), c: new THREE.Vector3(), v: new THREE.Vector3(), w: new THREE.Vector3(), m: new THREE.Matrix4(), s: new THREE.Vector3(), q: new THREE.Quaternion() }),
    [],
  )
  const positions = useMemo(() => nodes.map(() => new THREE.Vector3()), [nodes])

  useFrame(({ clock }) => {
    const t = sceneTime(clock.elapsedTime, reducedMotion)
    const m = reducedMotion ? 0 : 1
    const intro = introAt(clock.elapsedTime, reducedMotion)
    const burst = burstOf(progress, reducedMotion)
    const flowIn = clamp01((intro - 0.35) / 0.65) * (1 - burst * 0.75)
    const expand = 1 + burst * 1.7

    ringRefs.current.forEach((r) => r?.scale.setScalar(expand))

    nodes.forEach((n, i) => {
      const a = n.angle0 + clock.elapsedTime * n.ring.speed * m
      const radius = n.ring.radius * expand
      const p = positions[i].set(Math.cos(a) * radius, 0, Math.sin(a) * radius).applyQuaternion(n.quat)
      const g = nodeRefs.current[i]
      if (g) {
        g.position.copy(p)
        g.rotation.y = clock.elapsedTime * 0.6 * m + i
        g.scale.setScalar(easeOutExpo(clamp01(intro * 1.4 - i * 0.05)))
      }

      // Arc control point: pulled inward and lifted, so streams sweep up into the core.
      tmp.c.copy(p).multiplyScalar(0.42).add(tmp.v.set(0, 0.9, 0))
      const attr = flows[i].geometry.getAttribute('position') as THREE.BufferAttribute
      for (let s = 0; s <= FLOW_SEGMENTS; s++) {
        bezier(tmp.w, p, tmp.c, s / FLOW_SEGMENTS)
        attr.setXYZ(s, tmp.w.x, tmp.w.y, tmp.w.z)
      }
      attr.needsUpdate = true
      ;(flows[i].material as THREE.LineBasicMaterial).opacity = flowIn

      // Packets travelling along the stream.
      const mesh = packets.current
      if (mesh) {
        for (let k = 0; k < PACKETS_PER_CHANNEL; k++) {
          const u = reducedMotion ? (k + 0.5) / PACKETS_PER_CHANNEL : (t * 0.22 + k / PACKETS_PER_CHANNEL + i * 0.137) % 1
          bezier(tmp.w, p, tmp.c, u)
          const size = Math.sin(Math.PI * u) * flowIn
          tmp.m.compose(tmp.w, tmp.q, tmp.s.setScalar(size))
          mesh.setMatrixAt(i * PACKETS_PER_CHANNEL + k, tmp.m)
        }
        mesh.instanceMatrix.needsUpdate = true
      }

      // Dim labels on the far side of the structure; hide once the engine bursts open.
      const label = labelRefs.current[i]
      if (label && g) {
        g.getWorldPosition(tmp.w)
        label.style.opacity = String((0.35 + clamp01((tmp.w.z + 2) / 4) * 0.65) * clamp01((intro - 0.35) / 0.65) * (1 - clamp01(burst * 3)))
      }
    })
  })

  return (
    <group>
      {RINGS.map((r, i) => (
        <group key={i} rotation={r.tilt}>
          <group ref={(el) => void (ringRefs.current[i] = el)}>
            <Line points={ringPoints(r.radius)} color={C.goldLight} lineWidth={1} transparent opacity={0.2 - i * 0.04} />
          </group>
        </group>
      ))}

      {flows.map((line, i) => (
        <primitive key={i} object={line} />
      ))}

      <instancedMesh ref={packets} args={[undefined, undefined, packetCount]} frustumCulled={false}>
        <octahedronGeometry args={[0.04, 0]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {nodes.map((n, i) => (
        <group key={n.label + i} ref={(el) => void (nodeRefs.current[i] = el)}>
          {/* Diamond node, echoing the circuit nodes in the Kunnect mark. */}
          <mesh>
            <octahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color={C.accent} emissive={C.accent} emissiveIntensity={0.45} metalness={0.7} roughness={0.15} envMapIntensity={2} flatShading />
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.05, 0]} />
            <meshBasicMaterial color={nodeGlow} toneMapped={false} />
          </mesh>
          <lineSegments geometry={diamondFrame}>
            <lineBasicMaterial color={C.accent} transparent opacity={0.6} />
          </lineSegments>
          {showLabels && (
            <Html position={[0.24, 0.12, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
              <div
                ref={(el) => void (labelRefs.current[i] = el)}
                aria-hidden="true"
                className="t-label whitespace-nowrap text-[0.625rem] text-paper/85"
                style={{ opacity: 0 }}
              >
                <span className="text-accent">{String(i + 1).padStart(2, '0')}</span> {n.label}
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  )
}

// ─── Growth ring: a radial bar chart rising around the circle ──────────────

function GrowthRing({ count, reducedMotion, progress }: { count: number; reducedMotion: boolean; progress: RefObject<SceneProgress> }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const group = useRef<THREE.Group>(null)
  const guides = useRef<THREE.Group>(null)
  const geometry = useMemo(() => new THREE.BoxGeometry(0.034, 1, 0.034).translate(0, 0.5, 0), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  const radius = 1.55

  const base = useMemo(() => Array.from({ length: count }, (_, i) => 0.06 + Math.pow(i / (count - 1), 2.4) * 1.25), [count])

  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const k = i / (count - 1)
      c.copy(C.dim).lerp(C.goldDeep, Math.min(1, k * 1.3) * 0.7).lerp(C.goldLight, Math.pow(k, 5))
      // The tallest bars glow.
      c.multiplyScalar(1 + Math.pow(k, 6) * 1.6)
      m.setColorAt(i, c)
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [count])

  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) }), [])

  useFrame(({ clock }, dt) => {
    const t = sceneTime(clock.elapsedTime, reducedMotion)
    const m = reducedMotion ? 0 : 1
    const grow = introAt(clock.elapsedTime, reducedMotion)
    const burst = burstOf(progress, reducedMotion)
    const g = group.current
    if (g) {
      g.rotation.y -= dt * 0.05 * m
    }
    guides.current?.scale.setScalar(1 + burst * 1.4)
    const im = mesh.current
    if (!im) return
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const gr = easeOutExpo(clamp01((grow - 0.15 - (i / count) * 0.35) / 0.5))
      const h = base[i] * gr * (1 + Math.sin(t * 1.3 - i * 0.35) * 0.07 * m) * (1 - burst * 0.75)
      const r = radius * (1 + burst * 1.4)
      tmp.p.set(Math.cos(a) * r, 0, Math.sin(a) * r)
      tmp.q.setFromAxisAngle(tmp.up, -a)
      tmp.m.compose(tmp.p, tmp.q, tmp.s.set(1, Math.max(h, 0.0001), 1))
      im.setMatrixAt(i, tmp.m)
    }
    im.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={group} position={[0, -1.45, 0]}>
      <instancedMesh ref={mesh} args={[geometry, undefined, count]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <group ref={guides}>
        <Line points={ringPoints(radius - 0.12, 120)} color={C.goldLight} lineWidth={1} transparent opacity={0.2} />
        <Line points={ringPoints(radius + 0.12, 120)} color={C.goldLight} lineWidth={1} transparent opacity={0.08} />
      </group>
    </group>
  )
}

// ─── Atmosphere ─────────────────────────────────────────────────────────────

function Dust({ count, reducedMotion }: { count: number; reducedMotion: boolean }) {
  const ref = useRef<THREE.Points>(null)
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random distribution in a thick shell.
      const r = 3.5 + ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * 7
      const th = i * 2.399963
      const y = (((Math.sin(i * 78.233) * 12345.678) % 1) + 1) % 1 * 2 - 1
      const rr = Math.sqrt(1 - y * y)
      pos.set([Math.cos(th) * rr * r, y * r * 0.6, Math.sin(th) * rr * r - 2], i * 3)
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [count])
  useEffect(() => () => geometry.dispose(), [geometry])
  useFrame((_, dt) => {
    if (ref.current && !reducedMotion) ref.current.rotation.y += dt * 0.012
  })
  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color={C.goldLight} size={0.02} sizeAttenuation transparent opacity={0.4} depthWrite={false} />
    </points>
  )
}

/** A warm light that follows the pointer, so reflections glide across the metal. */
function PointerLight({ pointer, reducedMotion }: { pointer: RefObject<{ x: number; y: number }>; reducedMotion: boolean }) {
  const light = useRef<THREE.PointLight>(null)
  useFrame((_, dt) => {
    const l = light.current
    if (!l || reducedMotion) return
    l.position.x = smooth(l.position.x, (pointer.current?.x ?? 0) * 5, 4, dt)
    l.position.y = smooth(l.position.y, (pointer.current?.y ?? 0) * 3.5, 4, dt)
  })
  return <pointLight ref={light} position={[2, 1, 4]} color={C.goldLight} intensity={14} distance={12} decay={1.4} />
}

// ─── Rig: layout, intro, pointer and scroll journey ─────────────────────────

function Rig({ children, progress, pointer, reducedMotion }: {
  children: React.ReactNode
  progress: RefObject<SceneProgress>
  pointer: RefObject<{ x: number; y: number }>
  reducedMotion: boolean
}) {
  const outer = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const size = useThree((s) => s.size)

  // Responsive composition: structure on the right on wide screens, above the text on portrait screens.
  const aspect = size.width / size.height
  const layout =
    aspect < 0.85
      ? { x: 0, y: 1.25, s: 0.5 }
      : aspect < 1.25
        ? { x: 1.0, y: 0.55, s: 0.68 }
        : { x: Math.min(2.6, 1.15 * aspect), y: 0.05, s: 0.92 }

  useFrame(({ clock, camera }, dt) => {
    const e = easeOutExpo(introAt(clock.elapsedTime, reducedMotion))
    const h = reducedMotion ? 0 : progress.current?.hero ?? 0
    const burst = burstOf(progress, reducedMotion)
    const px = reducedMotion ? 0 : pointer.current?.x ?? 0
    const py = reducedMotion ? 0 : pointer.current?.y ?? 0

    const o = outer.current
    if (o) {
      // As the hero scrolls away the engine drifts toward the centre, then bursts into a constellation.
      o.position.x = lerp(layout.x, 0, Math.max(h * 0.5, burst))
      o.position.y = lerp(layout.y + h * 0.5, 0, burst)
      o.scale.setScalar(layout.s * (0.72 + 0.28 * e) * (1 + h * 0.12))
      o.rotation.x = smooth(o.rotation.x, py * 0.14 + h * 0.4 + burst * 0.75, 3, dt)
      o.rotation.z = smooth(o.rotation.z, -px * 0.06, 3, dt)
    }
    if (inner.current) {
      const spin = reducedMotion ? 0.5 : clock.elapsedTime * 0.035
      inner.current.rotation.y = smooth(inner.current.rotation.y, spin + px * 0.35 + (1 - e) * -1.6 + h * 0.9 + burst * 1.2, 4, dt)
    }
    // Cinematic dolly: fly in on load, push toward the core on scroll, pull back as it bursts.
    camera.position.z = 10 + (1 - e) * 5 - h * 2.2 + burst * 4.5
    camera.position.x = smooth(camera.position.x, px * 0.35, 2, dt)
    camera.position.y = smooth(camera.position.y, 0.2 + py * 0.2, 2, dt)
    camera.lookAt(lerp(layout.x * 0.25, 0, burst), lerp(layout.y * 0.3 + h * 0.5, 0, burst), 0)
  })

  return (
    <group ref={outer}>
      <group ref={inner}>{children}</group>
    </group>
  )
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[4, 6, 5]} intensity={1.3} color={C.paper} />
      <directionalLight position={[-6, -2, -4]} intensity={1.2} color={C.goldLight} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 5, -2]} rotation-x={Math.PI / 2} scale={[10, 1.5, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={2.6} position={[-6, 1, 1]} rotation-y={Math.PI / 2} scale={[2, 7, 1]} color={site.colors.goldLight} />
        <Lightformer form="rect" intensity={3.4} position={[6, -1, 2]} rotation-y={-Math.PI / 2} scale={[2, 6, 1]} color={site.colors.accent} />
        <Lightformer form="ring" intensity={1.4} position={[0, 0, 7]} scale={4} color="#ffffff" />
      </Environment>
    </>
  )
}

/** Cinematic finish: glow, subtle lens fringing and a vignette (film grain is a CSS overlay). */
function PostFX() {
  const offset = useMemo(() => new THREE.Vector2(0.0005, 0.0005), [])
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={1.05} luminanceThreshold={0.62} luminanceSmoothing={0.18} radius={0.72} />
      <ChromaticAberration offset={offset} radialModulation modulationOffset={0.35} />
      <Vignette offset={0.22} darkness={0.72} />
    </EffectComposer>
  )
}

/** Renders on demand at a capped frame rate (used on constrained devices). */
function FrameCap({ fps, running }: { fps: number; running: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => invalidate(), 1000 / fps)
    return () => window.clearInterval(id)
  }, [fps, running, invalidate])
  return null
}

export default function HeroScene({ channels, progress, pointer, active, reducedMotion, quality, onReady }: HeroSceneProps) {
  const high = quality === 'high'
  const [dpr, setDpr] = useState<number>(high ? 1.5 : 1.1)
  const [fx, setFx] = useState(high)
  // High tier renders every frame while visible; low tier renders at 30 fps; paused when off-screen or motion is reduced.
  const animate = active && !reducedMotion
  const frameloop = animate && high ? 'always' : 'demand'

  return (
    <Canvas
      frameloop={frameloop}
      dpr={dpr}
      camera={{ fov: 35, position: [0, 0.2, 15], near: 0.1, far: 50 }}
      gl={{ antialias: !high, alpha: false, powerPreference: 'high-performance', stencil: false }}
      onCreated={() => onReady?.()}
      aria-hidden="true"
    >
      <color attach="background" args={[site.colors.ink]} />
      {!high && <FrameCap fps={30} running={animate} />}
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1)
          setFx(false)
        }}
        onIncline={() => setDpr(high ? 1.5 : 1.1)}
      />
      <fog attach="fog" args={[site.colors.ink, 9, 24]} />
      <Lights />
      <PointerLight pointer={pointer} reducedMotion={reducedMotion} />
      <Rig progress={progress} pointer={pointer} reducedMotion={reducedMotion}>
        <Core quality={quality} reducedMotion={reducedMotion} progress={progress} />
        <NetworkShell reducedMotion={reducedMotion} progress={progress} />
        <Channels channels={channels} showLabels={high} reducedMotion={reducedMotion} progress={progress} />
        <GrowthRing count={high ? 72 : 44} reducedMotion={reducedMotion} progress={progress} />
        <GrowthVortex count={high ? 5200 : 1800} reducedMotion={reducedMotion} progress={progress} />
      </Rig>
      <Dust count={high ? 600 : 220} reducedMotion={reducedMotion} />
      {fx && <PostFX />}
    </Canvas>
  )
}
