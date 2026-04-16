import OpenAI from 'openai'
import { z } from 'zod'

type JsonSchema = Record<string, unknown>

interface AttackBase {
  damage: number
  cooldownMs: number
  projectileSpeed: number
  projectileCount: number
  spreadAngle: number
  range: number
  knockback: number
  gravityScale: number
  beamDurationMs: number
  projectileSize: number
}

const model = process.env.OPENAI_MODEL ?? 'gpt-5.4'

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export const characterRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(500),
})

export const attackCharacterSchema = z.object({
  name: z.string(),
  species: z.string(),
  theme: z.string(),
  runtime: z.object({
    attackPowerMultiplier: z.number(),
  }),
})

export const attackRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(500),
  character: attackCharacterSchema,
})

const characterDraftSchema = z.object({
  name: z.string().min(1).max(80),
  speciesLabel: z.string().min(1).max(80),
  themePalette: z.enum(['dream', 'toxic', 'void', 'magma', 'frost', 'scrap']),
  archetypeLabel: z.string().min(1).max(80),
  summary: z.string().min(1).max(240),
  sizeClass: z.enum(['small', 'medium', 'large']),
  statWeights: z.object({
    health: z.number().int().min(0).max(100),
    defense: z.number().int().min(0).max(100),
    mobility: z.number().int().min(0).max(100),
    attack: z.number().int().min(0).max(100),
  }),
})

const attackDraftSchema = z.object({
  name: z.string().min(1).max(80),
  family: z.enum([
    'single-shot',
    'burst',
    'spread',
    'beam',
    'lobbed',
    'slash',
    'gauntlet',
  ]),
  element: z.enum(['neutral', 'fire', 'poison', 'void', 'ice', 'shock']),
  statusEffect: z.enum(['none', 'burn', 'poison', 'slow']),
  summary: z.string().min(1).max(240),
  trail: z.enum(['smoke', 'spark', 'chain', 'void', 'toxin']),
  powerBias: z.number().int().min(0).max(100),
  speedBias: z.number().int().min(0).max(100),
  rangeBias: z.number().int().min(0).max(100),
  scaleBias: z.number().int().min(0).max(100),
  multiShotBias: z.number().int().min(0).max(100),
})

const characterJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'name',
    'speciesLabel',
    'themePalette',
    'archetypeLabel',
    'summary',
    'sizeClass',
    'statWeights',
  ],
  properties: {
    name: { type: 'string' },
    speciesLabel: { type: 'string' },
    themePalette: {
      type: 'string',
      enum: ['dream', 'toxic', 'void', 'magma', 'frost', 'scrap'],
    },
    archetypeLabel: { type: 'string' },
    summary: { type: 'string' },
    sizeClass: { type: 'string', enum: ['small', 'medium', 'large'] },
    statWeights: {
      type: 'object',
      additionalProperties: false,
      required: ['health', 'defense', 'mobility', 'attack'],
      properties: {
        health: { type: 'integer' },
        defense: { type: 'integer' },
        mobility: { type: 'integer' },
        attack: { type: 'integer' },
      },
    },
  },
} as const

const attackJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'name',
    'family',
    'element',
    'statusEffect',
    'summary',
    'trail',
    'powerBias',
    'speedBias',
    'rangeBias',
    'scaleBias',
    'multiShotBias',
  ],
  properties: {
    name: { type: 'string' },
    family: {
      type: 'string',
      enum: ['single-shot', 'burst', 'spread', 'beam', 'lobbed', 'slash', 'gauntlet'],
    },
    element: {
      type: 'string',
      enum: ['neutral', 'fire', 'poison', 'void', 'ice', 'shock'],
    },
    statusEffect: {
      type: 'string',
      enum: ['none', 'burn', 'poison', 'slow'],
    },
    summary: { type: 'string' },
    trail: {
      type: 'string',
      enum: ['smoke', 'spark', 'chain', 'void', 'toxin'],
    },
    powerBias: { type: 'integer' },
    speedBias: { type: 'integer' },
    rangeBias: { type: 'integer' },
    scaleBias: { type: 'integer' },
    multiShotBias: { type: 'integer' },
  },
} as const

