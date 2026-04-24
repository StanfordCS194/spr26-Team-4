type VoiceOrbProps = {
  active: boolean
  volume: number
}

export function VoiceOrb({ active, volume }: VoiceOrbProps) {
  const scale = 1 + Math.min(0.35, volume * 0.9)
  const ringOpacity = active ? 0.85 : 0.25

  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <div
        className="absolute inset-0 rounded-full bg-violet-500/20 blur-2xl transition-opacity duration-500"
        style={{ opacity: active ? 1 : 0.35 }}
        aria-hidden
      />
      <div
        className="absolute rounded-full border-2 border-violet-300/60 transition-all duration-300 ease-out"
        style={{
          width: `${8 + scale * 5.5}rem`,
          height: `${8 + scale * 5.5}rem`,
          opacity: ringOpacity,
        }}
        aria-hidden
      />
      <div
        className="absolute rounded-full border border-indigo-300/30 transition-all duration-300 ease-out"
        style={{
          width: `${7 + scale * 4.2}rem`,
          height: `${7 + scale * 4.2}rem`,
          opacity: active ? 0.7 : 0.2,
        }}
        aria-hidden
      />
      <div
        className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-indigo-500 to-indigo-700 shadow-lg shadow-violet-900/40 ring-1 ring-white/20 transition-transform duration-300 ease-out"
        style={{ transform: `scale(${scale})` }}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
          {active ? 'Speaking' : 'Listening'}
        </span>
      </div>
    </div>
  )
}
