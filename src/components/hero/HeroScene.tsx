import { Environment, Html, Lightformer, Line, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import { site } from '../../config/site'

/**
 * THE GROWTH ENGINE
 *
 * A living model of the marketing ecosystem:
 *  - Channel nodes (SEO, Ads, Social…) travel on three tilted orbits.
 *  - Each channel streams packets of light along an arc into a faceted glass
 *    core — many channels converging into one connected strategy.
 *  - Beneath the core, a radial bar chart rises around the circle: growth,
 *    measured.
 *
 * Rendering is paused when the hero is off-screen, frozen for reduced-motion
 * users, and scaled down on constrained devices.
 */

export interface HeroSceneProps {
  channels: string[]
  /** Hero scroll progress, 0 (top) → 1 (scrolled past). */
  progress: RefObject<number>
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
  dim: new THREE.Color(site.colors.ink).lerp(new THREE.Color(site.colors.paper), 0.18),
}

const RINGS = [
  { radius: 1.95, tilt: new THREE.Euler(1.18, 0, 0.32), speed: 0.11 },
  { radius: 2.6, tilt: new THREE.Euler(1.36, 0, -0.42), speed: -0.075 },
  { radius: 3.25, tilt: new THREE.Euler(1.05, 0.2, 0.12), speed: 0.05 },
]

const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x))
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (current: number, target: number, rate: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-rate * dt))

/** Entrance progress 0→1 over the first seconds after mount (the canvas clock starts at mount). */
function introAt(clockTime: number, reduced: boolean) {
  return reduced ? 1 : clamp01((clockTime - 0.15) / 2.6)
}

/** Seconds since the scene mounted, or a large value when motion is reduced (final state). */
function sceneTime(clockTime: number, reduced: boolean) {
  return reduced ? 100 : clockTime
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

function Core({ quality, reducedMotion }: { quality: 'high' | 'low'; reducedMotion: boolean }) {
  const shell = useRef<THREE.Group>(null)
  const heart = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.Sprite>(null)
  const light = useRef<THREE.PointLight>(null)
  const halotex = useHaloTexture()
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.87, 0)), [])
  useEffect(() => () => edges.dispose(), [edges])

  useFrame(({ clock }, dt) => {
    const t = sceneTime(clock.elapsedTime, reducedMotion)
    const m = reducedMotion ? 0 : 1
    if (shell.current) {
      shell.current.rotation.y += dt * 0.12 * m
      shell.current.rotation.x = 0.35 + Math.sin(t * 0.3) * 0.08 * m
    }
    // A slow "heartbeat" as the channels feed the core.
    const pulse = 1 + Math.sin(t * 2.1) * 0.06 * m
    heart.current?.scale.setScalar(pulse)
    if (heart.current) heart.current.rotation.y -= dt * 0.4 * m
    halo.current?.scale.setScalar(3.6 * (1 + Math.sin(t * 2.1) * 0.08 * m))
    if (light.current) light.current.intensity = 9 + Math.sin(t * 2.1) * 2 * m
  })

  return (
    <group>
      <group ref={shell}>
        <mesh>
          <icosahedronGeometry args={[0.85, 0]} />
          {quality === 'high' ? (
            <meshPhysicalMaterial
              color={C.paper}
              transmission={1}
              thickness={1.2}
              roughness={0.12}
              ior={1.45}
              metalness={0}
              clearcoat={1}
              clearcoatRoughness={0.08}
              envMapIntensity={1.6}
              flatShading
              attenuationColor={C.accent}
              attenuationDistance={2.5}
            />
          ) : (
            <meshPhysicalMaterial
              color={C.dim}
              roughness={0.18}
              metalness={0.6}
              clearcoat={1}
              transparent
              opacity={0.55}
              envMapIntensity={1.4}
              flatShading
            />
          )}
        </mesh>
        <lineSegments geometry={edges}>
          <lineBasicMaterial color={C.paper} transparent opacity={0.35} />
        </lineSegments>
      </group>
      <mesh ref={heart}>
        <icosahedronGeometry args={[0.32, 1]} />
        <meshBasicMaterial color={C.accent} toneMapped={false} />
      </mesh>
      <sprite ref={halo} scale={3.6}>
        <spriteMaterial map={halotex} color={C.accent} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <pointLight ref={light} color={C.accent} intensity={9} distance={7} decay={1.6} />
    </group>
  )
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
const PACKETS_PER_CHANNEL = 4

