// In-call view: shows the active voice orb and microphone/call controls.

import { Mic, MicOff, PhoneOff } from 'lucide-react'
import { VoiceOrb } from '../components/VoiceOrb'
import { GLASS_CARD_CLASS, SECONDARY_BUTTON_CLASS } from '../lib/interviewUi'

type InCallViewProps = {
  muted: boolean
  aiSpeaking: boolean
  volume: number
  onToggleMute: () => void
  onEndCall: () => void
}

export function InCallView({
  muted,
  aiSpeaking,
  volume,
  onToggleMute,
  onEndCall,
}: InCallViewProps) {
  return (
    <section className={`${GLASS_CARD_CLASS} text-center`}>
      <p className="mb-6 text-sm text-slate-400">Session in progress</p>

      <div className="mb-8 flex justify-center">
        {/* VoiceOrb is purely visual; call state and audio events stay in useVapiInterview. */}
        <VoiceOrb active={aiSpeaking} volume={volume} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
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
    </section>
  )
}