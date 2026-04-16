import { getHealthPayload } from './_lib/dreamService.js'

export async function GET() {
  return new Response(JSON.stringify(getHealthPayload()), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  })
}
