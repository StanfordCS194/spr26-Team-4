import { useCallback, useRef, useState } from 'react'
import _VapiSDK from '@vapi-ai/web'
// Vite pre-bundles @vapi-ai/web as `export default require_vapi()`, which returns the
// CJS exports object { __esModule: true, default: VapiClass } instead of the class itself.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Vapi = ((_VapiSDK as any).default ?? _VapiSDK) as typeof _VapiSDK
import { buildAssistantConfig } from '../lib/buildAssistantConfig'
import type { InterviewCharacter } from '../lib/buildSystemPrompt'
import { scoreFromUserTranscript, simpleSentiment } from '../lib/reportScoring'
import {
  extractUserSpeech,
  summarizeFromConversation,
  summarizeFromTranscriptChunks,
} from '../lib/transcriptUtils'
import {
  saveSessionLocal,
  saveSessionRemote,
  type InterviewSessionRecord,
} from '../lib/sessionPersistence'

export type InterviewPhase = 'setup' | 'connecting' | 'in-call' | 'report'

export type PostInterviewReport = {
  durationSeconds: number
  transcriptSummary: string
  clarityScore: number
  confidenceRating: number
  topImprovements: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
}

type TranscriptChunk = { role: string; text: string }

/** Daily `join()` often waits on mic + WebRTC; if this never completes, the UI would hang on "Connecting…". */
const START_TIMEOUT_MS = 25_000

const STAGE_LABELS: Record<string, string> = {
  'initialization': 'Initializing…',
  'web-call-creation': 'Creating session…',
  'daily-call-object-creation': 'Setting up audio…',
  'mobile-permissions': 'Checking permissions…',
  'daily-call-join': 'Joining audio room…',
  'video-recording-setup': 'Starting recording…',
  'audio-observer-setup': 'Activating audio…',
  'audio-processing-setup': 'Applying audio processing…',
}

async function requestMicOnce(): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  stream.getTracks().forEach((t) => t.stop())
}

