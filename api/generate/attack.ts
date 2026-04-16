import {
  attackRequestSchema,
  generateAttackFromPrompt,
} from '../../web/api/_lib/dreamService.js'
import { errorResponse, methodNotAllowedResponse } from '../../web/api/_lib/http.js'

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return methodNotAllowedResponse()
  }

  try {
    const body = attackRequestSchema.parse(await request.json())
    const attack = await generateAttackFromPrompt(body.prompt, body.character)

    return new Response(JSON.stringify(attack), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
