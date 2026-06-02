import type { CreateAssistantDTO } from '@vapi-ai/web/api'
import type { InterviewCharacter } from './buildSystemPrompt'
import { buildSystemPrompt } from './buildSystemPrompt'

const FIRST_MESSAGE: Record<InterviewCharacter, string> = {
  tech: "Hi — I'm Marissa, a senior engineering manager. I'll ask three behavioral questions in STAR format with quick micro-feedback after each. Let's begin.",
  finance: "Hi — I'm David, a VP here. I'll run three behavioral questions focused on your finance experience, with brief feedback after each. Ready when you are.",
  consulting: "Hi — I'm Sophie, an engagement manager. I'll ask three structured behavioral questions and give micro-feedback after each. Let's get started.",
  other: "Hi — I'm Alex, your interviewer today. I'll ask three behavioral questions with quick feedback after each. Let's begin.",
}

// Update these voice IDs with valid 11labs voices from your Vapi dashboard
const VOICE: Record<InterviewCharacter, string> = {
  tech: 'marissa',
  finance: 'paul',
  consulting: 'marissa', // replace with a valid 11labs voice ID for Sophie
  other: 'paul',         // replace with a valid 11labs voice ID for Alex
}

// this composes the complete Vapi assistant config by passing all three string inputs (character, resume, job) to buildSystemPrompt
// then it wires the result into the Claude model's system message with voice and transcriber settings
export function buildAssistantConfig(
  character: InterviewCharacter,
  resumeText: string,
  jobDescription: string,
): CreateAssistantDTO {
  const system = buildSystemPrompt(character, resumeText, jobDescription)

  return {
    name: 'InterviewApp',
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en',
    },
    model: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'system', content: system }],
    },
    voice: {
      provider: '11labs',
      voiceId: VOICE[character],
    },
    firstMessage: FIRST_MESSAGE[character],
    firstMessageMode: 'assistant-speaks-first',
    maxDurationSeconds: 600,
    clientMessages: ['transcript', 'conversation-update'] as unknown as CreateAssistantDTO['clientMessages'],
    endCallPhrases: ['Best of luck', 'Good luck with your', 'Best of luck with your'] //added phrases that indicate the call should automatically be ended
  }
}