export interface DJ {
  id: string
  name: string
  avatar: string | null
  color: string | null
  totalPlays: number
  lastPlayedAt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DJWithProbability extends DJ {
  probability: number
  daysSinceLastPlay: number
}

export interface Play {
  id: string
  djId: string
  playedAt: string
  notes: string | null
}

export interface Settings {
  id: string
  lastSelectedDjId: string | null
  weightLastPlayed: number
  weightTotalPlays: number
}

export interface ProbabilityResponse {
  djs: DJWithProbability[]
  settings: {
    weightLastPlayed: number
    weightTotalPlays: number
  }
}

export interface SelectionResponse {
  selected: DJWithProbability
  allProbabilities: DJWithProbability[]
}

export interface DJHistory {
  id: string
  djName: string
  title: string
  artist: string
  youtubeUrl: string
  playedAt: string
  createdAt: string
  updatedAt: string
}
