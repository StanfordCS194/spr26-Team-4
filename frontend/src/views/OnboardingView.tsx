// Onboarding view: collects first-run goals and deterministically assigns a persona.

import { useMemo, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import {
  assignOnboardingCharacter,
  completeOnboarding,
  ONBOARDING_QUESTIONS,
  type OnboardingAnswers,
  type OnboardingResult,
} from '../lib/onboarding'
import { CHARACTER_LABELS, GLASS_CARD_CLASS, PAGE_CLASS, SHELL_CLASS } from '../lib/interviewUi'

type OnboardingViewProps = {
  onComplete: (result: OnboardingResult) => void
}

export function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<OnboardingAnswers>({})

  const question = ONBOARDING_QUESTIONS[questionIndex]
  const selectedOptionId = answers[question.id]

  // Derived progress is memoized because it scans the static question list from current answers.
  const answeredCount = useMemo(
    () => ONBOARDING_QUESTIONS.filter((item) => answers[item.id]).length,
    [answers],
  )

  const progressPercent = Math.round((answeredCount / ONBOARDING_QUESTIONS.length) * 100)
  const isLastQuestion = questionIndex === ONBOARDING_QUESTIONS.length - 1

  function selectOption(optionId: string) {
    // Store answers by question id so the flow is resilient if questions are reordered later.
    setAnswers((current) => ({
      ...current,
      [question.id]: optionId,
    }))
  }

  function continueOnboarding() {
    // Defensive guard: button is disabled, but this prevents keyboard/programmatic submits too.
    if (!selectedOptionId) return

    if (isLastQuestion) {
      // completeOnboarding handles final persistence and persona assignment.
      onComplete(completeOnboarding(answers))
      return
    }

    setQuestionIndex((current) => current + 1)
  }

  return (
    <div className={PAGE_CLASS}>
      <div className={`${SHELL_CLASS} flex min-h-svh items-center`}>
        <section className={`${GLASS_CARD_CLASS} mx-auto w-full max-w-3xl`}>
          <div className="mb-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-sky-200/80">
              First-time setup
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Match your practice session to your goals
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
              Answer three quick questions and we’ll start you with the interviewer style that
              best fits your prep.
            </p>
          </div>

          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span>
                Question {questionIndex + 1} of {ONBOARDING_QUESTIONS.length}
              </span>
              <span>{progressPercent}% complete</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">{question.prompt}</h2>

            <div className="mt-4 grid gap-3">
              {question.options.map((option) => {
                const selected = option.id === selectedOptionId

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectOption(option.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? 'border-sky-300/70 bg-sky-500/15 ring-1 ring-sky-300/45'
                        : 'border-white/10 bg-white/[0.03] hover:border-sky-300/35 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? 'border-sky-200 bg-sky-300 text-slate-950'
                            : 'border-white/25 bg-white/5 text-transparent'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      </span>

                      <span>
                        <span className="block font-medium text-white">{option.label}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-slate-400">
                          {option.helper}
                        </span>
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">
              Your answers are saved locally, so this only appears once.
            </p>

            <button
              type="button"
              disabled={!selectedOptionId}
              onClick={continueOnboarding}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/35 transition hover:from-sky-400 hover:via-indigo-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLastQuestion
                ? `Start with ${CHARACTER_LABELS[assignOnboardingCharacter(answers)]}`
                : 'Continue'}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}