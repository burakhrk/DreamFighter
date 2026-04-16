import {
  attackRequestSchema,
  generateAttackFromPrompt,
} from '../_lib/dreamService.js'
import { errorResponse, jsonResponse, methodNotAllowedResponse } from '../_lib/http.js'

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return methodNotAllowedResponse()
  }

  try {
    const body = attackRequestSchema.parse(await request.json())
    const attack = await generateAttackFromPrompt(body.prompt, body.character)
    return jsonResponse(attack)
  } catch (error) {
    return errorResponse(error)
  }
}
