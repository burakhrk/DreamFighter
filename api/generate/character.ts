import {
  characterRequestSchema,
  generateCharacterFromPrompt,
} from '../../web/api/_lib/dreamService.js'
import { errorResponse } from '../../web/api/_lib/http.js'

export async function POST(request: Request) {
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
    console.error('Root character generation failed:', error)
    return errorResponse(error)
  }
}
