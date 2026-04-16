export async function GET() {
  const { getHealthPayload } = await import('../web/api/_lib/dreamService.js')

  return new Response(JSON.stringify(getHealthPayload()), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  })
}
