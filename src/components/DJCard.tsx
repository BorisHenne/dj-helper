'use client'

import { motion } from 'framer-motion'
import { DJWithProbability } from '@/types'
import { Crown, Calendar, Hash } from 'lucide-react'

interface DJCardProps {
  dj: DJWithProbability
  rank: number
  isWinner?: boolean
}

export default function DJCard({ dj, rank, isWinner }: DJCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais'
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      className={`
        glass rounded-xl p-4 flex items-center gap-4
        ${isWinner ? 'winner-animation border-2 border-neon-yellow' : ''}
        hover:bg-white/10 transition-all duration-300
      `}
    >
      {/* Rang */}
      <div className="flex-shrink-0 w-8 text-center">
        {rank === 0 ? (
          <Crown className="w-6 h-6 text-neon-yellow mx-auto" />
        ) : (
          <span className="text-gray-500 font-bold">#{rank + 1}</span>
        )}
      </div>

      {/* Avatar */}
      <div
        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
        style={{ backgroundColor: dj.color || '#ff6ec7' }}
      >
        {dj.avatar || '🎧'}
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0">
        <h3 className="font-bold text-white truncate">{dj.name}</h3>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {dj.totalPlays} passages
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(dj.lastPlayedAt)}
          </span>
        </div>
      </div>

      {/* Probabilité */}
      <div className="flex-shrink-0 text-right">
        <div
          className="text-lg font-bold"
          style={{ color: dj.color || '#ff6ec7' }}
        >
          {dj.probability.toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500">
          {dj.daysSinceLastPlay}j
        </div>
      </div>

      {/* Barre de probabilité */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 rounded-b-xl overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${dj.probability}%` }}
          transition={{ delay: rank * 0.1 + 0.3, duration: 0.5 }}
          className="h-full"
          style={{ backgroundColor: dj.color || '#ff6ec7' }}
        />
      </div>
    </motion.div>
  )
}
