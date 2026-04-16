import {
  attackRequestSchema,
  generateAttackFromPrompt,
} from '../_lib/dreamService.js'
import { errorResponse, jsonResponse } from '../_lib/http.js'

export async function POST(request: Request) {
  try {
    const body = attackRequestSchema.parse(await request.json())
    const attack = await generateAttackFromPrompt(body.prompt, body.character)
    return jsonResponse(attack)
  } catch (error) {
    console.error('Attack generation failed:', error)
    return errorResponse(error)
  }
}
