// Setup view: lets the applicant choose an interviewer persona and attach a resume.

import { type RefObject } from 'react'
import { Briefcase, Upload, User } from 'lucide-react'
import type { InterviewPhase } from '../hooks/useVapiInterview'
import type { InterviewCharacter } from '../lib/buildSystemPrompt'
import {
  CHARACTERS,
  GLASS_CARD_CLASS,
  SECONDARY_BUTTON_CLASS,
} from '../lib/interviewUi'

type SetupViewProps = {
  character: InterviewCharacter
  phase: InterviewPhase
  parsing: boolean
  resumeFileName: string | null
  resumeText: string
  fileInputRef: RefObject<HTMLInputElement | null>
  onCharacterChange: (character: InterviewCharacter) => void
  onPickFile: (file: File | null) => void
}

export function SetupView({
  character,
  phase,
  parsing,
  resumeFileName,
  resumeText,
  fileInputRef,
  onCharacterChange,
  onPickFile,
}: SetupViewProps) {
  return (
    <section className="mb-8 grid gap-6 xl:grid-cols-5">
      <div className={`${GLASS_CARD_CLASS} xl:col-span-3`}>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
          <User className="h-4 w-4" aria-hidden />
          Character
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CHARACTERS.map((c) => {
            const selected = character === c.id
            return (
              <button
                key={c.id}
                type="button"
                disabled={phase === 'in-call' || phase === 'connecting'}
                onClick={() => onCharacterChange(c.id)}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  selected
                    ? 'border-sky-300/70 bg-sky-500/15 ring-1 ring-sky-300/45'
                    : 'border-white/10 bg-white/[0.02] hover:border-sky-300/35 hover:bg-white/[0.06]'
                } disabled:opacity-60`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-white">{c.label}</span>
                  <span className="rounded-md border border-white/10 bg-white/10 px-2 py-0.5 text-xs text-sky-100">
                    {c.persona}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-snug text-slate-300">{c.blurb}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className={`${GLASS_CARD_CLASS} xl:col-span-2`}>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
          <Briefcase className="h-4 w-4" aria-hidden />
          Resume
        </h2>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,text/plain,application/pdf"
          className="hidden"
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={phase === 'in-call' || phase === 'connecting' || parsing}
            onClick={() => fileInputRef.current?.click()}
            className={`${SECONDARY_BUTTON_CLASS} border-sky-200/30 bg-sky-500/15 hover:bg-sky-500/25`}
          >
            <Upload className="h-4 w-4" aria-hidden />
            {parsing ? 'Reading file...' : 'Upload resume'}
          </button>
          {resumeFileName && (
            <span className="text-sm text-slate-300">
              {resumeFileName}
              {resumeText.trim() ? (
                <span className="ml-2 text-emerald-300">
                  ({resumeText.length.toLocaleString()} chars)
                </span>
              ) : null}
            </span>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Resume content is injected into the interviewer prompt. PDF extraction depends on
          embedded text; scanned-only pages may yield less content.
        </p>
      </div>
    </section>
  )
}
