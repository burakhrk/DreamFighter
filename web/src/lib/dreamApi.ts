import type { AttackBuild, CharacterBuild } from '../types'

interface GenerationErrorPayload {
  error?: string
}

async function requestJson<T>(input: RequestInfo, init: RequestInit) {
  const response = await fetch(input, init)

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`

    try {
      const payload = (await response.json()) as GenerationErrorPayload
      if (payload.error) {
        message = payload.error
      }
    } catch {
      // Ignore JSON parsing issues and keep the generic message.
    }

    throw new Error(message)
  }

  return (await response.json()) as T
}

export async function buildCharacterFromPrompt(prompt: string) {
  return requestJson<CharacterBuild>('/api/generate/character', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  })
}

export async function buildAttackFromPrompt(
  prompt: string,
  character: CharacterBuild,
) {
  return requestJson<AttackBuild>('/api/generate/attack', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, character }),
  })
}
