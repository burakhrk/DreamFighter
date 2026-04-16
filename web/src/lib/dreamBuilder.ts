import { z } from 'zod'
import type {
  AttackBuild,
  AttackFamily,
  CharacterBuild,
  ElementType,
  StatusEffect,
} from '../types'

const characterSchema = z.object({
  prompt: z.string(),
  name: z.string(),
  species: z.string(),
  theme: z.string(),
  archetype: z.string(),
  summary: z.string(),
  stats: z.object({
    health: z.number().int().min(0).max(100),
    defense: z.number().int().min(0).max(100),
    mobility: z.number().int().min(0).max(100),
    attack: z.number().int().min(0).max(100),
  }),
  runtime: z.object({
    maxHealth: z.number().min(100).max(400),
    defenseRatio: z.number().min(0).max(0.4),
    moveSpeed: z.number().min(160).max(360),
    jumpVelocity: z.number().min(360).max(620),
    sizeScale: z.number().min(0.85).max(1.2),
    attackPowerMultiplier: z.number().min(0.7).max(1.4),
  }),
  palette: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    core: z.string(),
  }),
})

const attackSchema = z.object({
  prompt: z.string(),
  name: z.string(),
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
  statusEffect: z.enum(['burn', 'poison', 'slow']).nullable(),
  summary: z.string(),
  visuals: z.object({
    primary: z.string(),
    secondary: z.string(),
    highlight: z.string(),
    trail: z.enum(['smoke', 'spark', 'chain', 'void', 'toxin']),
  }),
  runtime: z.object({
    damage: z.number().int().min(1).max(120),
    cooldownMs: z.number().int().min(120).max(2500),
    projectileSpeed: z.number().int().min(0).max(1800),
    projectileCount: z.number().int().min(1).max(8),
    spreadAngle: z.number().int().min(0).max(45),
    range: z.number().int().min(60).max(1200),
    knockback: z.number().int().min(0).max(500),
    gravityScale: z.number().min(0).max(1.5),
    beamDurationMs: z.number().int().min(0).max(400),
    projectileSize: z.number().min(0.5).max(2.2),
    dpsHint: z.number().int().min(1).max(100),
  }),
})

const paletteByTheme: Record<string, CharacterBuild['palette']> = {
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
}

const attackPaletteByElement: Record<ElementType, AttackBuild['visuals']> = {
  neutral: {
    primary: '#486c6b',
    secondary: '#f1a15d',
    highlight: '#fff2b2',
    trail: 'spark',
  },
  fire: {
    primary: '#902e1c',
    secondary: '#f36d38',
    highlight: '#ffc056',
    trail: 'smoke',
  },
  poison: {
    primary: '#4c7d2f',
    secondary: '#91b83e',
    highlight: '#dfff6a',
    trail: 'toxin',
  },
  void: {
    primary: '#25174c',
    secondary: '#6245b7',
    highlight: '#78f3ed',
    trail: 'void',
  },
  ice: {
    primary: '#2d627c',
    secondary: '#73d1ee',
    highlight: '#ebffff',
    trail: 'spark',
  },
  shock: {
    primary: '#165b73',
    secondary: '#45afd0',
    highlight: '#f8ff73',
    trail: 'chain',
  },
}

const speciesChoices = [
  'Frog Brawler',
  'Scrap Duelist',
  'Dream Beast',
  'Void Bandit',
  'Neon Goblin',
  'Glass Titan',
  'Moth Raider',
]

const attackNouns = {
  'single-shot': 'Cannon',
  burst: 'Volley',
  spread: 'Scatter',
  beam: 'Ray',
  lobbed: 'Nova',
  slash: 'Arc',
  gauntlet: 'Gauntlet',
} satisfies Record<AttackFamily, string>

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function normalizeText(text: string) {
  return text
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function createRng(seedText: string) {
  let seed = 0

  for (let index = 0; index < seedText.length; index += 1) {
    seed = (seed * 31 + seedText.charCodeAt(index)) >>> 0
  }

  return () => {
    seed += 0x6d2b79f5
    let mixed = seed
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

function includesAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value))
}

