import dotenv from 'dotenv'
import express from 'express'
import { ZodError } from 'zod'
import {
  attackRequestSchema,
  characterRequestSchema,
  generateAttackFromPrompt,
  generateCharacterFromPrompt,
  getHealthPayload,
} from '../api/_lib/dreamService.js'

dotenv.config()

const port = Number(process.env.PORT ?? 8787)

const app = express()
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_request, response) => {
  response.json(getHealthPayload())
})

app.post('/api/generate/character', async (request, response) => {
  try {
    const body = characterRequestSchema.parse(request.body)
    const character = await generateCharacterFromPrompt(body.prompt)
    response.json(character)
  } catch (error) {
    handleRouteError(error, response)
  }
})

app.post('/api/generate/attack', async (request, response) => {
  try {
    const body = attackRequestSchema.parse(request.body)
    const attack = await generateAttackFromPrompt(body.prompt, body.character)
    response.json(attack)
  } catch (error) {
    handleRouteError(error, response)
  }
})

app.listen(port, () => {
  console.log(`DreamFighter API listening on http://localhost:${port}`)
})

function handleRouteError(error: unknown, response: express.Response) {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: 'Invalid request payload.',
      details: error.issues,
    })
    return
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error.'
  response.status(500).json({ error: message })
}
