import type { DJ } from '@/db'

interface DJWithProbability extends DJ {
  probability: number
  daysSinceLastPlay: number
  rawScore?: number
}

interface ProbabilitySettings {
  weightLastPlayed: number  // Poids pour l'ancienneté (0-1)
  weightTotalPlays: number  // Poids pour le nombre de passages (0-1)
}

const DEFAULT_SETTINGS: ProbabilitySettings = {
  weightLastPlayed: 0.6,
  weightTotalPlays: 0.4,
}

/**
 * Calcule les probabilités pour chaque DJ
 * Plus un DJ n'a pas joué depuis longtemps, plus sa probabilité augmente
 * Moins un DJ a joué au total, plus sa probabilité augmente
 */
export function calculateProbabilities(
  djs: DJ[],
  settings: ProbabilitySettings = DEFAULT_SETTINGS
): DJWithProbability[] {
  if (djs.length === 0) return []

  const now = new Date()
  const activeDJs = djs.filter(dj => dj.isActive)

  if (activeDJs.length === 0) return []

  // Calculer les jours depuis le dernier passage pour chaque DJ
  const djsWithDays = activeDJs.map(dj => {
    const daysSinceLastPlay = dj.lastPlayedAt
      ? Math.floor((now.getTime() - new Date(dj.lastPlayedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 365 // Si jamais joué, on considère 365 jours

    return { ...dj, daysSinceLastPlay }
  })

  // Trouver les valeurs max pour normaliser
  const maxDays = Math.max(...djsWithDays.map(d => d.daysSinceLastPlay), 1)
  const maxPlays = Math.max(...djsWithDays.map(d => d.totalPlays), 1)

  // Calculer les scores bruts
  const djsWithScores = djsWithDays.map(dj => {
    // Score basé sur l'ancienneté (plus c'est vieux, plus le score est élevé)
    const ageScore = dj.daysSinceLastPlay / maxDays

    // Score basé sur le nombre de passages (moins on a joué, plus le score est élevé)
    const playsScore = 1 - (dj.totalPlays / (maxPlays + 1))

    // Score combiné avec les poids
    const rawScore = (ageScore * settings.weightLastPlayed) + (playsScore * settings.weightTotalPlays)

    // Ajouter un peu d'aléatoire pour éviter que ce soit toujours le même
    const randomFactor = 0.9 + Math.random() * 0.2 // Entre 0.9 et 1.1

    return {
      ...dj,
      rawScore: rawScore * randomFactor,
    }
  })

  // Normaliser les scores en probabilités (somme = 100%)
  const totalScore = djsWithScores.reduce((sum, dj) => sum + dj.rawScore, 0)

  return djsWithScores.map(dj => ({
    ...dj,
    probability: totalScore > 0 ? (dj.rawScore / totalScore) * 100 : 100 / activeDJs.length,
  })).sort((a, b) => b.probability - a.probability)
}

/**
 * Sélectionne un DJ basé sur les probabilités calculées
 */
export function selectDJByProbability(djsWithProbability: DJWithProbability[]): DJWithProbability | null {
  if (djsWithProbability.length === 0) return null

  const random = Math.random() * 100
  let cumulative = 0

  for (const dj of djsWithProbability) {
    cumulative += dj.probability
    if (random <= cumulative) {
      return dj
    }
  }

  // Fallback au premier (ne devrait jamais arriver)
  return djsWithProbability[0]
}

/**
 * Génère des couleurs aléatoires fun pour les DJs
 */
export function getRandomColor(): string {
  const colors = [
    '#ff6ec7', // neon pink
    '#00f5ff', // cyan
    '#39ff14', // neon green
    '#fff700', // yellow
    '#ff9f1c', // orange
    '#a855f7', // purple
    '#f43f5e', // rose
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Liste d'emojis pour les avatars
 */
export const AVATAR_EMOJIS = [
  '🎧', '🎤', '🎵', '🎶', '🎸', '🎹', '🎺', '🎻', '🥁', '🎷',
  '🦄', '🌟', '⚡', '🔥', '💎', '🎪', '🎭', '🎨', '🚀', '👾',
  '🤖', '👻', '🎃', '🦊', '🐱', '🐶', '🦁', '🐼', '🐨', '🦋',
]

export function getRandomEmoji(): string {
  return AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)]
}
