import type { Classe } from '../types'

/** Bandiera / globo della classe (SVG: le emoji-bandiera non si vedono su Windows) */
export function IconaClasse({ classe, size = 40 }: { classe: Classe; size?: number }) {
  if (classe === 3) return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>🌍</span>
  const h = (size * 2) / 3
  if (classe === 1)
    return (
      <svg width={size} height={h} viewBox="0 0 3 2" className="rounded-sm shadow-sm shrink-0">
        <rect width="1" height="2" fill="#009246" /><rect x="1" width="1" height="2" fill="#fff" /><rect x="2" width="1" height="2" fill="#ce2b37" />
      </svg>
    )
  const stelle = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6
    return <circle key={i} cx={1.5 + 0.6 * Math.sin(a)} cy={1 - 0.6 * Math.cos(a)} r={0.07} fill="#ffcc00" />
  })
  return (
    <svg width={size} height={h} viewBox="0 0 3 2" className="rounded-sm shadow-sm shrink-0">
      <rect width="3" height="2" fill="#003399" />{stelle}
    </svg>
  )
}
