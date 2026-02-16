'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { DJWithProbability } from '@/types'
import { Crown, Calendar, Hash, Palmtree, Pencil, Trash2, X, Check } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { AVATAR_EMOJIS } from '@/lib/probability'

interface DJCardProps {
  dj: DJWithProbability
  rank: number
  isWinner?: boolean
  compact?: boolean
  isNextDj?: boolean
  onToggleLeave?: (id: string, isOnLeave: boolean) => void
  onEdit?: (id: string, data: { name: string; avatar: string; color: string }) => void
  onDelete?: (id: string) => void
}

export default function DJCard({ dj, rank, isWinner, compact, isNextDj, onToggleLeave, onEdit, onDelete }: DJCardProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editData, setEditData] = useState({ name: dj.name, avatar: dj.avatar || '🎧', color: dj.color || '#ff6ec7' })

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return t('common.never')
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
    })
  }

  const handleSaveEdit = () => {
    if (!editData.name.trim()) return
    onEdit?.(dj.id, editData)
    setIsEditing(false)
  }

  const handleDelete = () => {
    onDelete?.(dj.id)
    setShowDeleteConfirm(false)
  }

  if (compact) {
    // Editing mode inline
    if (isEditing) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg p-2 bg-white/10 border border-neon-blue/30"
        >
          <div className="space-y-2">
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full text-sm px-2 py-1 bg-white/5 rounded border border-white/10 focus:border-neon-blue/50 outline-none text-white"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-0.5 flex-1">
                {AVATAR_EMOJIS.slice(0, 10).map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setEditData({ ...editData, avatar: emoji })}
                    className={`text-sm p-0.5 rounded ${
                      editData.avatar === emoji ? 'bg-neon-pink/30' : 'hover:bg-white/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <input
                type="color"
                value={editData.color}
                onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer"
              />
            </div>
            <div className="flex justify-end gap-1">
              <button
                onClick={() => { setIsEditing(false); setEditData({ name: dj.name, avatar: dj.avatar || '🎧', color: dj.color || '#ff6ec7' }) }}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSaveEdit}
                className="p-1 rounded text-green-400 hover:text-green-300 hover:bg-green-500/10"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )
    }

    // Delete confirmation
    if (showDeleteConfirm) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg p-2 bg-red-500/10 border border-red-500/30"
        >
          <p className="text-sm text-red-400 mb-2">{t('sidebar.deleteConfirm', { name: dj.name })}</p>
          <div className="flex justify-end gap-1">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleDelete}
              className="px-2 py-1 text-xs bg-red-500 rounded font-bold text-white"
            >
              {t('common.delete')}
            </button>
          </div>
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(rank * 0.05, 0.5) }}
        className={`
          relative rounded-lg p-2 flex items-center gap-2
          ${isWinner ? 'winner-animation border border-neon-yellow bg-yellow-500/10' : ''}
          ${isNextDj ? 'border border-neon-blue/50 bg-cyan-500/10' : ''}
          ${!isWinner && !isNextDj ? 'bg-white/5 hover:bg-white/10' : ''}
          ${dj.isOnLeave ? 'opacity-50' : ''}
          transition-all duration-200 group
        `}
      >
        {/* Rang */}
        <div className="flex-shrink-0 w-6 text-center">
          {rank === 0 && !dj.isOnLeave ? (
            <Crown className="w-4 h-4 text-neon-yellow mx-auto" />
          ) : (
            <span className="text-white/70 text-xs font-bold">#{rank + 1}</span>
          )}
        </div>

        {/* Avatar */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base"
          style={{ backgroundColor: dj.color || '#ff6ec7' }}
        >
          {dj.avatar || '🎧'}
        </div>

        {/* Nom et stats */}
        <div className="flex-grow min-w-0">
          <span className="font-medium text-sm text-white truncate block">{dj.name}</span>
          <span className="text-xs text-white/70">
            {dj.totalPlays} plays - {dj.daysSinceLastPlay}d
          </span>
        </div>

        {/* Badge prochain DJ */}
        {isNextDj && (
          <div className="flex-shrink-0 px-1.5 py-0.5 bg-neon-blue/20 rounded text-[10px] text-neon-blue font-medium">
            Next
          </div>
        )}

        {/* Action buttons - directly visible */}
        {(onEdit || onDelete || onToggleLeave) && (
          <div className="flex-shrink-0 flex items-center gap-0.5">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true) }}
                className="p-1 rounded text-blue-400 hover:text-blue-300 hover:bg-blue-500/15 transition-colors"
                title={t('common.edit')}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onToggleLeave && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleLeave(dj.id, dj.isOnLeave) }}
                className={`p-1 rounded transition-colors ${
                  dj.isOnLeave
                    ? 'text-green-400 hover:text-green-300 hover:bg-green-500/15'
                    : 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/15'
                }`}
                title={dj.isOnLeave ? t('user.active') : t('sidebar.onLeave')}
              >
                <Palmtree className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true) }}
                className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-colors"
                title={t('common.delete')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Probabilite */}
        {!dj.isOnLeave && (
          <div
            className="flex-shrink-0 text-sm font-bold"
            style={{ color: dj.color || '#ff6ec7' }}
          >
            {dj.probability.toFixed(1)}%
          </div>
        )}

        {dj.isOnLeave && (
          <div className="flex-shrink-0">
            <Palmtree className="w-4 h-4 text-orange-400" />
          </div>
        )}

        {/* Barre de probabilite */}
        {!dj.isOnLeave && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800/50 rounded-b-lg overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dj.probability}%` }}
              transition={{ delay: Math.min(rank * 0.05, 0.5) + 0.2, duration: 0.3 }}
              className="h-full"
              style={{ backgroundColor: dj.color || '#ff6ec7' }}
            />
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      className={`
        relative glass rounded-xl p-4 flex items-center gap-4
        ${isWinner ? 'winner-animation border-2 border-neon-yellow' : ''}
        hover:bg-white/10 transition-all duration-300
      `}
    >
      {/* Rang */}
      <div className="flex-shrink-0 w-8 text-center">
        {rank === 0 ? (
          <Crown className="w-6 h-6 text-neon-yellow mx-auto" />
        ) : (
          <span className="text-white/70 font-bold">#{rank + 1}</span>
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
        <div className="flex items-center gap-3 text-xs text-white/70">
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {dj.totalPlays} {t('common.passages')}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(dj.lastPlayedAt)}
          </span>
        </div>
      </div>

      {/* Probabilite */}
      <div className="flex-shrink-0 text-right">
        <div
          className="text-lg font-bold"
          style={{ color: dj.color || '#ff6ec7' }}
        >
          {dj.probability.toFixed(1)}%
        </div>
        <div className="text-xs text-white/70">
          {dj.daysSinceLastPlay}{t('common.daysAgo')}
        </div>
      </div>

      {/* Barre de probabilite */}
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