export function useVapiInterview() {
  const [phase, setPhase] = useState<InterviewPhase>('setup')
  const [muted, setMuted] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [volume, setVolume] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<PostInterviewReport | null>(null)
  const [connectingStage, setConnectingStage] = useState<string>('')

  const vapiRef = useRef<InstanceType<typeof _VapiSDK> | null>(null)
  const callStartedAt = useRef<number | null>(null)
  const connectStartedAt = useRef<number | null>(null)
  const transcriptChunks = useRef<TranscriptChunk[]>([])
  const conversationRef = useRef<{ role?: string; content?: string | null }[]>(
    [],
  )
  const characterRef = useRef<InterviewCharacter>('tech-lead')
  const finalizedRef = useRef(false)

  const detachVapi = useCallback(() => {
    const v = vapiRef.current
    if (v) {
      v.removeAllListeners()
      vapiRef.current = null
    }
  }, [])

  const endCall = useCallback(() => {
    const v = vapiRef.current
    if (v) {
      try {
        v.end()
      } catch {
        void v.stop()
      }
    }
  }, [])

  const finalizeSession = useCallback(() => {
    if (finalizedRef.current) return
    finalizedRef.current = true

    const character = characterRef.current
    const started = callStartedAt.current
    const fallbackStart = connectStartedAt.current
    const endMs = Date.now()
    const durationSeconds = started
      ? Math.max(1, Math.round((endMs - started) / 1000))
      : fallbackStart
        ? Math.max(0, Math.round((endMs - fallbackStart) / 1000))
        : 0

    const conv = conversationRef.current
    const chunks = transcriptChunks.current

    const transcriptSummary =
      conv.length > 0
        ? summarizeFromConversation(conv)
        : summarizeFromTranscriptChunks(chunks)

    const userSpeech = extractUserSpeech(chunks)
    const sentiment = simpleSentiment(userSpeech || transcriptSummary)
    const { clarityScore, confidenceRating, topImprovements } =
      scoreFromUserTranscript(userSpeech || transcriptSummary)

    const session: PostInterviewReport = {
      durationSeconds,
      transcriptSummary:
        transcriptSummary ||
        '(No transcript captured — check microphone permissions and Vapi client messages.)',
      clarityScore,
      confidenceRating,
      topImprovements,
      sentiment,
    }

    setReport(session)
    setPhase('report')
    setAiSpeaking(false)
    setVolume(0)
    setConnectingStage('')

    const record: InterviewSessionRecord = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      durationSeconds: session.durationSeconds,
      transcriptSummary: session.transcriptSummary,
      sentiment: session.sentiment,
      character,
      clarityScore: session.clarityScore,
      confidenceRating: session.confidenceRating,
      topImprovements: session.topImprovements,
    }
    saveSessionLocal(record)
    void saveSessionRemote(record)

    detachVapi()
    callStartedAt.current = null
    connectStartedAt.current = null
    transcriptChunks.current = []
    conversationRef.current = []
  }, [detachVapi])

  const handleClientMessage = useCallback((message: Record<string, unknown>) => {
    if (message.type === 'transcript') {
      const role = String(message.role || '')
      const text = String(message.transcript || '')
      const tType = String(message.transcriptType || '')
      if (!text.trim()) return
      if (tType === 'final') {
        const last = transcriptChunks.current[transcriptChunks.current.length - 1]
        if (last && last.role === role && last.text === text) return
        transcriptChunks.current.push({ role, text })
      }
      return
    }

    if (message.type === 'conversation-update') {
      const openai = message.messagesOpenAIFormatted as
        | { role?: string; content?: string | null }[]
        | undefined
      const alt = message.messages as
        | { role?: string; content?: string | null }[]
        | undefined
      const pick = Array.isArray(openai) && openai.length ? openai : alt
      if (Array.isArray(pick) && pick.length) {
        conversationRef.current = pick
      }
    }
  }, [])

  const startCall = useCallback(
    async (character: InterviewCharacter, resumeText: string) => {
      setError(null)
      setReport(null)
      setMuted(false)
      setConnectingStage('')
      finalizedRef.current = false
      characterRef.current = character
      transcriptChunks.current = []
      conversationRef.current = []

      const key = import.meta.env.VITE_VAPI_PUBLIC_KEY
      if (!key) {
        setError(
          'Missing VITE_VAPI_PUBLIC_KEY. Add it to interview-app/.env and restart the dev server.',
        )
        return
      }

      setPhase('connecting')
      connectStartedAt.current = Date.now()
      detachVapi()
      const vapi = new Vapi(key)
      vapiRef.current = vapi

      // `call-start` often fires only after a Daily "listening" app message, which can be late
      // or never arrive in some environments. `call-start-success` fires when the SDK finishes
      // joining the room, so we use both to avoid the UI stuck on "Connecting…".
      vapi.on('call-start-success', () => {
        setConnectingStage('')
        setPhase('in-call')
        if (callStartedAt.current == null) {
          callStartedAt.current = Date.now()
        }
      })

      vapi.on('call-start', () => {
        setConnectingStage('')
        setPhase('in-call')
        callStartedAt.current = Date.now()
      })

      vapi.on('call-start-failed', (ev) => {
        setConnectingStage('')
        setPhase('setup')
        setError(ev.error || 'Call failed to start')
        finalizedRef.current = false
        connectStartedAt.current = null
        detachVapi()
      })

      vapi.on('call-start-progress', (e: unknown) => {
        if (e && typeof e === 'object' && 'stage' in e) {
          const stage = (e as { stage: string; status?: string }).stage
          const status = (e as { status?: string }).status
          console.debug('[Vapi]', e)
          if (status === 'started' || status === 'completed') {
            setConnectingStage(STAGE_LABELS[stage] ?? stage)
          }
        }
      })

      vapi.on('call-end', () => {
        finalizeSession()
      })

      vapi.on('speech-start', () => setAiSpeaking(true))
      vapi.on('speech-end', () => setAiSpeaking(false))
      vapi.on('volume-level', (v: number) => {
        setVolume(v)
        if (v > 0.02) setAiSpeaking(true)
      })

      vapi.on('message', (m: unknown) => {
        if (m && typeof m === 'object') {
          handleClientMessage(m as Record<string, unknown>)
        }
      })

      vapi.on('error', (e: unknown) => {
        const msg =
          e && typeof e === 'object' && 'error' in e
            ? JSON.stringify((e as { error: unknown }).error)
            : String(e)
        setError(msg)
      })

      try {
        try {
          await requestMicOnce()
        } catch {
          setPhase('setup')
          connectStartedAt.current = null
          setError(
            'Microphone access was blocked or unavailable. Allow the mic for this site, then try again.',
          )
          detachVapi()
          return
        }

        const assistant = buildAssistantConfig(character, resumeText)

        let timeoutId: ReturnType<typeof setTimeout> | undefined
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () =>
              reject(
                new Error(
                  `No response from the voice service after ${START_TIMEOUT_MS / 1000}s. Check VPN/firewall (WebRTC), try another network or browser, and confirm your Vapi key is valid.`,
                ),
              ),
            START_TIMEOUT_MS,
          )
        })

        try {
          await Promise.race([vapi.start(assistant), timeoutPromise])
        } finally {
          if (timeoutId !== undefined) clearTimeout(timeoutId)
        }

        // Guard: if the call failed during start(), vapiRef is already null
        if (vapiRef.current) {
          try {
            vapi.setMuted(false)
          } catch {
            // call ended before fully starting — safe to ignore
          }
        }
      } catch (e) {
        setConnectingStage('')
        setPhase('setup')
        setError(e instanceof Error ? e.message : String(e))
        try {
          await vapi.stop()
        } catch {
          /* ignore */
        }
        detachVapi()
      }
    },
    [detachVapi, finalizeSession, handleClientMessage],
  )

  const toggleMute = useCallback(() => {
    const v = vapiRef.current
    const next = !muted
    setMuted(next)
    if (v) v.setMuted(next)
  }, [muted])

  const resetToSetup = useCallback(() => {
    setPhase('setup')
    setReport(null)
    setError(null)
    setAiSpeaking(false)
    setVolume(0)
    setConnectingStage('')
  }, [])

  return {
    phase,
    muted,
    aiSpeaking,
    volume,
    error,
    report,
    connectingStage,
    startCall,
    endCall,
    toggleMute,
    resetToSetup,
  }
}