const paletteByTheme = {
  dream: {
    primary: '#4b8f8c',
    secondary: '#f0b56d',
    accent: '#ff7a59',
    core: '#fff5d4',
  },
  toxic: {
    primary: '#4f8b3b',
    secondary: '#b4cf47',
    accent: '#f6d743',
    core: '#f3ffcb',
  },
  void: {
    primary: '#31244f',
    secondary: '#5b4bb3',
    accent: '#7df4f1',
    core: '#ece4ff',
  },
  magma: {
    primary: '#7d2317',
    secondary: '#d8532d',
    accent: '#ffbf5e',
    core: '#ffe6a4',
  },
  frost: {
    primary: '#256b85',
    secondary: '#6bb8d8',
    accent: '#c8f5ff',
    core: '#f0ffff',
  },
  scrap: {
    primary: '#3d4b55',
    secondary: '#667785',
    accent: '#ff9150',
    core: '#dfe7ea',
  },
} as const

const visualsByElement = {
  neutral: {
    primary: '#486c6b',
    secondary: '#f1a15d',
    highlight: '#fff2b2',
  },
  fire: {
    primary: '#902e1c',
    secondary: '#f36d38',
    highlight: '#ffc056',
  },
  poison: {
    primary: '#4c7d2f',
    secondary: '#91b83e',
    highlight: '#dfff6a',
  },
  void: {
    primary: '#25174c',
    secondary: '#6245b7',
    highlight: '#78f3ed',
  },
  ice: {
    primary: '#2d627c',
    secondary: '#73d1ee',
    highlight: '#ebffff',
  },
  shock: {
    primary: '#165b73',
    secondary: '#45afd0',
    highlight: '#f8ff73',
  },
} as const

const attackBaseByFamily: Record<z.infer<typeof attackDraftSchema>['family'], AttackBase> = {
  'single-shot': {
    damage: 28,
    cooldownMs: 340,
    projectileSpeed: 820,
    projectileCount: 1,
    spreadAngle: 0,
    range: 860,
    knockback: 180,
    gravityScale: 0,
    beamDurationMs: 0,
    projectileSize: 1,
  },
  burst: {
    damage: 11,
    cooldownMs: 620,
    projectileSpeed: 860,
    projectileCount: 3,
    spreadAngle: 5,
    range: 820,
    knockback: 115,
    gravityScale: 0,
    beamDurationMs: 0,
    projectileSize: 0.95,
  },
  spread: {
    damage: 8,
    cooldownMs: 720,
    projectileSpeed: 760,
    projectileCount: 5,
    spreadAngle: 18,
    range: 620,
    knockback: 95,
    gravityScale: 0,
    beamDurationMs: 0,
    projectileSize: 0.9,
  },
  beam: {
    damage: 22,
    cooldownMs: 460,
    projectileSpeed: 1400,
    projectileCount: 1,
    spreadAngle: 0,
    range: 900,
    knockback: 155,
    gravityScale: 0,
    beamDurationMs: 90,
    projectileSize: 0.9,
  },
  lobbed: {
    damage: 38,
    cooldownMs: 980,
    projectileSpeed: 560,
    projectileCount: 1,
    spreadAngle: 0,
    range: 700,
    knockback: 240,
    gravityScale: 0.82,
    beamDurationMs: 0,
    projectileSize: 1.18,
  },
  slash: {
    damage: 30,
    cooldownMs: 410,
    projectileSpeed: 0,
    projectileCount: 1,
    spreadAngle: 0,
    range: 140,
    knockback: 280,
    gravityScale: 0,
    beamDurationMs: 0,
    projectileSize: 1.08,
  },
  gauntlet: {
    damage: 22,
    cooldownMs: 260,
    projectileSpeed: 0,
    projectileCount: 1,
    spreadAngle: 0,
    range: 96,
    knockback: 230,
    gravityScale: 0,
    beamDurationMs: 0,
    projectileSize: 0.92,
  },
}

export function getHealthPayload() {
  return {
    ok: true,
    model,
    hasApiKey: Boolean(process.env.OPENAI_API_KEY),
  }
}

