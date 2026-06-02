// Setup view: lets the applicant choose an interviewer persona and attach a resume.

import { useState, type RefObject } from 'react'
import { Briefcase, ChevronDown, ChevronUp, Sparkles, Target, Upload, User } from 'lucide-react'
import type { InterviewPhase } from '../hooks/useVapiInterview'
import type { InterviewCharacter } from '../lib/buildSystemPrompt'
import type { ClassifyJobResult } from '../lib/classifyJob'
import {
  CHARACTERS,
  CHARACTER_LABELS,
  GLASS_CARD_CLASS,
  SECONDARY_BUTTON_CLASS,
} from '../lib/interviewUi'

type SetupViewProps = {
  character: InterviewCharacter
  phase: InterviewPhase
  parsing: boolean
  resumeFileName: string | null
  resumeText: string
  jobDescriptionText: string
  fileInputRef: RefObject<HTMLInputElement | null>
  classifying: boolean
  recommendedAgent: ClassifyJobResult | null
  onCharacterChange: (character: InterviewCharacter) => void
  onJobDescriptionChange: (text: string) => void
  onRecommendInterviewer: () => void
  onPickFile: (file: File | null) => void
}

export function SetupView({
  character,
  phase,
  parsing,
  resumeFileName,
  resumeText,
  jobDescriptionText,
  fileInputRef,
  classifying,
  recommendedAgent,
  onCharacterChange,
  onJobDescriptionChange,
  onRecommendInterviewer,
  onPickFile,
}: SetupViewProps) {
  const [jobDescriptionOpen, setJobDescriptionOpen] = useState(false)
  const inputsLocked = phase === 'in-call' || phase === 'connecting'

  return (
    <section className="mb-8 grid gap-6 xl:grid-cols-5">
      <div className={`${GLASS_CARD_CLASS} xl:col-span-3`}>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
          <User className="h-4 w-4" aria-hidden />
          Interviewer
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          {CHARACTERS.map((c) => {
            const selected = character === c.id

            return (
              <button
                key={c.id}
                type="button"
                // Lock persona changes while connecting/in-call so prompt doesn't change mid-call
                disabled={inputsLocked}
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
            disabled={inputsLocked || parsing}
            // Hidden native input preserves browser file handling while allowing custom styling.
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

        <div className="mt-6 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => setJobDescriptionOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold uppercase tracking-wide text-slate-300"
            aria-expanded={jobDescriptionOpen}
          >
            <span className="flex items-center gap-2">
              <Target className="h-4 w-4" aria-hidden />
              Target role (optional)
            </span>
            {jobDescriptionOpen ? (
              <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
            )}
          </button>

          {jobDescriptionOpen && (
            <div className="mt-3">
              <textarea
                value={jobDescriptionText}
                disabled={inputsLocked}
                onChange={(e) => onJobDescriptionChange(e.target.value)}
                placeholder="Paste a job description to tailor questions to a specific company or role…"
                rows={6}
                className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-relaxed text-slate-200 placeholder:text-slate-500 focus:border-sky-300/40 focus:outline-none focus:ring-1 focus:ring-sky-300/30 disabled:opacity-60"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!jobDescriptionText.trim() || classifying || inputsLocked}
                  onClick={onRecommendInterviewer}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-xs font-medium text-violet-100 transition hover:bg-violet-500/25 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  {classifying ? 'Analyzing…' : 'Recommend interviewer'}
                </button>
                {recommendedAgent && (
                  <p className="text-xs text-slate-400">
                    Recommended:{' '}
                    <span className="text-sky-300">
                      {CHARACTER_LABELS[recommendedAgent.agentType]}
                    </span>
                    {' — '}
                    {recommendedAgent.reasoning}
                  </p>
                )}
              </div>
              {jobDescriptionText.trim() ? (
                <p className="mt-2 text-xs text-emerald-300">
                  {jobDescriptionText.trim().length.toLocaleString()} chars will be added to the
                  interviewer prompt
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-400">
                  Job description text is injected into the interviewer prompt alongside your resume.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
