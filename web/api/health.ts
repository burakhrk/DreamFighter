import { jsonResponse, methodNotAllowedResponse } from './_lib/http.js'
import { getHealthPayload } from './_lib/dreamService.js'

export default async function handler(request: Request) {
  if (request.method !== 'GET') {
    return methodNotAllowedResponse()
  }

  return jsonResponse(getHealthPayload())
}
