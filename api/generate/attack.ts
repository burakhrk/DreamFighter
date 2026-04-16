export async function POST(request: Request) {
  try {
    const [{ attackRequestSchema, generateAttackFromPrompt }, { errorResponse }] =
      await Promise.all([
        import('../../web/api/_lib/dreamService.js'),
        import('../../web/api/_lib/http.js'),
      ])

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
    const { errorResponse } = await import('../../web/api/_lib/http.js')
    return errorResponse(error)
  }
}
