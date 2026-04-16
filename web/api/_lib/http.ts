import { ZodError } from 'zod'

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

export function methodNotAllowedResponse() {
  return jsonResponse({ error: 'Method not allowed.' }, 405)
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return jsonResponse(
      {
        error: 'Invalid request payload.',
        details: error.issues,
      },
      400,
    )
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error.'
  return jsonResponse({ error: message }, 500)
}
