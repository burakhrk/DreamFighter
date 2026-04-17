import { Suspense, lazy, useState } from 'react'
import './App.css'
import {
  buildAttackFromPrompt,
  buildCharacterFromPrompt,
} from './lib/dreamApi'
import { CharacterBuildArt } from './components/BuildArt'
import type { AttackBuild, CharacterBuild } from './types'

const SandboxCanvas = lazy(async () => {
  const module = await import('./components/SandboxCanvas')
  return { default: module.SandboxCanvas }
})

const DEFAULT_CHARACTER_PROMPT =
  'Kurbaga temali, biraz tankimsi ama komik duran bir arena savascisi'
const DEFAULT_ATTACK_PROMPT = 'Alev sacan zincirli bir kara delik tufegi'

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

  async function generateCharacter() {
    setError(null)
    setIsCharacterLoading(true)

    try {
      const result = await buildCharacterFromPrompt(characterPrompt)
      setCharacter(result)
      setAttack(null)
      setPaused(false)
      setRestartTick((value) => value + 1)
    } catch (generationError) {
      const message =
        generationError instanceof Error
          ? generationError.message
          : 'Character generation failed.'
      setError(message)
    } finally {
      setIsCharacterLoading(false)
    }
  }

  async function generateAttack() {
    if (!character) {
      setError('Generate a character first.')
      return
    }

    setError(null)
    setIsAttackLoading(true)

    try {
      const result = await buildAttackFromPrompt(attackPrompt, character)
      setAttack(result)
      setPaused(false)
      setRestartTick((value) => value + 1)
    } catch (generationError) {
      const message =
        generationError instanceof Error
          ? generationError.message
          : 'Attack generation failed.'
      setError(message)
    } finally {
      setIsAttackLoading(false)
    }
  }

  const sandboxReady = Boolean(character && attack)

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">DreamFighter Prototype</p>
          <h1>Prompt bir hayal kur, dummy arena'da aninda test et.</h1>
          <p className="hero-body">
            Ilk dikey dilimimiz web tabanli bir sandbox. Oyuncu once karakter
            fantezisini, sonra saldiri fantezisini yazar; sistem bunu clamp'li
            statlar ve kontrol edilen combat davranisina cevirir.
          </p>
        </div>

        <div className="hero-metrics">
          <article>
            <span>Mode</span>
            <strong>Combat Sandbox</strong>
          </article>
          <article>
            <span>Focus</span>
            <strong>Creation First</strong>
          </article>
          <article>
            <span>Generation</span>
            <strong>Mock, API-ready</strong>
          </article>
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
            <span>Karakter fantazisi</span>
            <textarea
              rows={5}
              value={characterPrompt}
              onChange={(event) => setCharacterPrompt(event.target.value)}
              placeholder="Ornek: Zehirli ama komik gorunen, iri zirhli bir kurbaga savascisi"
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
            <span>Ana saldiri fantazisi</span>
            <textarea
              rows={5}
              value={attackPrompt}
              onChange={(event) => setAttackPrompt(event.target.value)}
              placeholder="Ornek: Alev sacan zincirli bir kara delik tufegi"
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
            <strong>Rules layer:</strong> prompt serbest, ama stat ve DPS cap
            oyunu koruyor.
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
                Character promptunu calistirdiginda burada stat butcesi ve
                gorsel tema gorunecek.
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
                Character hazir olduktan sonra saldiri promptu burada tek ana
                ataga donusecek.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="sandbox-panel panel">
        <div className="sandbox-header">
          <div>
            <p className="panel-kicker">Arena</p>
            <h2>Dummy Test Range</h2>
          </div>

          <div className="sandbox-actions">
            <button
              className="ghost-button"
              disabled={!sandboxReady}
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button
              className="ghost-button"
              disabled={!sandboxReady}
              onClick={() => setRestartTick((value) => value + 1)}
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
                <p>Combat sahnesi Phaser chunk'u ile birlikte yukleniyor.</p>
              </div>
            </div>
          }
        >
          <SandboxCanvas
            attack={attack}
            character={character}
            paused={paused}
            restartTick={restartTick}
          />
        </Suspense>

        <div className="sandbox-footer">
          <div>
            <span>Controls</span>
            <strong>A / D move</strong>
          </div>
          <div>
            <span>Jump</span>
            <strong>Space</strong>
          </div>
          <div>
            <span>Aim</span>
            <strong>Mouse pointer</strong>
          </div>
          <div>
            <span>Fire</span>
            <strong>Left click</strong>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
