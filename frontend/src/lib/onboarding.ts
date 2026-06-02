import type { InterviewCharacter } from './buildSystemPrompt'

export type OnboardingOption = {
  id: string
  label: string
  helper: string
  character: InterviewCharacter
}

export type OnboardingQuestion = {
  id: string
  prompt: string
  options: OnboardingOption[]
}

export type OnboardingAnswers = Record<string, string>

export type OnboardingResult = {
  completedAt: string
  assignedCharacter: InterviewCharacter
  answers: OnboardingAnswers
}

const LOCAL_KEY = 'interview_app_onboarding_v1'

const VALID_CHARACTERS: InterviewCharacter[] = ['tech', 'finance', 'consulting', 'other']

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'focus',
    prompt: 'What do you most want to practice today?',
    options: [
      {
        id: 'technical-depth',
        label: 'Explaining technical decisions clearly',
        helper: 'Architecture, tradeoffs, debugging, and system design stories.',
        character: 'tech',
      },
      {
        id: 'analytics',
        label: 'Quantitative and analytical storytelling',
        helper: 'Deals, models, metrics, and precision under pressure.',
        character: 'finance',
      },
      {
        id: 'structured-thinking',
        label: 'Structured problem-solving and client impact',
        helper: 'Hypothesis-driven answers and crisp recommendations.',
        character: 'consulting',
      },
    ],
  },
  {
    id: 'interview-type',
    prompt: 'Which interview are you preparing for?',
    options: [
      {
        id: 'engineering-round',
        label: 'A technical or product role',
        helper: 'You expect follow-ups on implementation choices and technical judgment.',
        character: 'tech',
      },
      {
        id: 'finance-round',
        label: 'A finance or investing role',
        helper: 'You expect follow-ups on analysis, deals, and stakeholder management.',
        character: 'finance',
      },
      {
        id: 'consulting-round',
        label: 'A consulting or strategy role',
        helper: 'You expect follow-ups on structure, impact, and communication.',
        character: 'consulting',
      },
    ],
  },
  {
    id: 'feedback-style',
    prompt: 'What feedback style would help you most?',
    options: [
      {
        id: 'specificity',
        label: 'Push me for specifics and better examples',
        helper: 'Good for tightening vague project explanations.',
        character: 'tech',
      },
      {
        id: 'precision',
        label: 'Help me sound precise and numbers-aware',
        helper: 'Good for finance-style rigor and clarity.',
        character: 'finance',
      },
      {
        id: 'storytelling',
        label: 'Help me make my stories concise and compelling',
        helper: 'Good for shaping answers around stakes, actions, and outcomes.',
        character: 'other',
      },
    ],
  },
]

export function loadOnboardingResult(): OnboardingResult | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OnboardingResult
    if (!VALID_CHARACTERS.includes(parsed?.assignedCharacter)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function completeOnboarding(answers: OnboardingAnswers): OnboardingResult {
  const assignedCharacter = assignOnboardingCharacter(answers)
  const result: OnboardingResult = {
    completedAt: new Date().toISOString(),
    assignedCharacter,
    answers,
  }
  localStorage.setItem(LOCAL_KEY, JSON.stringify(result))
  return result
}

export function assignOnboardingCharacter(answers: OnboardingAnswers): InterviewCharacter {
  const votes = ONBOARDING_QUESTIONS.reduce(
    (counts, question) => {
      const selected = question.options.find((option) => option.id === answers[question.id])
      if (selected) counts[selected.character] += 1
      return counts
    },
    { tech: 0, finance: 0, consulting: 0, other: 0 } satisfies Record<InterviewCharacter, number>,
  )

  const ranked = (Object.entries(votes) as [InterviewCharacter, number][]).sort(
    (a, b) => b[1] - a[1],
  )
  return ranked[0]?.[1] ? ranked[0][0] : 'other'
}
