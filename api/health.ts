import { getHealthPayload } from '../web/api/_lib/dreamService.js'

export default async function handler(_request: Request) {
  return new Response(JSON.stringify(getHealthPayload()), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  })
}
