import type { CharacterBuild } from '../types'

interface CharacterBuildArtProps {
  character: CharacterBuild
}

function hexWithAlpha(hex: string, alpha: string) {
  return `${hex}${alpha}`
}

function isFrogLike(character: CharacterBuild) {
  return /frog|kurbaga|toad|amphib/i.test(
    `${character.name} ${character.species} ${character.prompt}`,
  )
}

export function CharacterBuildArt({ character }: CharacterBuildArtProps) {
  const frogLike = isFrogLike(character)
  const eyeY = frogLike ? 58 : 68
  const shoulderWidth = 112 + character.stats.defense * 0.7
  const glowRadius = 22 + character.stats.attack * 0.45
  const leapTilt = (character.stats.mobility - 25) * 0.25

  return (
    <svg
      className="build-swatch-art"
      viewBox="0 0 320 180"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="character-bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor={character.palette.primary} />
          <stop offset="100%" stopColor={character.palette.secondary} />
        </linearGradient>
        <radialGradient id="character-core" cx="50%" cy="42%" r="64%">
          <stop offset="0%" stopColor={character.palette.core} />
          <stop offset="100%" stopColor={hexWithAlpha(character.palette.core, '66')} />
        </radialGradient>
      </defs>

      <rect width="320" height="180" fill="url(#character-bg)" />
      <circle
        cx="82"
        cy="44"
        r="46"
        fill={hexWithAlpha(character.palette.core, '26')}
      />
      <circle
        cx="270"
        cy="28"
        r={glowRadius}
        fill={hexWithAlpha(character.palette.accent, '30')}
      />
      <ellipse
        cx="160"
        cy="154"
        rx="96"
        ry="18"
        fill={hexWithAlpha(character.palette.primary, '66')}
      />

      <g transform={`translate(0 ${frogLike ? 0 : 6}) rotate(${leapTilt} 160 104)`}>
        <ellipse
          cx="160"
          cy="108"
          rx={shoulderWidth / 2}
          ry="42"
          fill={character.palette.primary}
        />
        <ellipse
          cx="160"
          cy="116"
          rx="38"
          ry="30"
          fill={hexWithAlpha(character.palette.core, 'CC')}
        />

        {frogLike ? (
          <>
            <circle cx="126" cy="56" r="18" fill={character.palette.secondary} />
            <circle cx="194" cy="56" r="18" fill={character.palette.secondary} />
            <circle cx="126" cy="58" r="11" fill={character.palette.core} />
            <circle cx="194" cy="58" r="11" fill={character.palette.core} />
            <circle cx="128" cy={eyeY} r="4.5" fill="#233537" />
            <circle cx="192" cy={eyeY} r="4.5" fill="#233537" />
            <path
              d="M130 92 Q160 112 190 92"
              fill="none"
              stroke="#233537"
              strokeLinecap="round"
              strokeWidth="5"
            />
            <path
              d="M108 100 Q88 108 92 126"
              fill="none"
              stroke={character.palette.accent}
              strokeLinecap="round"
              strokeWidth="8"
            />
            <path
              d="M212 100 Q232 108 228 126"
              fill="none"
              stroke={character.palette.accent}
              strokeLinecap="round"
              strokeWidth="8"
            />
            <path
              d="M126 138 Q108 154 92 142"
              fill="none"
              stroke={character.palette.secondary}
              strokeLinecap="round"
              strokeWidth="10"
            />
            <path
              d="M194 138 Q212 154 228 142"
              fill="none"
              stroke={character.palette.secondary}
              strokeLinecap="round"
              strokeWidth="10"
            />
          </>
        ) : (
          <>
            <circle cx="160" cy="64" r="30" fill={character.palette.secondary} />
            <rect
              x="139"
              y="57"
              width="42"
              height="14"
              rx="7"
              fill={hexWithAlpha(character.palette.accent, 'CC')}
            />
            <circle cx="151" cy="64" r="3.5" fill={character.palette.core} />
            <circle cx="169" cy="64" r="3.5" fill={character.palette.core} />
            <rect
              x="102"
              y="84"
              width="22"
              height="56"
              rx="11"
              fill={character.palette.accent}
            />
            <rect
              x="196"
              y="84"
              width="22"
              height="56"
              rx="11"
              fill={character.palette.accent}
            />
          </>
        )}

        <rect
          x="110"
          y="86"
          width="24"
          height="18"
          rx="9"
          fill={hexWithAlpha(character.palette.accent, '88')}
        />
        <rect
          x="186"
          y="86"
          width="24"
          height="18"
          rx="9"
          fill={hexWithAlpha(character.palette.accent, '88')}
        />
      </g>
    </svg>
  )
}
