import type { CreateAssistantDTO } from '@vapi-ai/web/api'
import type { InterviewCharacter } from './buildSystemPrompt'
import { buildSystemPrompt } from './buildSystemPrompt'

const FIRST_MESSAGE: Record<InterviewCharacter, string> = {
  tech: "Hi, I'm Marissa. I'll be your engineering interviewer today. We'll keep this focused: three STAR-style questions, and after each answer I'll give one quick note to help you sharpen it. Let's begin.",
  finance: "Hi, I'm David. I'll run three behavioral questions focused on your finance experience, with a brief note after each answer. Ready when you are.",
  consulting: "Hi, I'm Sophie. I'll ask three structured behavioral questions and give a quick note after each. Let's get started.",
  other: "Hi, I'm Alex. I'll ask three behavioral questions with quick feedback after each. Let's begin.",
}

// Update these voice IDs with valid 11labs voices from your Vapi dashboard
const VOICE: Record<InterviewCharacter, string> = {
  tech: 'marissa',
  finance: 'paul',
  consulting: 'marissa', // replace with a valid 11labs voice ID for Sophie
  other: 'paul', // replace with a valid 11labs voice ID for Alex
}

export function buildAssistantConfig(
  character: InterviewCharacter,
  resumeText: string,
  jobDescriptionText = '',
): CreateAssistantDTO {
  const system = buildSystemPrompt(character, resumeText, jobDescriptionText)

  return {
    name: 'StarReady',
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en',
    },
    model: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      messages: [{ role: 'system', content: system }],
      tools: [{ type: 'endCall' }],
    },
    voice: {
      provider: '11labs',
      voiceId: VOICE[character],
    },
    firstMessage: FIRST_MESSAGE[character],
    firstMessageMode: 'assistant-speaks-first',
    maxDurationSeconds: 600,
    clientMessages: ['transcript', 'conversation-update'] as unknown as CreateAssistantDTO['clientMessages'],
    endCallPhrases: ['Best of luck', 'Good luck with your', 'Best of luck with your'],
  }
}