export async function generateCharacterFromPrompt(prompt: string) {
  ensureClient()

  const draft = await generateStructuredOutput({
    schemaName: 'dreamfighter_character',
    schema: characterJsonSchema,
    systemPrompt:
      'You convert a player fantasy into a balanced 2D arena fighter draft. Keep the fantasy vivid, but return only creative labels and stat tendencies. Do not invent illegal powers, giant scale, or impossible immortality. Favor expressive but concise naming.',
    userPrompt: `Player character prompt: ${prompt}`,
    validator: characterDraftSchema,
  })

  return applyCharacterRules(prompt, draft)
}

export async function generateAttackFromPrompt(
  prompt: string,
  character: z.infer<typeof attackCharacterSchema>,
) {
  ensureClient()

  const draft = await generateStructuredOutput({
    schemaName: 'dreamfighter_attack',
    schema: attackJsonSchema,
    systemPrompt:
      'You convert a player attack fantasy into a single primary attack draft for a fast 2D arcade sandbox. Preserve the fantasy, but choose one weapon family and one primary behavior only. Never output impossible attack rates or unbounded damage; express those as bias values instead.',
    userPrompt: [
      `Character name: ${character.name}`,
      `Character species: ${character.species}`,
      `Character theme: ${character.theme}`,
      `Attack prompt: ${prompt}`,
    ].join('\n'),
    validator: attackDraftSchema,
  })

  return applyAttackRules(prompt, character, draft)
}

function ensureClient() {
  if (!client) {
    throw new Error(
      'OPENAI_API_KEY is missing. Add it in Vercel env vars or local web/.env.',
    )
  }
}

async function generateStructuredOutput<T>({
  schemaName,
  schema,
  systemPrompt,
  userPrompt,
  validator,
}: {
  schemaName: string
  schema: JsonSchema
  systemPrompt: string
  userPrompt: string
  validator: z.ZodType<T>
}) {
  const apiResponse = await client!.responses.create({
    model,
    input: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: schemaName,
        strict: true,
        schema,
      },
    },
  })

  if (!apiResponse.output_text) {
    throw new Error('OpenAI returned no structured output text.')
  }

  const parsed = JSON.parse(apiResponse.output_text) as unknown
  return validator.parse(parsed)
}

function applyCharacterRules(
  prompt: string,
  draft: z.infer<typeof characterDraftSchema>,
) {
  const stats = normalizeBudget(draft.statWeights)
  const sizeBias =
    draft.sizeClass === 'large' ? 0.1 : draft.sizeClass === 'small' ? -0.06 : 0

  return {
    prompt,
    name: draft.name,
    species: draft.speciesLabel,
    theme: draft.themePalette,
    archetype: draft.archetypeLabel,
    summary: draft.summary,
    stats,
    runtime: {
      maxHealth: Math.round(145 + stats.health * 2.1 + stats.defense * 0.9),
      defenseRatio: clamp(0.05 + stats.defense * 0.0031, 0.05, 0.22),
      moveSpeed: Math.round(205 + stats.mobility * 2.2 - sizeBias * 60),
      jumpVelocity: Math.round(430 + stats.mobility * 2.3 - sizeBias * 55),
      sizeScale: clamp(1 + sizeBias, 0.9, 1.12),
      attackPowerMultiplier: clamp(0.84 + stats.attack * 0.011, 0.84, 1.23),
    },
    palette: paletteByTheme[draft.themePalette],
  }
}

