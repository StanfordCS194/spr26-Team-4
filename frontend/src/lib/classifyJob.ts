import { apiUrl, getApiError } from './apiClient'
import type { InterviewCharacter } from './buildSystemPrompt'

export type ClassifyJobResult = {
  agentType: InterviewCharacter
  reasoning: string
}

const VALID_CHARACTERS: InterviewCharacter[] = ['tech', 'finance', 'consulting', 'other']

function isClassifyJobResult(value: unknown): value is ClassifyJobResult {
  if (!value || typeof value !== 'object') return false
  const data = value as ClassifyJobResult
  return (
    VALID_CHARACTERS.includes(data.agentType) &&
    typeof data.reasoning === 'string'
  )
}

// POSTs the job description to the backend classify endpoint and returns the recommended agent type
export async function classifyJobDescription(jobDescription: string): Promise<ClassifyJobResult> {
  const response = await fetch(apiUrl('/api/report/classify'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobDescription }),
  })

  if (!response.ok) {
    throw new Error(await getApiError(response, 'Could not classify job description.'))
  }

  const payload = (await response.json()) as unknown
  if (!isClassifyJobResult(payload)) {
    throw new Error('Backend returned an invalid classify response.')
  }

  return payload
}
