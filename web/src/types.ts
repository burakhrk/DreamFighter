export type AttackFamily =
  | 'single-shot'
  | 'burst'
  | 'spread'
  | 'beam'
  | 'lobbed'
  | 'slash'
  | 'gauntlet'

export type ElementType =
  | 'neutral'
  | 'fire'
  | 'poison'
  | 'void'
  | 'ice'
  | 'shock'

export type StatusEffect = 'burn' | 'poison' | 'slow' | null

export type LogLevel = 'info' | 'warn' | 'error'

export interface GameLogEntry {
  id: string
  level: LogLevel
  scope: 'app' | 'generation' | 'sandbox' | 'combat' | 'system'
  message: string
  timestamp: string
}

export interface CharacterBuild {
  prompt: string
  name: string
  species: string
  theme: string
  archetype: string
  summary: string
  stats: {
    health: number
    defense: number
    mobility: number
    attack: number
  }
  runtime: {
    maxHealth: number
    defenseRatio: number
    moveSpeed: number
    jumpVelocity: number
    sizeScale: number
    attackPowerMultiplier: number
  }
  palette: {
    primary: string
    secondary: string
    accent: string
    core: string
  }
}

export interface AttackBuild {
  prompt: string
  name: string
  family: AttackFamily
  element: ElementType
  statusEffect: StatusEffect
  summary: string
  visuals: {
    primary: string
    secondary: string
    highlight: string
    trail: 'smoke' | 'spark' | 'chain' | 'void' | 'toxin'
  }
  runtime: {
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
    dpsHint: number
  }
}
