import * as Phaser from 'phaser'
import type {
  AttackBuild,
  CharacterBuild,
  GameLogEntry,
  LogLevel,
  StatusEffect,
} from '../types'

type PhysicsSprite = Phaser.Physics.Arcade.Sprite
type SceneLogger = (entry: Omit<GameLogEntry, 'id' | 'timestamp'>) => void

interface DamageableTarget extends PhysicsSprite {
  dreamHealth: number
  maxDreamHealth: number
  direction: 1 | -1
  statusTimer?: Phaser.Time.TimerEvent | null
}

const GAME_WIDTH = 960
const GAME_HEIGHT = 540
const FLOOR_Y = 454
const PLAYER_START_X = 200
const DUMMY_START_X = 760
const GUARD_LOG_INTERVAL_MS = 600

export function createDreamSandbox(
  parent: HTMLDivElement,
  character: CharacterBuild,
  attack: AttackBuild,
  onLog?: SceneLogger,
) {
  const scene = new DreamSandboxScene(character, attack, onLog)

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#10262a',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 1100 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    scene: [scene],
  })
}

class DreamSandboxScene extends Phaser.Scene {
  private readonly attack: AttackBuild

  private readonly character: CharacterBuild

  private readonly onLog?: SceneLogger

  private player!: PhysicsSprite

  private dummy!: DamageableTarget

  private projectiles!: Phaser.Physics.Arcade.Group

  private floor!: Phaser.GameObjects.Rectangle

  private keys!: {
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
    jump: Phaser.Input.Keyboard.Key
  }

  private aimGuide!: Phaser.GameObjects.Graphics

  private attackTimerText!: Phaser.GameObjects.Text

  private dummyHealthText!: Phaser.GameObjects.Text

  private playerHealthText!: Phaser.GameObjects.Text

  private statusText!: Phaser.GameObjects.Text

  private nextFireAt = 0

  private audioContext?: AudioContext

  private isSceneActive = false

  private lastGuardLogAt = 0

  constructor(character: CharacterBuild, attack: AttackBuild, onLog?: SceneLogger) {
    super('dream-sandbox')
    this.character = character
    this.attack = attack
    this.onLog = onLog
  }

