import type { CreateAssistantDTO } from '@vapi-ai/web/api'
import type { InterviewCharacter } from './buildSystemPrompt'
import { buildSystemPrompt } from './buildSystemPrompt'

const FIRST_MESSAGE: Record<InterviewCharacter, string> = {
  'tech-lead':
    "Hi, I'm Marissa. I'll be your tech lead interviewer today. We'll keep this focused: three STAR-style questions, and after each answer I'll give one quick note to help you sharpen it. Let's begin.",
  'hiring-manager':
    "Hi, I'm Paul. I'll be your hiring manager for this practice session. I'll ask three behavioral questions, listen for ownership and impact, and give a quick feedback note after each one. Ready to start.",
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
    clientMessages: ['transcript', 'conversation-update'],
  }
}
