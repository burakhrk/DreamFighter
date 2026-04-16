import {
  attackRequestSchema,
  generateAttackFromPrompt,
} from '../../web/api/_lib/dreamService.js'
import { errorResponse } from '../../web/api/_lib/http.js'

export async function POST(request: Request) {
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
    console.error('Root attack generation failed:', error)
    return errorResponse(error)
  }
}