/** Quadratic Bézier from a channel node (p) to the core (origin), arcing via control point c. */
function bezier(out: THREE.Vector3, p: THREE.Vector3, c: THREE.Vector3, t: number) {
  const u = 1 - t
  return out.set(u * u * p.x + 2 * u * t * c.x, u * u * p.y + 2 * u * t * c.y, u * u * p.z + 2 * u * t * c.z)
}

function Channels({
  channels,
  showLabels,
  reducedMotion,
}: {
  channels: string[]
  showLabels: boolean
  reducedMotion: boolean
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
  // Flat diamond outline around each node.
  const diamondFrame = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.26, 0.26).rotateZ(Math.PI / 4)), [])
  useEffect(() => () => diamondFrame.dispose(), [diamondFrame])
  const labelRefs = useRef<(HTMLDivElement | null)[]>([])

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
          const c = C.signal.clone().lerp(C.accent, t * t).multiplyScalar(0.08 + 0.55 * t)
          colors.set([c.r, c.g, c.b], s * 3)
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        const material = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
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
    for (let i = 0; i < packetCount; i++) mesh.setColorAt(i, i % 3 === 0 ? C.accent : C.paper)
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
    const flowIn = clamp01((intro - 0.35) / 0.65)

    nodes.forEach((n, i) => {
      const a = n.angle0 + clock.elapsedTime * n.ring.speed * m
      const p = positions[i].set(Math.cos(a) * n.ring.radius, 0, Math.sin(a) * n.ring.radius).applyQuaternion(n.quat)
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
          const u = reducedMotion ? (k + 0.5) / PACKETS_PER_CHANNEL : (t * 0.2 + k / PACKETS_PER_CHANNEL + i * 0.137) % 1
          bezier(tmp.w, p, tmp.c, u)
          const size = Math.sin(Math.PI * u) * flowIn
          tmp.m.compose(tmp.w, tmp.q, tmp.s.setScalar(size))
          mesh.setMatrixAt(i * PACKETS_PER_CHANNEL + k, tmp.m)
        }
        mesh.instanceMatrix.needsUpdate = true
      }

      // Dim labels on the far side of the structure.
      const label = labelRefs.current[i]
      if (label && g) {
        g.getWorldPosition(tmp.w)
        label.style.opacity = String((0.35 + clamp01((tmp.w.z + 2) / 4) * 0.65) * flowIn)
      }
    })
  })

  return (
    <group>
      {RINGS.map((r, i) => (
        <group key={i} rotation={r.tilt}>
          <Line points={ringPoints(r.radius)} color={C.paper} lineWidth={1} transparent opacity={0.16 - i * 0.03} />
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
            <meshStandardMaterial color={C.accent} emissive={C.accent} emissiveIntensity={0.35} metalness={0.5} roughness={0.2} envMapIntensity={1.6} flatShading />
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.05, 0]} />
            <meshBasicMaterial color={i % 2 ? C.signal : C.paper} toneMapped={false} />
          </mesh>
          <lineSegments geometry={diamondFrame}>
            <lineBasicMaterial color={C.accent} transparent opacity={0.55} />
          </lineSegments>
          {showLabels && (
            <Html position={[0.24, 0.12, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
              <div
                ref={(el) => void (labelRefs.current[i] = el)}
                aria-hidden="true"
                className="t-label whitespace-nowrap text-[0.625rem] text-paper/80"
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

function GrowthRing({ count, reducedMotion }: { count: number; reducedMotion: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const group = useRef<THREE.Group>(null)
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
      c.copy(C.dim).lerp(C.signal, Math.min(1, k * 1.4) * 0.6).lerp(C.accent, Math.pow(k, 4))
      m.setColorAt(i, c)
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [count])

  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) }), [])

  useFrame(({ clock }, dt) => {
    const t = sceneTime(clock.elapsedTime, reducedMotion)
    const m = reducedMotion ? 0 : 1
    const grow = introAt(clock.elapsedTime, reducedMotion)
    if (group.current) group.current.rotation.y -= dt * 0.05 * m
    const im = mesh.current
    if (!im) return
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const g = easeOutExpo(clamp01((grow - 0.15 - (i / count) * 0.35) / 0.5))
      const h = base[i] * g * (1 + Math.sin(t * 1.3 - i * 0.35) * 0.07 * m)
      tmp.p.set(Math.cos(a) * radius, 0, Math.sin(a) * radius)
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
      <Line points={ringPoints(radius - 0.12, 120)} color={C.paper} lineWidth={1} transparent opacity={0.18} />
      <Line points={ringPoints(radius + 0.12, 120)} color={C.paper} lineWidth={1} transparent opacity={0.08} />
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
      const r = 3.5 + ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * 6
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
      <pointsMaterial color={C.paper} size={0.022} sizeAttenuation transparent opacity={0.45} depthWrite={false} />
    </points>
  )
}

// ─── Rig: layout, intro, pointer and scroll ─────────────────────────────────

function Rig({ children, progress, pointer, reducedMotion }: {
  children: React.ReactNode
  progress: RefObject<number>
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
    const p = progress.current ?? 0
    const px = reducedMotion ? 0 : pointer.current?.x ?? 0
    const py = reducedMotion ? 0 : pointer.current?.y ?? 0

    const o = outer.current
    if (o) {
      o.position.x = layout.x
      o.position.y = layout.y + p * 2.4
      o.scale.setScalar(layout.s * (0.72 + 0.28 * e) * (1 + p * 0.15))
      o.rotation.x = smooth(o.rotation.x, py * 0.14 + p * 0.55, 3, dt)
      o.rotation.z = smooth(o.rotation.z, -px * 0.06, 3, dt)
    }
    if (inner.current) {
      const spin = reducedMotion ? 0.5 : clock.elapsedTime * 0.035
      inner.current.rotation.y = smooth(inner.current.rotation.y, spin + px * 0.35 + (1 - e) * -1.4 + p * 0.9, 4, dt)
    }
    camera.position.z = 10 - p * 1.4
    camera.position.x = smooth(camera.position.x, px * 0.35, 2, dt)
    camera.position.y = smooth(camera.position.y, 0.2 + py * 0.2, 2, dt)
    camera.lookAt(layout.x * 0.25, layout.y * 0.3 + p * 1.2, 0)
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
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} color={C.paper} />
      <directionalLight position={[-6, -2, -4]} intensity={1.2} color={C.signal} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, -2]} rotation-x={Math.PI / 2} scale={[10, 1.5, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={2.4} position={[-6, 1, 1]} rotation-y={Math.PI / 2} scale={[2, 7, 1]} color={site.colors.signal} />
        <Lightformer form="rect" intensity={3.2} position={[6, -1, 2]} rotation-y={-Math.PI / 2} scale={[2, 6, 1]} color={site.colors.accent} />
        <Lightformer form="ring" intensity={1.2} position={[0, 0, 7]} scale={4} color="#ffffff" />
      </Environment>
    </>
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
  const [dpr, setDpr] = useState<number>(quality === 'high' ? 1.6 : 1.15)
  // High tier renders every frame while visible; low tier renders at 30 fps; paused when off-screen or motion is reduced.
  const animate = active && !reducedMotion
  const frameloop = animate && quality === 'high' ? 'always' : 'demand'

  return (
    <Canvas
      frameloop={frameloop}
      dpr={dpr}
      camera={{ fov: 35, position: [0, 0.2, 10], near: 0.1, far: 40 }}
      gl={{ antialias: quality === 'high', alpha: true, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        onReady?.()
      }}
      aria-hidden="true"
    >
      {quality === 'low' && <FrameCap fps={30} running={animate} />}
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(quality === 'high' ? 1.6 : 1.15)} />
      <fog attach="fog" args={[site.colors.ink, 8, 19]} />
      <Lights />
      <Rig progress={progress} pointer={pointer} reducedMotion={reducedMotion}>
        <Core quality={quality} reducedMotion={reducedMotion} />
        <Channels channels={channels} showLabels={quality === 'high'} reducedMotion={reducedMotion} />
        <GrowthRing count={quality === 'high' ? 64 : 40} reducedMotion={reducedMotion} />
      </Rig>
      <Dust count={quality === 'high' ? 520 : 200} reducedMotion={reducedMotion} />
    </Canvas>
  )
}
