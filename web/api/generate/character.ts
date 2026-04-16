import {
  characterRequestSchema,
  generateCharacterFromPrompt,
} from '../_lib/dreamService.js'
import { errorResponse, jsonResponse } from '../_lib/http.js'

export async function POST(request: Request) {
  try {
    const body = characterRequestSchema.parse(await request.json())
    const character = await generateCharacterFromPrompt(body.prompt)
    return jsonResponse(character)
  } catch (error) {
    console.error('Character generation failed:', error)
    return errorResponse(error)
  }
}
