import type { CreateAssistantDTO } from '@vapi-ai/web/api'
import type { InterviewCharacter } from './buildSystemPrompt'
import { buildSystemPrompt } from './buildSystemPrompt'

const FIRST_MESSAGE: Record<InterviewCharacter, string> = {
  'tech-lead':
    "Hi — I'm Emma, your tech lead for this session. I'll ask three short behavioral questions using STAR, with quick micro-feedback after each answer. Let's begin.",
  'hiring-manager':
    "Hi — I'm Jack, your hiring manager for this practice. I'll run three behavioral STAR questions and give a brief micro-feedback line after each answer. Ready to start.",
}

const VOICE: Record<InterviewCharacter, 'marissa' | 'paul'> = {
  'tech-lead': 'marissa',
  'hiring-manager': 'paul',
}

export function buildAssistantConfig(
  character: InterviewCharacter,
  resumeText: string,
): CreateAssistantDTO {
  const system = buildSystemPrompt(character, resumeText)

  return {
    name: 'InterviewApp',
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en',
    },
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: system }],
    },
    voice: {
      provider: '11labs',
      voiceId: VOICE[character],
    },
    firstMessage: FIRST_MESSAGE[character],
    firstMessageMode: 'assistant-speaks-first',
    maxDurationSeconds: 600,
  }
}
