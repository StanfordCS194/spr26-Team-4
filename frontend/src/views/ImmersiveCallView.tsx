// Full-screen in-call view: large voice orb with only call controls visible.

import { useEffect } from 'react'
import { Mic, MicOff, Minimize2, PhoneOff } from 'lucide-react'
import { VoiceOrb } from '../components/VoiceOrb'
import { PAGE_CLASS, SECONDARY_BUTTON_CLASS } from '../lib/interviewUi'

type ImmersiveCallViewProps = {
  muted: boolean
  aiSpeaking: boolean
  volume: number
  onToggleMute: () => void
  onEndCall: () => void
  onExitImmersive: () => void
}

export function ImmersiveCallView({
  muted,
  aiSpeaking,
  volume,
  onToggleMute,
  onEndCall,
  onExitImmersive,
}: ImmersiveCallViewProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onExitImmersive()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onExitImmersive])

  return (
    <div className={`${PAGE_CLASS} fixed inset-0 z-50 flex flex-col`}>
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={onExitImmersive}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Exit immersive mode"
        >
          <Minimize2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <VoiceOrb active={aiSpeaking} volume={volume} size="lg" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 px-4 pb-10 pt-4">
        <button type="button" onClick={onToggleMute} className={SECONDARY_BUTTON_CLASS}>
          {muted ? (
            <>
              <MicOff className="h-4 w-4" aria-hidden />
              Unmute mic
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" aria-hidden />
              Mute mic
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onEndCall}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/20 px-5 py-2.5 text-sm font-medium text-rose-100 transition hover:bg-rose-500/30"
        >
          <PhoneOff className="h-4 w-4" aria-hidden />
          End call
        </button>
      </div>
    </div>
  )
}
