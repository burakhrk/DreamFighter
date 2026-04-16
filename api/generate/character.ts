export async function POST(request: Request) {
  try {
    const [{ characterRequestSchema, generateCharacterFromPrompt }, { errorResponse }] =
      await Promise.all([
        import('../../web/api/_lib/dreamService.js'),
        import('../../web/api/_lib/http.js'),
      ])

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
    const { errorResponse } = await import('../../web/api/_lib/http.js')
    return errorResponse(error)
  }
}
