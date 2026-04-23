type VoiceOrbProps = {
  active: boolean
  volume: number
}

export function VoiceOrb({ active, volume }: VoiceOrbProps) {
  const scale = 1 + Math.min(0.35, volume * 0.9)
  const ringOpacity = active ? 0.85 : 0.25

  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <div
        className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl transition-opacity duration-500"
        style={{ opacity: active ? 1 : 0.35 }}
        aria-hidden
      />
      <div
        className="absolute rounded-full border-2 border-violet-400/60 transition-all duration-300 ease-out"
        style={{
          width: `${8 + scale * 5.5}rem`,
          height: `${8 + scale * 5.5}rem`,
          opacity: ringOpacity,
        }}
        aria-hidden
      />
      <div
        className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/30 transition-transform duration-300 ease-out"
        style={{ transform: `scale(${scale})` }}
      >
        <span className="text-sm font-medium tracking-wide text-white/90">
          {active ? 'Speaking' : 'Listening'}
        </span>
      </div>
    </div>
  )
}
