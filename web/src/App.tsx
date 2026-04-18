import { Suspense, lazy, useEffect, useState } from 'react'
import './App.css'
import {
  buildAttackFromPrompt,
  buildCharacterFromPrompt,
} from './lib/dreamApi'
import { CharacterBuildArt } from './components/BuildArt'
import type { AttackBuild, CharacterBuild, GameLogEntry } from './types'

const SandboxCanvas = lazy(async () => {
  const module = await import('./components/SandboxCanvas')
  return { default: module.SandboxCanvas }
})

const DEFAULT_CHARACTER_PROMPT =
  'A frog-themed arena fighter that feels sturdy, goofy, and hard to knock down'
const DEFAULT_ATTACK_PROMPT =
  'A chain-fed black hole cannon that spits bursts of fire'
const MAX_LOG_ENTRIES = 40

function App() {
  const [characterPrompt, setCharacterPrompt] = useState(DEFAULT_CHARACTER_PROMPT)
  const [attackPrompt, setAttackPrompt] = useState(DEFAULT_ATTACK_PROMPT)
  const [character, setCharacter] = useState<CharacterBuild | null>(null)
  const [attack, setAttack] = useState<AttackBuild | null>(null)
  const [isCharacterLoading, setIsCharacterLoading] = useState(false)
  const [isAttackLoading, setIsAttackLoading] = useState(false)
  const [paused, setPaused] = useState(false)
  const [restartTick, setRestartTick] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<GameLogEntry[]>([])

  function addLog(entry: Omit<GameLogEntry, 'id' | 'timestamp'>) {
    setLogs((current) => {
      const nextEntry: GameLogEntry = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
      }

      return [nextEntry, ...current].slice(0, MAX_LOG_ENTRIES)
    })
  }

  useEffect(() => {
    addLog({
      scope: 'app',
      level: 'info',
      message: 'DreamFighter session ready.',
    })

    const handleError = (event: ErrorEvent) => {
      addLog({
        scope: 'system',
        level: 'error',
        message: event.message || 'Unexpected window error.',
      })
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason =
        event.reason instanceof Error
          ? event.reason.message
          : typeof event.reason === 'string'
            ? event.reason
            : 'Unhandled promise rejection.'

      addLog({
        scope: 'system',
        level: 'error',
        message: reason,
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  async function generateCharacter() {
    setError(null)
    setIsCharacterLoading(true)
    addLog({
      scope: 'generation',
      level: 'info',
      message: 'Character generation started.',
    })

    try {
      const result = await buildCharacterFromPrompt(characterPrompt)
      setCharacter(result)
      setAttack(null)
      setPaused(false)
      setRestartTick((value) => value + 1)
      addLog({
        scope: 'generation',
        level: 'info',
        message: `Character ready: ${result.name}.`,
      })
    } catch (generationError) {
      const message =
        generationError instanceof Error
          ? generationError.message
          : 'Character generation failed.'
      setError(message)
      addLog({
        scope: 'generation',
        level: 'error',
        message,
      })
    } finally {
      setIsCharacterLoading(false)
    }
  }

  async function generateAttack() {
    if (!character) {
      const message = 'Generate a character first.'
      setError(message)
      addLog({
        scope: 'generation',
        level: 'warn',
        message: 'Attack generation blocked until a character exists.',
      })
      return
    }

    setError(null)
    setIsAttackLoading(true)
    addLog({
      scope: 'generation',
      level: 'info',
      message: 'Attack generation started.',
    })

    try {
      const result = await buildAttackFromPrompt(attackPrompt, character)
      setAttack(result)
      setPaused(false)
      setRestartTick((value) => value + 1)
      addLog({
        scope: 'generation',
        level: 'info',
        message: `Attack ready: ${result.name}.`,
      })
    } catch (generationError) {
      const message =
        generationError instanceof Error
          ? generationError.message
          : 'Attack generation failed.'
      setError(message)
      addLog({
        scope: 'generation',
        level: 'error',
        message,
      })
    } finally {
      setIsAttackLoading(false)
    }
  }

  const sandboxReady = Boolean(character && attack)

  return (
    <main className="app-shell">
      <section className="sandbox-panel panel">
        <div className="sandbox-header">
          <div>
            <p className="panel-kicker">Arena</p>
            <h2>Live Test Range</h2>
          </div>

          <div className="sandbox-actions">
            <button
              className="ghost-button"
              disabled={!sandboxReady}
              onClick={() =>
                setPaused((value) => {
                  const next = !value
                  addLog({
                    scope: 'sandbox',
                    level: 'info',
                    message: next ? 'Sandbox paused.' : 'Sandbox resumed.',
                  })
                  return next
                })
              }
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button
              className="ghost-button"
              disabled={!sandboxReady}
              onClick={() => {
                addLog({
                  scope: 'sandbox',
                  level: 'warn',
                  message: 'Sandbox restart requested.',
                })
                setRestartTick((value) => value + 1)
              }}
            >
              Restart
            </button>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="sandbox-placeholder">
              <div>
                <strong>Loading sandbox...</strong>
                <p>The combat scene is loading with the Phaser chunk.</p>
              </div>
            </div>
          }
        >
          <SandboxCanvas
            attack={attack}
            character={character}
            onLog={addLog}
            paused={paused}
            restartTick={restartTick}
          />
        </Suspense>

        <div className="sandbox-footer">
          <div>
            <span>Move</span>
            <strong>A / D</strong>
          </div>
          <div>
            <span>Jump</span>
            <strong>Space</strong>
          </div>
          <div>
            <span>Aim</span>
            <strong>Mouse</strong>
          </div>
          <div>
            <span>Fire</span>
            <strong>Left Click</strong>
          </div>
        </div>
      </section>

      <section className="studio-grid">
        <article className="panel panel-form">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Step 1</p>
              <h2>Character Prompt</h2>
            </div>
            <button
              className="ghost-button"
              disabled={isCharacterLoading}
              onClick={() => void generateCharacter()}
            >
              {isCharacterLoading ? 'Forging...' : 'Reroll'}
            </button>
          </div>

          <label className="field">
            <span>Character fantasy</span>
            <textarea
              rows={5}
              value={characterPrompt}
              onChange={(event) => setCharacterPrompt(event.target.value)}
              placeholder="Example: A toxic armored frog bruiser with a goofy grin and tank instincts"
            />
          </label>

          <button
            className="primary-button"
            disabled={isCharacterLoading || !characterPrompt.trim()}
            onClick={() => void generateCharacter()}
          >
            {isCharacterLoading ? 'Generating character...' : 'Generate character'}
          </button>

          <div className="panel-divider" />

          <div className="panel-header">
            <div>
              <p className="panel-kicker">Step 2</p>
              <h2>Attack Prompt</h2>
            </div>
            <button
              className="ghost-button"
              disabled={isAttackLoading || !character}
              onClick={() => void generateAttack()}
            >
              {isAttackLoading ? 'Recasting...' : 'Reroll'}
            </button>
          </div>

          <label className="field">
            <span>Primary attack fantasy</span>
            <textarea
              rows={5}
              value={attackPrompt}
              onChange={(event) => setAttackPrompt(event.target.value)}
              placeholder="Example: A chained black hole blaster that spits burning rounds"
              disabled={!character}
            />
          </label>

          <button
            className="primary-button secondary-tone"
            disabled={isAttackLoading || !character || !attackPrompt.trim()}
            onClick={() => void generateAttack()}
          >
            {isAttackLoading ? 'Generating attack...' : 'Generate attack'}
          </button>

          <div className="status-note">
            <strong>Rules layer:</strong> the prompt stays wild, but stat and
            DPS caps keep the sandbox playable.
          </div>

          {error ? <p className="error-banner">{error}</p> : null}
        </article>

        <article className="panel panel-build">
          <div className="build-column">
            <div className="panel-header compact">
              <div>
                <p className="panel-kicker">Character Build</p>
                <h2>{character ? character.name : 'Waiting for a fighter'}</h2>
              </div>
            </div>

            {character ? (
              <>
                <div
                  className="build-swatch"
                  style={{
                    background: `linear-gradient(145deg, ${character.palette.primary}, ${character.palette.secondary})`,
                  }}
                >
                  <CharacterBuildArt character={character} />
                  <span>{character.theme}</span>
                </div>

                <p className="build-summary">{character.summary}</p>

                <div className="stats-grid">
                  {Object.entries(character.stats).map(([key, value]) => (
                    <div className="stat-row" key={key}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                      <div className="stat-bar">
                        <div style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="tag-list">
                  <span>{character.species}</span>
                  <span>{character.archetype}</span>
                  <span>Scale {character.runtime.sizeScale.toFixed(2)}x</span>
                </div>
              </>
            ) : (
              <p className="empty-copy">
                Run the character prompt to reveal the fighter silhouette,
                stat spread, and overall theme.
              </p>
            )}
          </div>

          <div className="build-column">
            <div className="panel-header compact">
              <div>
                <p className="panel-kicker">Attack Build</p>
                <h2>{attack ? attack.name : 'Waiting for a weapon fantasy'}</h2>
              </div>
            </div>

            {attack ? (
              <>
                <div
                  className="build-swatch attack"
                  style={{
                    background: `linear-gradient(145deg, ${attack.visuals.primary}, ${attack.visuals.secondary})`,
                  }}
                >
                  <div
                    className="swatch-core attack-core"
                    style={{
                      boxShadow: `0 0 0 12px ${attack.visuals.highlight}22`,
                      background: attack.visuals.highlight,
                    }}
                  />
                  <span>{attack.family}</span>
                </div>

                <p className="build-summary">{attack.summary}</p>

                <div className="stats-grid attack-grid">
                  <div className="mini-stat">
                    <span>Damage</span>
                    <strong>{attack.runtime.damage}</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Cooldown</span>
                    <strong>{attack.runtime.cooldownMs} ms</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Projectiles</span>
                    <strong>{attack.runtime.projectileCount}</strong>
                  </div>
                  <div className="mini-stat">
                    <span>DPS Hint</span>
                    <strong>{attack.runtime.dpsHint}</strong>
                  </div>
                </div>

                <div className="tag-list">
                  <span>{attack.element}</span>
                  <span>{attack.visuals.trail}</span>
                  <span>{attack.statusEffect ?? 'pure hit'}</span>
                </div>
              </>
            ) : (
              <p className="empty-copy">
                Once the fighter is ready, generate a primary attack to see
                the weapon family, combat tuning, and elemental flavor.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="panel log-panel">
        <div className="panel-header compact">
          <div>
            <p className="panel-kicker">Live Log</p>
            <h2>Runtime Feed</h2>
          </div>
          <button
            className="ghost-button"
            disabled={!logs.length}
            onClick={() => setLogs([])}
          >
            Clear
          </button>
        </div>

        <div className="log-list" role="log" aria-live="polite">
          {logs.length ? (
            logs.map((entry) => (
              <article className={`log-entry log-${entry.level}`} key={entry.id}>
                <div className="log-meta">
                  <span>{entry.timestamp}</span>
                  <strong>{entry.scope}</strong>
                </div>
                <p>{entry.message}</p>
              </article>
            ))
          ) : (
            <p className="empty-copy">
              Runtime logs appear here. Use this feed to watch generation,
              combat flow, sandbox restarts, and browser errors.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
