export interface LevelConfig {
  level: number
  timeLimit: number
  requiredClicks: number
}

// Level 5+ is intentionally unbeatable
const levels: LevelConfig[] = [
  { level: 1, timeLimit: 15, requiredClicks: 10 },
  { level: 2, timeLimit: 13, requiredClicks: 18 },
  { level: 3, timeLimit: 11, requiredClicks: 28 },
  { level: 4, timeLimit: 9, requiredClicks: 40 },
  { level: 5, timeLimit: 5, requiredClicks: 999 },
]

export function getLevelConfig(level: number): LevelConfig {
  if (level <= levels.length) return levels[level - 1]
  return { level, timeLimit: 3, requiredClicks: 999 }
}
