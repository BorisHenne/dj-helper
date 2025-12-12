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
  videoId: string | null
  playedAt: string
  createdAt: string
  updatedAt: string
}

export type DailySessionStatus = 'pending' | 'completed' | 'skipped'

export interface DailySession {
  id: string
  date: string
  djId: string | null
  djName: string
  status: DailySessionStatus
  youtubeUrl: string | null
  videoId: string | null
  title: string | null
  artist: string | null
  skipReason: string | null
  createdAt: string
  updatedAt: string
}

export interface TodaySessionResponse {
  session: DailySession | null
  isBusinessDay: boolean
  date?: string
  message?: string
}

export interface NextSessionResponse {
  session: DailySession | null
  isToday: boolean
  nextBusinessDay: string
}
