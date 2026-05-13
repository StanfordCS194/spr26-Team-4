type VoiceOrbProps = {
  active: boolean
  volume: number
}

const PARTICLES = [
  { size: 18, color: 'bg-cyan-300', left: '19%', top: '24%', delay: '0s', duration: '3.7s' },
  { size: 12, color: 'bg-fuchsia-300', left: '68%', top: '18%', delay: '-0.8s', duration: '4.4s' },
  { size: 22, color: 'bg-violet-300', left: '72%', top: '62%', delay: '-1.4s', duration: '4s' },
  { size: 10, color: 'bg-sky-200', left: '34%', top: '72%', delay: '-2.1s', duration: '3.4s' },
  { size: 15, color: 'bg-pink-300', left: '49%', top: '28%', delay: '-1.1s', duration: '4.8s' },
  { size: 9, color: 'bg-indigo-200', left: '25%', top: '55%', delay: '-2.7s', duration: '3.9s' },
  { size: 14, color: 'bg-emerald-200', left: '59%', top: '75%', delay: '-0.4s', duration: '4.2s' },
  { size: 11, color: 'bg-amber-200', left: '78%', top: '39%', delay: '-1.8s', duration: '3.6s' },
]

const BAR_HEIGHTS = [0.45, 0.7, 0.95, 0.62, 0.82, 0.52, 0.72]

export function VoiceOrb({ active, volume }: VoiceOrbProps) {
  const energy = active ? Math.min(1, Math.max(0.18, volume)) : 0
  const scale = 1 + Math.min(0.18, energy * 0.28)

  return (
    <div
      className="relative flex h-48 w-48 items-center justify-center overflow-visible"
      aria-label={active ? 'Interviewer speaking' : 'Interviewer listening'}
      role="img"
    >
      {active && (
        <>
          <div
            className="absolute inset-[-18%] rounded-full bg-[conic-gradient(from_120deg,_rgba(34,211,238,0.42),_rgba(168,85,247,0.55),_rgba(236,72,153,0.48),_rgba(59,130,246,0.44),_rgba(34,211,238,0.42))] blur-2xl opacity-85"
            aria-hidden
          />
          <div
            className="absolute inset-[-4%] rounded-full border border-cyan-200/30 opacity-80"
            style={{ animation: 'voice-orb-pulse 2.4s ease-in-out infinite' }}
            aria-hidden
          />
          {PARTICLES.map((particle, index) => (
            <span
              key={`${particle.left}-${particle.top}`}
              className="absolute"
              style={{
                left: particle.left,
                top: particle.top,
                animation: `voice-orb-drift ${particle.duration} ease-in-out ${particle.delay} infinite alternate`,
              }}
              aria-hidden
            >
              <span
                className={`block rounded-full ${particle.color} shadow-lg shadow-white/20`}
                style={{
                  width: particle.size,
                  height: particle.size,
                  opacity: 0.54 + (index % 3) * 0.12,
                }}
              />
            </span>
          ))}
        </>
      )}

      <div
        className={`absolute rounded-full border transition-all duration-500 ease-out ${
          active ? 'border-fuchsia-200/50 bg-fuchsia-400/10' : 'border-sky-300/20 bg-sky-950/20'
        }`}
        style={{
          width: active ? `${10.5 + energy * 1.8}rem` : '11rem',
          height: active ? `${10.5 + energy * 1.8}rem` : '11rem',
        }}
        aria-hidden
      />
      <div
        className={`absolute rounded-full border transition-all duration-500 ease-out ${
          active ? 'border-cyan-200/40 bg-cyan-300/10' : 'border-cyan-300/15 bg-cyan-950/15'
        }`}
        style={{
          width: active ? `${8.9 + energy * 1.4}rem` : '9.5rem',
          height: active ? `${8.9 + energy * 1.4}rem` : '9.5rem',
        }}
        aria-hidden
      />
      <div
        className={`relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full ring-1 transition-all duration-300 ease-out ${
          active
            ? 'bg-[radial-gradient(circle_at_35%_30%,_rgba(255,255,255,0.85),_rgba(103,232,249,0.5)_22%,_rgba(168,85,247,0.75)_48%,_rgba(236,72,153,0.65)_72%,_rgba(49,46,129,0.95)_100%)] shadow-2xl shadow-fuchsia-500/35 ring-white/30'
            : 'bg-[radial-gradient(circle_at_35%_30%,_rgba(186,230,253,0.55),_rgba(14,116,144,0.34)_42%,_rgba(15,23,42,0.96)_100%)] shadow-md shadow-sky-950/40 ring-sky-200/10'
        }`}
        style={{ transform: `scale(${scale})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(255,255,255,0.26),_transparent_38%,_rgba(255,255,255,0.12)_68%,_transparent)]" />
        {active ? (
          <div className="relative flex h-14 items-center gap-1.5" aria-hidden>
            {BAR_HEIGHTS.map((height, index) => (
              <span
                key={height}
                className="w-2 rounded-full bg-white/90 shadow-sm shadow-cyan-100/50"
                style={{
                  height: `${1.1 + height * 2.8 + energy * 1.5}rem`,
                  animation: `voice-orb-bar ${0.68 + index * 0.04}s ease-in-out ${index * -0.09}s infinite alternate`,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="relative h-12 w-12 rounded-full border border-sky-100/20 bg-sky-100/5" aria-hidden />
        )}
      </div>
    </div>
  )
}