function pick<T>(values: T[], random: () => number) {
  return values[Math.floor(random() * values.length)]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeBudget(values: Record<string, number>) {
  const entries = Object.entries(values)
  const total = entries.reduce((sum, [, value]) => sum + value, 0)
  const scaled = entries.map(([key, value]) => [
    key,
    Math.max(10, Math.round((value / total) * 100)),
  ]) as [string, number][]
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

function getTheme(text: string) {
  if (includesAny(text, ['zehir', 'poison', 'toxic', 'asit'])) return 'toxic'
  if (includesAny(text, ['kara delik', 'void', 'cosmic', 'shadow', 'golge'])) return 'void'
  if (includesAny(text, ['alev', 'fire', 'lava', 'magma', 'inferno'])) return 'magma'
  if (includesAny(text, ['ice', 'frost', 'buz', 'cryo'])) return 'frost'
  if (includesAny(text, ['metal', 'scrap', 'robot', 'mekanik', 'zirh'])) return 'scrap'
  return 'dream'
}

function getSpecies(text: string, random: () => number) {
  if (includesAny(text, ['frog', 'kurbaga'])) return 'Frog Brawler'
  if (includesAny(text, ['robot', 'mech', 'mekanik'])) return 'Scrap Duelist'
  if (includesAny(text, ['goblin', 'imp'])) return 'Neon Goblin'
  if (includesAny(text, ['beast', 'yaratik', 'canavar'])) return 'Dream Beast'
  if (includesAny(text, ['moth', 'kelebek'])) return 'Moth Raider'
  return pick(speciesChoices, random)
}

function getCharacterArchetype(stats: CharacterBuild['stats']) {
  if (stats.health + stats.defense >= 60) return 'tank shell'
  if (stats.mobility >= 32) return 'skirmisher'
  if (stats.attack >= 31) return 'glass pressure'
  return 'balanced oddball'
}

export async function buildCharacterFromPrompt(prompt: string, roll: number) {
  await delay(280)

  const source = prompt.trim()
  if (!source) throw new Error('Character prompt cannot be empty.')

  const text = normalizeText(source)
  const random = createRng(`character:${source}:${roll}`)
  const theme = getTheme(text)
  const species = getSpecies(text, random)
  const palette = paletteByTheme[theme]
  const budget = { health: 25, defense: 25, mobility: 25, attack: 25 }

  if (
    includesAny(text, [
      'tank',
      'tankimsi',
      'tankimsi',
      'sonsuz can',
      'dayanikli',
      'dayanikli',
      'zirhli',
      'armored',
    ])
  ) {
    budget.health += 18
    budget.defense += 14
    budget.mobility -= 14
    budget.attack -= 18
  }

  if (includesAny(text, ['hizli', 'cevik', 'agile', 'swift'])) {
    budget.mobility += 18
    budget.attack += 4
    budget.health -= 10
    budget.defense -= 12
  }

  if (includesAny(text, ['ufak', 'tiny', 'small', 'ince', 'narin'])) {
    budget.mobility += 10
    budget.attack += 4
    budget.health -= 8
    budget.defense -= 6
  }

  if (includesAny(text, ['buyuk', 'giant', 'huge', 'iri'])) {
    budget.health += 10
    budget.defense += 8
    budget.mobility -= 10
    budget.attack -= 8
  }

  if (includesAny(text, ['cam', 'glass', 'berserk', 'vahsi'])) {
    budget.attack += 14
    budget.mobility += 8
    budget.health -= 12
    budget.defense -= 10
  }

  const stats = normalizeBudget(budget) as CharacterBuild['stats']
  const sizeBias =
    (includesAny(text, ['buyuk', 'giant', 'iri']) ? 0.11 : 0) -
    (includesAny(text, ['tiny', 'small', 'ufak', 'ince']) ? 0.07 : 0)

  const runtime = {
    maxHealth: Math.round(145 + stats.health * 2.1 + stats.defense * 0.9),
    defenseRatio: clamp(0.05 + stats.defense * 0.0031, 0.05, 0.22),
    moveSpeed: Math.round(205 + stats.mobility * 2.2 - sizeBias * 60),
    jumpVelocity: Math.round(430 + stats.mobility * 2.3 - sizeBias * 55),
    sizeScale: clamp(1 + sizeBias + (random() - 0.5) * 0.04, 0.9, 1.12),
    attackPowerMultiplier: clamp(0.84 + stats.attack * 0.011, 0.84, 1.23),
  }

  const summary = `${species} with a ${theme} vibe. Budget split favors ${getCharacterArchetype(stats)} while staying inside arena-safe limits.`
  const name = `${theme[0].toUpperCase()}${theme.slice(1)} ${species}`

  return characterSchema.parse({
    prompt: source,
    name,
    species,
    theme,
    archetype: getCharacterArchetype(stats),
    summary,
    stats,
    runtime,
    palette,
  })
}

function getElement(text: string): ElementType {
  if (includesAny(text, ['alev', 'fire', 'lava', 'flame'])) return 'fire'
  if (includesAny(text, ['zehir', 'poison', 'toxic', 'acid', 'asit'])) return 'poison'
  if (includesAny(text, ['kara delik', 'void', 'cosmic', 'golge', 'shadow'])) return 'void'
  if (includesAny(text, ['ice', 'buz', 'frost', 'cryo'])) return 'ice'
  if (includesAny(text, ['shock', 'electric', 'lightning', 'yildirim'])) return 'shock'
  return 'neutral'
}

function getFamily(text: string): AttackFamily {
  if (includesAny(text, ['shotgun', 'spread', 'scatter', 'sacma'])) return 'spread'
  if (includesAny(text, ['beam', 'laser', 'ray', 'isin'])) return 'beam'
  if (includesAny(text, ['grenade', 'rocket', 'bomb', 'mortar', 'orb', 'kara delik'])) return 'lobbed'
  if (includesAny(text, ['sword', 'kilic', 'blade', 'slash'])) return 'slash'
  if (includesAny(text, ['fist', 'yumruk', 'gauntlet', 'glove', 'gloves', 'claw'])) return 'gauntlet'
  if (includesAny(text, ['burst', 'smg', 'spray', 'tarama', 'machine'])) return 'burst'
  return 'single-shot'
}

function getStatusEffect(text: string, element: ElementType): StatusEffect {
  if (includesAny(text, ['burn', 'alev', 'ignite'])) return 'burn'
  if (includesAny(text, ['zehir', 'poison', 'toxic'])) return 'poison'
  if (includesAny(text, ['slow', 'freeze', 'buz', 'cryo'])) return 'slow'
  if (element === 'fire') return 'burn'
  if (element === 'poison') return 'poison'
  return null
}

export async function buildAttackFromPrompt(
  prompt: string,
  character: CharacterBuild,
  roll: number,
) {
  await delay(240)

  const source = prompt.trim()
  if (!source) throw new Error('Attack prompt cannot be empty.')

  const text = normalizeText(source)
  const random = createRng(`attack:${source}:${character.name}:${roll}`)
  const family = getFamily(text)
  const element = getElement(text)
  const statusEffect = getStatusEffect(text, element)
  const visuals = { ...attackPaletteByElement[element] }

  if (includesAny(text, ['zincir', 'chain'])) {
    visuals.trail = 'chain'
  }

  const base = {
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
  }[family]

  const runtime = { ...base }

  if (includesAny(text, ['tek atan', 'one shot', 'oneshot', 'devasa', 'massive', 'brutal'])) {
    runtime.damage *= 1.42
    runtime.cooldownMs *= 1.4
    runtime.projectileSpeed *= 0.85
  }

  if (includesAny(text, ['hizli', 'rapid', 'fast', 'spray', 'tarama'])) {
    runtime.damage *= 0.74
    runtime.cooldownMs *= 0.74
    runtime.projectileSpeed *= 1.1
  }

  if (includesAny(text, ['kara delik', 'black hole', 'void'])) {
    runtime.damage *= 1.18
    runtime.cooldownMs *= 1.18
    runtime.projectileSpeed *= 0.82
    runtime.projectileSize *= 1.2
    runtime.knockback *= 1.12
  }

  if (includesAny(text, ['uzun menzil', 'sniper', 'long range'])) {
    runtime.range *= 1.14
    runtime.cooldownMs *= 1.1
  }

  if (includesAny(text, ['alev', 'fire', 'burn'])) {
    runtime.projectileSize *= 1.05
  }

  runtime.projectileSpeed *= 0.94 + random() * 0.12
  runtime.knockback *= 0.92 + random() * 0.12

  runtime.damage = Math.round(runtime.damage)
  runtime.cooldownMs = Math.round(runtime.cooldownMs)
  runtime.projectileSpeed = Math.round(runtime.projectileSpeed)
  runtime.projectileCount = Math.round(runtime.projectileCount)
  runtime.spreadAngle = Math.round(runtime.spreadAngle)
  runtime.range = Math.round(runtime.range)
  runtime.knockback = Math.round(runtime.knockback)
  runtime.projectileSize = clamp(runtime.projectileSize, 0.8, 1.6)

  const powerAdjustedDamage = Math.round(
    runtime.damage * character.runtime.attackPowerMultiplier,
  )
  const cappedDamage = clamp(powerAdjustedDamage, 8, 64)
  const cappedCooldown = clamp(runtime.cooldownMs, 180, 1800)
  const estimatedDps = Math.round(
    (cappedDamage * runtime.projectileCount * 1000) / cappedCooldown,
  )
  const dpsCap = 82
  const dpsScale = estimatedDps > dpsCap ? dpsCap / estimatedDps : 1

  const finalRuntime = {
    damage: Math.max(8, Math.round(cappedDamage * dpsScale)),
    cooldownMs: cappedCooldown,
    projectileSpeed:
      family === 'slash' || family === 'gauntlet'
        ? 0
        : clamp(runtime.projectileSpeed, 340, 1600),
    projectileCount: clamp(runtime.projectileCount, 1, family === 'spread' ? 6 : 4),
    spreadAngle: clamp(runtime.spreadAngle, 0, 28),
    range: clamp(runtime.range, 80, family === 'beam' ? 980 : 900),
    knockback: clamp(runtime.knockback, 40, 360),
    gravityScale: clamp(runtime.gravityScale, 0, 1.2),
    beamDurationMs: clamp(runtime.beamDurationMs, 0, 140),
    projectileSize: clamp(runtime.projectileSize, 0.8, 1.7),
    dpsHint: 0,
  }

  finalRuntime.dpsHint = Math.round(
    (finalRuntime.damage * finalRuntime.projectileCount * 1000) /
      finalRuntime.cooldownMs,
  )

  const summary = `${family} family tuned for ${element} fantasy. Prompt flavor is preserved while cooldown and DPS stay inside sandbox limits.`
  const elementName =
    element === 'neutral' ? 'Dream' : element[0].toUpperCase() + element.slice(1)
  const name = `${elementName} ${attackNouns[family]}`

  return attackSchema.parse({
    prompt: source,
    name,
    family,
    element,
    statusEffect,
    summary,
    visuals,
    runtime: finalRuntime,
  })
}
