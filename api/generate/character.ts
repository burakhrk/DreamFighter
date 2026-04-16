import {
  characterRequestSchema,
  generateCharacterFromPrompt,
} from '../../web/api/_lib/dreamService.js'
import { errorResponse, methodNotAllowedResponse } from '../../web/api/_lib/http.js'

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return methodNotAllowedResponse()
  }

  try {
    const body = characterRequestSchema.parse(await request.json())
    const character = await generateCharacterFromPrompt(body.prompt)

    return new Response(JSON.stringify(character), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