  create() {
    this.isSceneActive = true
    this.drawBackground()
    this.createTextures()
    this.createArena()
    this.createActors()
    this.createUi()

    this.input.mouse?.disableContextMenu()
    this.keys = this.input.keyboard!.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as DreamSandboxScene['keys']

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.isSceneActive = false
      this.log('sandbox', 'info', 'Sandbox scene shutting down.')
    })

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.isSceneActive = false
      this.log('sandbox', 'info', 'Sandbox scene destroyed.')
    })

    this.log('sandbox', 'info', 'Sandbox scene created.')
  }

  update(time: number) {
    if (!this.canRunFrame('update loop')) {
      return
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body
    const pointer = this.input.activePointer
    const moveSpeed = this.character.runtime.moveSpeed

    if (this.keys.left.isDown && !this.keys.right.isDown) {
      body.setVelocityX(-moveSpeed)
    } else if (this.keys.right.isDown && !this.keys.left.isDown) {
      body.setVelocityX(moveSpeed)
    } else {
      body.setVelocityX(0)
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.jump) && body.blocked.down) {
      body.setVelocityY(-this.character.runtime.jumpVelocity)
    }

    this.player.setFlipX(pointer.worldX < this.player.x)
    this.updateAimGuide(pointer)
    this.updateDummyPatrol()
    this.cleanupProjectiles()
    this.updateUi(time)

    if (pointer.leftButtonDown() && time >= this.nextFireAt) {
      this.nextFireAt = time + this.attack.runtime.cooldownMs
      this.fire(pointer)
    }

    if (this.playerHealthText?.active) {
      this.playerHealthText.setText(
        `Player HP ${this.character.runtime.maxHealth}  DEF ${Math.round(
          this.character.runtime.defenseRatio * 100,
        )}%`,
      )
    }

    if (this.statusText?.active) {
      const activeStatus = this.attack.statusEffect ? this.attack.statusEffect : 'none'
      this.statusText.setText(
        `Attack ${this.attack.family}  |  Element ${this.attack.element}  |  Status ${activeStatus}`,
      )
    }
  }

  private drawBackground() {
    const sky = this.add.graphics()
    sky.fillGradientStyle(0xfff1cb, 0xffd4aa, 0x31595f, 0x10262a, 1)
    sky.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    const haze = this.add.graphics()
    haze.fillStyle(0xffffff, 0.15)
    haze.fillCircle(170, 110, 110)
    haze.fillCircle(760, 80, 90)
    haze.fillStyle(0x46b4a8, 0.18)
    haze.fillEllipse(760, 190, 260, 120)
    haze.fillStyle(0xf17534, 0.14)
    haze.fillEllipse(170, 235, 220, 110)

    const confetti = this.add.graphics()
    confetti.fillStyle(0xffffff, 0.16)

    for (let index = 0; index < 36; index += 1) {
      confetti.fillCircle(
        Phaser.Math.Between(20, 940),
        Phaser.Math.Between(30, 300),
        Phaser.Math.Between(1, 3),
      )
    }
  }

  private createTextures() {
    if (!this.textures.exists('dream-player')) {
      const graphics = this.make.graphics()
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(this.character.palette.primary).color)
      graphics.fillRoundedRect(16, 28, 50, 64, 18)
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(this.character.palette.secondary).color)
      graphics.fillCircle(41, 24, 20)
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(this.character.palette.accent).color)
      graphics.fillCircle(28, 20, 8)
      graphics.fillCircle(54, 20, 8)
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(this.character.palette.core).color)
      graphics.fillCircle(35, 24, 3)
      graphics.fillCircle(47, 24, 3)
      graphics.fillRect(22, 90, 10, 20)
      graphics.fillRect(50, 90, 10, 20)
      graphics.generateTexture('dream-player', 82, 116)
      graphics.destroy()
    }

    if (!this.textures.exists('dream-dummy')) {
      const graphics = this.make.graphics()
      graphics.fillStyle(0x33484d)
      graphics.fillRoundedRect(12, 18, 52, 64, 16)
      graphics.fillStyle(0xb7d9df)
      graphics.fillRoundedRect(24, 28, 28, 20, 8)
      graphics.fillStyle(0xfff3c4)
      graphics.fillCircle(30, 38, 3)
      graphics.fillCircle(46, 38, 3)
      graphics.fillStyle(0xf17534)
      graphics.fillRect(20, 84, 10, 18)
      graphics.fillRect(46, 84, 10, 18)
      graphics.generateTexture('dream-dummy', 76, 108)
      graphics.destroy()
    }

    if (!this.textures.exists('dream-projectile')) {
      const graphics = this.make.graphics()
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(this.attack.visuals.primary).color)
      graphics.fillCircle(14, 14, 10)
      graphics.fillStyle(
        Phaser.Display.Color.HexStringToColor(this.attack.visuals.highlight).color,
        0.9,
      )
      graphics.fillCircle(14, 14, 5)
      graphics.generateTexture('dream-projectile', 28, 28)
      graphics.destroy()
    }
  }

  private createArena() {
    const floorGlow = this.add.graphics()
    floorGlow.fillStyle(0xffbd70, 0.22)
    floorGlow.fillEllipse(GAME_WIDTH / 2, FLOOR_Y + 10, 760, 48)

    this.floor = this.add.rectangle(GAME_WIDTH / 2, FLOOR_Y + 32, GAME_WIDTH, 80, 0x163337, 1)
    this.physics.add.existing(this.floor, true)
    ;(this.floor.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()

    this.projectiles = this.physics.add.group({
      allowGravity: false,
      maxSize: 32,
    })

    this.aimGuide = this.add.graphics()
  }

  private createActors() {
    this.player = this.physics.add
      .sprite(PLAYER_START_X, FLOOR_Y - 46, 'dream-player')
      .setScale(this.character.runtime.sizeScale)
      .setCollideWorldBounds(true)

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    playerBody.setSize(42, 84)
    playerBody.setOffset(20, 22)
    playerBody.setDragX(2200)

    this.dummy = this.physics.add
      .sprite(DUMMY_START_X, FLOOR_Y - 44, 'dream-dummy')
      .setCollideWorldBounds(true) as DamageableTarget

    const dummyBody = this.dummy.body as Phaser.Physics.Arcade.Body
    dummyBody.setSize(40, 80)
    dummyBody.setOffset(18, 20)
    this.dummy.direction = -1
    this.dummy.dreamHealth = 340
    this.dummy.maxDreamHealth = 340

    this.physics.add.collider(this.player, this.floor)
    this.physics.add.collider(this.dummy, this.floor)
    this.physics.add.collider(this.projectiles, this.floor, (projectile) => {
      projectile.destroy()
    })
    this.physics.add.overlap(this.projectiles, this.dummy, (projectile, dummy) => {
      this.hitDummy(dummy as DamageableTarget, projectile as PhysicsSprite)
      projectile.destroy()
    })
  }

  private createUi() {
    const card = this.add.rectangle(180, 64, 320, 92, 0xffffff, 0.18).setOrigin(0, 0)
    card.setStrokeStyle(1, 0xffffff, 0.12)

    this.add
      .text(196, 82, this.character.name, {
        fontFamily: 'Bricolage Grotesque',
        fontSize: '20px',
        color: '#fff7dc',
      })
      .setResolution(2)

    this.add
      .text(196, 108, `${this.attack.name} | ${this.attack.family}`, {
        fontFamily: 'Space Grotesk',
        fontSize: '14px',
        color: '#e7f7f5',
      })
      .setResolution(2)

    this.playerHealthText = this.add
      .text(196, 132, '', {
        fontFamily: 'Space Grotesk',
        fontSize: '13px',
        color: '#ffeccd',
      })
      .setResolution(2)

    this.statusText = this.add
      .text(24, 22, '', {
        fontFamily: 'Space Grotesk',
        fontSize: '14px',
        color: '#f5f1d3',
      })
      .setResolution(2)

    this.attackTimerText = this.add
      .text(24, 46, '', {
        fontFamily: 'Space Grotesk',
        fontSize: '14px',
        color: '#f2d3c4',
      })
      .setResolution(2)

    this.dummyHealthText = this.add
      .text(666, 28, '', {
        fontFamily: 'Space Grotesk',
        fontSize: '16px',
        color: '#f7f8f1',
      })
      .setResolution(2)
  }

  private updateAimGuide(pointer: Phaser.Input.Pointer) {
    if (!this.aimGuide?.active) {
      return
    }

    this.aimGuide.clear()
    this.aimGuide.lineStyle(2, 0xffefc7, 0.42)
    this.aimGuide.beginPath()
    this.aimGuide.moveTo(this.player.x, this.player.y - 14)
    this.aimGuide.lineTo(pointer.worldX, pointer.worldY)
    this.aimGuide.strokePath()
  }

  private updateDummyPatrol() {
    if (!this.hasArcadeBody(this.dummy)) {
      this.logGuard('Dummy patrol skipped because the dummy body is unavailable.')
      return
    }

    if (this.dummy.dreamHealth <= 0) {
      this.dummy.setVelocityX(0)
      return
    }

    if (this.dummy.x <= 620) this.dummy.direction = 1
    if (this.dummy.x >= 860) this.dummy.direction = -1

    this.dummy.setVelocityX(this.dummy.direction * 85)
    this.dummy.setFlipX(this.dummy.direction === -1)
  }

  private updateUi(time: number) {
    if (!this.attackTimerText?.active || !this.dummyHealthText?.active || !this.hasArcadeBody(this.dummy)) {
      return
    }

    const cooldown = Math.max(0, this.nextFireAt - time)
    this.attackTimerText.setText(
      cooldown > 0 ? `Cooldown ${Math.ceil(cooldown)} ms` : 'Cooldown ready',
    )
    this.dummyHealthText.setText(
      `Dummy ${Math.max(0, Math.ceil(this.dummy.dreamHealth))}/${this.dummy.maxDreamHealth}`,
    )
  }

  private fire(pointer: Phaser.Input.Pointer) {
    if (!this.canRunFrame('fire')) {
      return
    }

    const direction = new Phaser.Math.Vector2(
      pointer.worldX - this.player.x,
      pointer.worldY - (this.player.y - 18),
    )

    if (direction.lengthSq() <= 0) {
      direction.set(this.player.flipX ? -1 : 1, 0)
    }

    direction.normalize()

    if (this.attack.family === 'slash' || this.attack.family === 'gauntlet') {
      this.fireShortRange(direction)
      return
    }

    if (this.attack.family === 'beam') {
      this.fireBeam(direction)
      return
    }

    this.fireProjectilePattern(direction)
  }

  private fireProjectilePattern(direction: Phaser.Math.Vector2) {
    const projectileCount = this.attack.runtime.projectileCount
    const spreadAngle = this.attack.runtime.spreadAngle

    for (let index = 0; index < projectileCount; index += 1) {
      const angleOffset =
        projectileCount === 1
          ? 0
          : Phaser.Math.Linear(-spreadAngle, spreadAngle, index / (projectileCount - 1))
      const velocity = direction.clone().rotate(Phaser.Math.DegToRad(angleOffset))
      const projectile = this.projectiles.create(
        this.player.x,
        this.player.y - 18,
        'dream-projectile',
      ) as PhysicsSprite

      projectile.setTint(Phaser.Display.Color.HexStringToColor(this.attack.visuals.highlight).color)
      projectile.setScale(this.attack.runtime.projectileSize)
      projectile.setData('spawnX', this.player.x)
      projectile.setData('spawnY', this.player.y)
      projectile.setData('range', this.attack.runtime.range)
      projectile.setData('damage', this.attack.runtime.damage)
      projectile.setData('statusEffect', this.attack.statusEffect)
      projectile.setData('knockback', this.attack.runtime.knockback)

      const body = projectile.body as Phaser.Physics.Arcade.Body
      body.setAllowGravity(this.attack.family === 'lobbed')

      if (this.attack.family === 'lobbed') {
        body.setGravityY(1000 * this.attack.runtime.gravityScale)
      }

      body.setVelocity(
        velocity.x * this.attack.runtime.projectileSpeed,
        velocity.y * this.attack.runtime.projectileSpeed,
      )
    }

    this.log('combat', 'info', `Primary attack fired (${this.attack.family}).`)
  }

  private fireShortRange(direction: Phaser.Math.Vector2) {
    const reach = this.attack.runtime.range
    const burst = this.add.graphics()
    burst.lineStyle(
      12,
      Phaser.Display.Color.HexStringToColor(this.attack.visuals.highlight).color,
      0.9,
    )
    burst.beginPath()
    burst.moveTo(this.player.x, this.player.y - 18)
    burst.lineTo(
      this.player.x + direction.x * reach,
      this.player.y - 18 + direction.y * reach,
    )
    burst.strokePath()

    this.tweens.add({
      targets: burst,
      alpha: 0,
      duration: 120,
      onComplete: () => burst.destroy(),
    })

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y - 18,
      this.dummy.x,
      this.dummy.y - 18,
    )

    const toDummy = new Phaser.Math.Vector2(
      this.dummy.x - this.player.x,
      this.dummy.y - this.player.y,
    ).normalize()

    if (
      distance <= reach + 30 &&
      Math.abs(Phaser.Math.Angle.Wrap(direction.angle() - toDummy.angle())) < 0.8
    ) {
      this.applyDamage(
        this.dummy,
        this.attack.runtime.damage,
        this.attack.runtime.knockback,
        this.attack.statusEffect,
      )
    }

    this.playImpactTone(210, 0.04)
    this.log('combat', 'info', `Melee attack swung (${this.attack.family}).`)
  }

  private fireBeam(direction: Phaser.Math.Vector2) {
    const beamLine = new Phaser.Geom.Line(
      this.player.x,
      this.player.y - 18,
      this.player.x + direction.x * this.attack.runtime.range,
      this.player.y - 18 + direction.y * this.attack.runtime.range,
    )

    const beam = this.add.graphics()
    beam.lineStyle(8, Phaser.Display.Color.HexStringToColor(this.attack.visuals.highlight).color, 0.9)
    beam.strokeLineShape(beamLine)

    const nearestPoint = Phaser.Geom.Line.GetNearestPoint(
      beamLine,
      new Phaser.Math.Vector2(this.dummy.x, this.dummy.y - 10),
    )

    const beamDistance = Phaser.Math.Distance.Between(
      this.dummy.x,
      this.dummy.y - 10,
      nearestPoint.x,
      nearestPoint.y,
    )

    if (beamDistance < 32) {
      this.applyDamage(
        this.dummy,
        this.attack.runtime.damage,
        this.attack.runtime.knockback,
        this.attack.statusEffect,
      )
    }

    this.tweens.add({
      targets: beam,
      alpha: 0,
      duration: this.attack.runtime.beamDurationMs || 120,
      onComplete: () => beam.destroy(),
    })

    this.playImpactTone(260, 0.05)
    this.log('combat', 'info', 'Beam attack fired.')
  }

  private hitDummy(dummy: DamageableTarget, projectile: PhysicsSprite) {
    if (!this.hasArcadeBody(dummy)) {
      this.logGuard('Projectile hit skipped because the dummy body is unavailable.')
      return
    }

    const damage = Number(projectile.getData('damage') ?? this.attack.runtime.damage)
    const knockback = Number(projectile.getData('knockback') ?? this.attack.runtime.knockback)
    const statusEffect = (projectile.getData('statusEffect') ??
      this.attack.statusEffect) as StatusEffect
    this.applyDamage(dummy, damage, knockback, statusEffect)
  }

  private applyDamage(
    dummy: DamageableTarget,
    damage: number,
    knockback: number,
    statusEffect: StatusEffect,
  ) {
    if (!this.hasArcadeBody(dummy) || !this.hasArcadeBody(this.player)) {
      this.logGuard('Damage application skipped because an arcade body is unavailable.')
      return
    }

    if (dummy.dreamHealth <= 0) return

    dummy.dreamHealth = Math.max(0, dummy.dreamHealth - damage)
    dummy.setTint(0xffffff)
    dummy.setVelocityX((this.player.flipX ? -1 : 1) * knockback)
    this.time.delayedCall(70, () => {
      if (dummy.active) {
        dummy.clearTint()
      }
    })
    this.cameras.main.shake(80, 0.003)

    const number = this.add
      .text(dummy.x - 8, dummy.y - 74, `${damage}`, {
        fontFamily: 'Bricolage Grotesque',
        fontSize: '20px',
        color: '#fff3cb',
      })
      .setResolution(2)

    this.tweens.add({
      targets: number,
      y: number.y - 26,
      alpha: 0,
      duration: 420,
      onComplete: () => number.destroy(),
    })

    this.playImpactTone(180 + damage * 2, 0.05)
    this.applyStatus(dummy, statusEffect)
    this.log(
      'combat',
      'info',
      `Dummy took ${damage} damage${statusEffect ? ` with ${statusEffect}` : ''}.`,
    )

    if (dummy.dreamHealth <= 0) {
      this.onDummyDown(dummy)
    }
  }

  private applyStatus(dummy: DamageableTarget, statusEffect: StatusEffect) {
    if (!statusEffect || !this.hasArcadeBody(dummy)) return

    dummy.statusTimer?.destroy()
    this.log('combat', 'info', `Status applied: ${statusEffect}.`)

    const iterations = statusEffect === 'slow' ? 2 : 3
    const damagePerTick = statusEffect === 'burn' ? 4 : statusEffect === 'poison' ? 5 : 2

    dummy.statusTimer = this.time.addEvent({
      delay: 320,
      repeat: iterations - 1,
      callback: () => {
        if (!this.hasArcadeBody(dummy) || dummy.dreamHealth <= 0) return

        dummy.dreamHealth = Math.max(0, dummy.dreamHealth - damagePerTick)

        const spark = this.add.circle(
          dummy.x + Phaser.Math.Between(-10, 10),
          dummy.y - 42,
          9,
          statusEffect === 'poison'
            ? 0xc8ff61
            : statusEffect === 'burn'
              ? 0xffb054
              : 0xa7efff,
          0.9,
        )

        this.tweens.add({
          targets: spark,
          y: spark.y - 18,
          alpha: 0,
          duration: 240,
          onComplete: () => spark.destroy(),
        })

        if (dummy.dreamHealth <= 0) {
          this.onDummyDown(dummy)
        }
      },
    })
  }

  private onDummyDown(dummy: DamageableTarget) {
    if (!this.hasArcadeBody(dummy)) {
      this.logGuard('Dummy down handler skipped because the dummy body is unavailable.')
      return
    }

    dummy.setVelocity(0, 0)
    dummy.setTint(0x89a5ab)
    this.log('combat', 'warn', 'Dummy defeated. Reboot sequence started.')

    const banner = this.add
      .text(dummy.x - 56, dummy.y - 96, 'Dummy rebooting...', {
        fontFamily: 'Bricolage Grotesque',
        fontSize: '18px',
        color: '#fff4d4',
      })
      .setResolution(2)

    this.time.delayedCall(1300, () => {
      if (banner.active) {
        banner.destroy()
      }
      this.resetDummy()
    })
  }

  private resetDummy() {
    if (!this.hasArcadeBody(this.dummy)) {
      this.logGuard('Dummy reset skipped because the dummy body is unavailable.')
      return
    }

    this.dummy.clearTint()
    this.dummy.dreamHealth = this.dummy.maxDreamHealth
    this.dummy.setPosition(DUMMY_START_X, FLOOR_Y - 44)
    this.dummy.setVelocity(0, 0)
    this.log('combat', 'info', 'Dummy reboot complete.')
  }

  private cleanupProjectiles() {
    for (const child of this.projectiles.getChildren()) {
      const projectile = child as PhysicsSprite

      const spawnX = Number(projectile.getData('spawnX') ?? projectile.x)
      const spawnY = Number(projectile.getData('spawnY') ?? projectile.y)
      const range = Number(projectile.getData('range') ?? 900)

      if (
        Phaser.Math.Distance.Between(spawnX, spawnY, projectile.x, projectile.y) >
          range ||
        projectile.x < -40 ||
        projectile.x > GAME_WIDTH + 40 ||
        projectile.y > GAME_HEIGHT + 40
      ) {
        projectile.destroy()
      }
    }
  }

  private playImpactTone(frequency: number, duration: number) {
    const AudioContextClass = window.AudioContext
    if (!AudioContextClass) return

    if (!this.audioContext) {
      this.audioContext = new AudioContextClass()
    }

    const oscillator = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.value = frequency
    gain.gain.value = 0.025
    oscillator.connect(gain)
    gain.connect(this.audioContext.destination)
    oscillator.start()
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      this.audioContext.currentTime + duration,
    )
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  private canRunFrame(context: string) {
    if (
      !this.isSceneActive ||
      !this.keys ||
      !this.hasArcadeBody(this.player) ||
      !this.hasArcadeBody(this.dummy)
    ) {
      this.logGuard(`Frame skipped during ${context} because the scene is tearing down.`)
      return false
    }

    return true
  }

  private hasArcadeBody(target: PhysicsSprite | DamageableTarget | undefined) {
    return Boolean(target?.active && target.body)
  }

  private log(scope: GameLogEntry['scope'], level: LogLevel, message: string) {
    this.onLog?.({ scope, level, message })
  }

  private logGuard(message: string) {
    const now = this.time?.now ?? Date.now()
    if (now - this.lastGuardLogAt < GUARD_LOG_INTERVAL_MS) {
      return
    }

    this.lastGuardLogAt = now
    this.log('sandbox', 'warn', message)
  }
}
