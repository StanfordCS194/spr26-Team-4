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

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'focus',
    prompt: 'What do you most want to practice today?',
    options: [
      {
        id: 'technical-depth',
        label: 'Explaining technical decisions clearly',
        helper: 'Architecture, tradeoffs, debugging, and system design stories.',
        character: 'tech-lead',
      },
      {
        id: 'impact',
        label: 'Communicating impact and leadership',
        helper: 'Scope, outcomes, collaboration, and stakeholder alignment.',
        character: 'hiring-manager',
      },
    ],
  },
  {
    id: 'interview-type',
    prompt: 'Which interview are you preparing for?',
    options: [
      {
        id: 'engineering-round',
        label: 'A technical or engineering leadership round',
        helper: 'You expect follow-ups on implementation choices and technical judgment.',
        character: 'tech-lead',
      },
      {
        id: 'behavioral-round',
        label: 'A behavioral or team-fit round',
        helper: 'You expect follow-ups on ownership, teamwork, and business results.',
        character: 'hiring-manager',
      },
    ],
  },
  {
    id: 'feedback-style',
    prompt: 'What feedback style would help you most?',
    options: [
      {
        id: 'specificity',
        label: 'Push me for specifics and better technical examples',
        helper: 'Good for tightening vague project explanations.',
        character: 'tech-lead',
      },
      {
        id: 'storytelling',
        label: 'Help me make my stories sound concise and compelling',
        helper: 'Good for shaping answers around stakes, actions, and measurable outcomes.',
        character: 'hiring-manager',
      },
    ],
  },
]

export function loadOnboardingResult(): OnboardingResult | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OnboardingResult
    if (parsed?.assignedCharacter !== 'tech-lead' && parsed?.assignedCharacter !== 'hiring-manager') {
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
    { 'tech-lead': 0, 'hiring-manager': 0 } satisfies Record<InterviewCharacter, number>,
  )

  return votes['tech-lead'] > votes['hiring-manager'] ? 'tech-lead' : 'hiring-manager'
}
