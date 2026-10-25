import { cn } from '../../lib/cn'

/**
 * Static illustration of the growth engine. Shown while the 3D scene loads,
 * and permanently when WebGL is unavailable. Same composition as the scene,
 * so the hand-off is seamless and the layout never shifts.
 */
export function HeroFallback({ channels, className }: { channels: string[]; className?: string }) {
  const rings = [
    { rx: 190, ry: 62, rot: -16 },
    { rx: 250, ry: 70, rot: 20 },
    { rx: 310, ry: 110, rot: -6 },
  ]
  const bars = 56
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-x-0 top-0 h-[100svh] min-h-[640px]', className)}>
      <svg
        viewBox="0 0 800 800"
        className="absolute left-1/2 top-[6%] w-[min(560px,118vw)] -translate-x-1/2 sm:top-[2%] lg:left-auto lg:right-[-4%] lg:top-1/2 lg:w-[min(58vw,860px)] lg:-translate-x-0 lg:-translate-y-1/2"
      >
        <defs>
          <radialGradient id="fb-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="fb-flow" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--brand-signal)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Growth ring */}
        <g transform="translate(400 560)">
          {Array.from({ length: bars }, (_, i) => {
            const a = (i / bars) * Math.PI * 2
            const k = i / (bars - 1)
            const h = 6 + Math.pow(k, 2.4) * 120
            const x = Math.cos(a) * 170
            const y = Math.sin(a) * 46
            return (
              <rect
                key={i}
                x={x - 1.5}
                y={y - h}
                width="3"
                height={h}
                fill={k > 0.82 ? 'var(--brand-accent)' : 'var(--brand-paper)'}
                fillOpacity={k > 0.82 ? 0.9 : 0.12 + k * 0.35}
              />
            )
          })}
          <ellipse rx="160" ry="42" fill="none" stroke="var(--brand-paper)" strokeOpacity="0.18" />
        </g>

        <circle cx="400" cy="400" r="200" fill="url(#fb-halo)" />

        {rings.map((r, i) => (
          <ellipse
            key={i}
            cx="400"
            cy="400"
            rx={r.rx}
            ry={r.ry}
            fill="none"
            stroke="var(--brand-paper)"
            strokeOpacity={0.18 - i * 0.04}
            transform={`rotate(${r.rot} 400 400)`}
          />
        ))}

        {/* Channel nodes and their streams into the core */}
        {channels.map((label, i) => {
          const r = rings[i % rings.length]
          const a = (i / channels.length) * Math.PI * 2 + 0.4
          const rot = (r.rot * Math.PI) / 180
          const ex = Math.cos(a) * r.rx
          const ey = Math.sin(a) * r.ry
          const x = 400 + ex * Math.cos(rot) - ey * Math.sin(rot)
          const y = 400 + ex * Math.sin(rot) + ey * Math.cos(rot)
          const cx = 400 + (x - 400) * 0.4
          const cy = 400 + (y - 400) * 0.4 - 90
          return (
            <g key={label + i}>
              <path d={`M${x} ${y} Q${cx} ${cy} 400 400`} fill="none" stroke="url(#fb-flow)" strokeWidth="1.2" />
              <rect x={x - 11} y={y - 11} width="22" height="22" fill="none" stroke="var(--brand-accent)" strokeOpacity="0.6" transform={`rotate(45 ${x} ${y})`} />
              <rect x={x - 6} y={y - 6} width="12" height="12" fill="var(--brand-accent)" transform={`rotate(45 ${x} ${y})`} />
              <rect x={x - 2.5} y={y - 2.5} width="5" height="5" fill="var(--brand-paper)" transform={`rotate(45 ${x} ${y})`} />
              <text
                x={x + 20}
                y={y - 10}
                fill="var(--brand-paper)"
                fillOpacity="0.7"
                fontFamily="var(--brand-font-mono)"
                fontSize="13"
                letterSpacing="1"
                className="hidden sm:inline"
              >
                <tspan fill="var(--brand-accent)">{String(i + 1).padStart(2, '0')}</tspan> {label.toUpperCase()}
              </text>
            </g>
          )
        })}

        {/* Faceted core */}
        <g transform="translate(400 400)">
          <polygon points="0,-78 68,-39 68,39 0,78 -68,39 -68,-39" fill="var(--brand-paper)" fillOpacity="0.06" stroke="var(--brand-paper)" strokeOpacity="0.4" />
          <path d="M0,-78 L0,0 L68,39 M0,0 L-68,39 M-68,-39 L0,0 L68,-39" stroke="var(--brand-paper)" strokeOpacity="0.2" fill="none" />
          <circle r="26" fill="var(--brand-accent)" />
        </g>
      </svg>
    </div>
  )
}
