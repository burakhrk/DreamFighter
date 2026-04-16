import {
  characterRequestSchema,
  generateCharacterFromPrompt,
} from '../_lib/dreamService.js'
import { errorResponse, jsonResponse, methodNotAllowedResponse } from '../_lib/http.js'

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return methodNotAllowedResponse()
  }

  try {
    const body = characterRequestSchema.parse(await request.json())
    const character = await generateCharacterFromPrompt(body.prompt)
    return jsonResponse(character)
  } catch (error) {
    return errorResponse(error)
  }
}