function applyAttackRules(
  prompt: string,
  character: z.infer<typeof attackCharacterSchema>,
  draft: z.infer<typeof attackDraftSchema>,
) {
  const base = { ...attackBaseByFamily[draft.family] }
  const speedFactor = lerp(1.28, 0.7, draft.speedBias / 100)
  const powerFactor = lerp(0.72, 1.46, draft.powerBias / 100)
  const rangeFactor = lerp(0.82, 1.2, draft.rangeBias / 100)
  const sizeFactor = lerp(0.85, 1.35, draft.scaleBias / 100)

  base.damage *= powerFactor
  base.cooldownMs *= speedFactor
  base.range *= rangeFactor
  base.projectileSize *= sizeFactor
  base.knockback *= lerp(0.88, 1.22, draft.powerBias / 100)

  if (draft.family !== 'slash' && draft.family !== 'gauntlet') {
    base.projectileSpeed *= lerp(0.88, 1.15, draft.speedBias / 100)
  }

  if (draft.family === 'spread') {
    base.projectileCount = clamp(
      Math.round(3 + (draft.multiShotBias / 100) * 3),
      3,
      6,
    )
  } else if (draft.family === 'burst') {
    base.projectileCount = clamp(
      Math.round(2 + (draft.multiShotBias / 100) * 2),
      2,
      4,
    )
  }

  base.damage = Math.round(base.damage * character.runtime.attackPowerMultiplier)
  base.cooldownMs = Math.round(base.cooldownMs)
  base.projectileSpeed = Math.round(base.projectileSpeed)
  base.range = Math.round(base.range)
  base.knockback = Math.round(base.knockback)

  const cappedDamage = clamp(base.damage, 8, 64)
  const cappedCooldown = clamp(base.cooldownMs, 180, 1800)
  const estimatedDps = Math.round(
    (cappedDamage * base.projectileCount * 1000) / cappedCooldown,
  )
  const dpsCap = 82
  const dpsScale = estimatedDps > dpsCap ? dpsCap / estimatedDps : 1

  const finalRuntime = {
    damage: Math.max(8, Math.round(cappedDamage * dpsScale)),
    cooldownMs: cappedCooldown,
    projectileSpeed:
      draft.family === 'slash' || draft.family === 'gauntlet'
        ? 0
        : clamp(base.projectileSpeed, 340, 1600),
    projectileCount:
      draft.family === 'spread'
        ? clamp(base.projectileCount, 3, 6)
        : draft.family === 'burst'
          ? clamp(base.projectileCount, 2, 4)
          : 1,
    spreadAngle:
      draft.family === 'spread'
        ? 18
        : draft.family === 'burst'
          ? 8
          : attackBaseByFamily[draft.family].spreadAngle,
    range: clamp(base.range, 80, draft.family === 'beam' ? 980 : 900),
    knockback: clamp(base.knockback, 40, 360),
    gravityScale: clamp(base.gravityScale, 0, 1.2),
    beamDurationMs: clamp(base.beamDurationMs, 0, 140),
    projectileSize: clamp(base.projectileSize, 0.8, 1.7),
    dpsHint: 0,
  }

  finalRuntime.dpsHint = Math.round(
    (finalRuntime.damage * finalRuntime.projectileCount * 1000) /
      finalRuntime.cooldownMs,
  )

  return {
    prompt,
    name: draft.name,
    family: draft.family,
    element: draft.element,
    statusEffect: draft.statusEffect === 'none' ? null : draft.statusEffect,
    summary: draft.summary,
    visuals: {
      ...visualsByElement[draft.element],
      trail: draft.trail,
    },
    runtime: finalRuntime,
  }
}

function normalizeBudget(values: z.infer<typeof characterDraftSchema>['statWeights']) {
  const entries = Object.entries(values)
  const total = entries.reduce((sum, [, value]) => sum + value, 0)
  const safeTotal = total <= 0 ? 1 : total
  const scaled = entries.map(([key, value]) => [
    key,
    Math.max(10, Math.round((value / safeTotal) * 100)),
  ]) as [keyof typeof values, number][]
  let difference = 100 - scaled.reduce((sum, [, value]) => sum + value, 0)

  while (difference !== 0) {
    const direction = difference > 0 ? 1 : -1
    const target = scaled
      .filter(([, value]) => (direction > 0 ? value < 40 : value > 10))
      .sort((left, right) => (direction > 0 ? right[1] - left[1] : left[1] - right[1]))[0]

    if (!target) {
      break
    }

    target[1] += direction
    difference -= direction
  }

  return Object.fromEntries(scaled)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function lerp(min: number, max: number, amount: number) {
  return min + (max - min) * amount
}
