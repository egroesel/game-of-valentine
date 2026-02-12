export interface Hint {
  emoji: string
  text: string
}

// Hints revealed after completing each level
const hints: Hint[] = [
  { emoji: '🌈', text: 'Die Verpackung ist schwarz, aber bunt.' },
  { emoji: '👀', text: 'Eigentlich hätte ich es auch gern behalten.' },
  { emoji: '📍', text: 'Du findest es an einem Ort, an dem du selten bist, aber ich bin da sehr oft lol.' },
  { emoji: '❌', text: 'Das reicht jetzt aber auch mit Hinweisen...' },
]

export function getHint(level: number): Hint | null {
  if (level >= 1 && level <= hints.length) {
    return hints[level - 1]
  }
  return null
}

export function getTotalHints(): number {
  return hints.length
}
