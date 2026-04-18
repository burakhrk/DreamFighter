import { useEffect, useRef } from 'react'
import type * as Phaser from 'phaser'
import { createDreamSandbox } from '../game/createDreamSandbox'
import type { AttackBuild, CharacterBuild, GameLogEntry } from '../types'

interface SandboxCanvasProps {
  character: CharacterBuild | null
  attack: AttackBuild | null
  onLog?: (entry: Omit<GameLogEntry, 'id' | 'timestamp'>) => void
  paused: boolean
  restartTick: number
}

export function SandboxCanvas({
  character,
  attack,
  onLog,
  paused,
  restartTick,
}: SandboxCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const onLogRef = useRef(onLog)

  useEffect(() => {
    onLogRef.current = onLog
  }, [onLog])

  useEffect(() => {
    if (!containerRef.current || !character || !attack) {
      return
    }

    onLogRef.current?.({
      scope: 'sandbox',
      level: 'info',
      message: 'Sandbox boot requested.',
    })

    const game = createDreamSandbox(containerRef.current, character, attack, (entry) => {
      onLogRef.current?.(entry)
    })
    gameRef.current = game

    return () => {
      onLogRef.current?.({
        scope: 'sandbox',
        level: 'info',
        message: 'Sandbox instance disposed.',
      })
      game.destroy(true)
      gameRef.current = null
    }
  }, [character, attack, restartTick])

  useEffect(() => {
    const game = gameRef.current

    if (!game || !game.scene.keys['dream-sandbox']) {
      return
    }

    const scene = game.scene.getScene('dream-sandbox')

    if (paused) {
      scene.scene.pause()
    } else {
      scene.scene.resume()
    }
  }, [paused])

  if (!character || !attack) {
    return (
      <div className="sandbox-placeholder">
        <div>
          <strong>Sandbox hazir bekliyor.</strong>
          <p>
            Once karakteri, sonra ana saldiriyi olustur. Sonra bu alanda hereket
            eden dummy'ye karsi test edecegiz.
          </p>
        </div>
      </div>
    )
  }

  return <div className="sandbox-stage" ref={containerRef} />
}

export default SandboxCanvas
