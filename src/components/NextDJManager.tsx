'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DailySession, NextSessionResponse, DJWithProbability } from '@/types'
import {
  Calendar,
  User,
  Edit3,
  Trash2,
  XCircle,
  Check,
  Loader2,
  ChevronRight,
  AlertTriangle
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

interface NextDJManagerProps {
  djs: DJWithProbability[]
  onSelectDJ: (dj: DJWithProbability, date: Date) => void
  onSessionChange?: () => void
}

export default function NextDJManager({ djs, onSelectDJ, onSessionChange }: NextDJManagerProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [nextSession, setNextSession] = useState<DailySession | null>(null)
  const [nextBusinessDay, setNextBusinessDay] = useState<Date | null>(null)
  const [isToday, setIsToday] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSkipModal, setShowSkipModal] = useState(false)
  const [selectedDjId, setSelectedDjId] = useState<string>('')
  const [skipReason, setSkipReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchNextSession = async () => {
    try {
      const response = await fetch('/api/sessions/next')
      const data: NextSessionResponse = await response.json()
      setNextSession(data.session)
      setNextBusinessDay(new Date(data.nextBusinessDay))
      setIsToday(data.isToday)
    } catch (error) {
      console.error('Failed to fetch next session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNextSession()
  }, [])

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const handleEdit = async () => {
    if (!nextSession || !selectedDjId) return

    const selectedDj = djs.find(dj => dj.id === selectedDjId)
    if (!selectedDj) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/sessions/${nextSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          djId: selectedDj.id,
          djName: selectedDj.name
        })
      })

      if (response.ok) {
        setShowEditModal(false)
        fetchNextSession()
        onSessionChange?.()
      }
    } catch (error) {
      console.error('Failed to update session:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    if (!nextSession) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/sessions/${nextSession.id}/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: skipReason || t('session.dailyCancelled')
        })
      })

      if (response.ok) {
        setShowSkipModal(false)
        setSkipReason('')
        fetchNextSession()
        onSessionChange?.()
      }
    } catch (error) {
      console.error('Failed to skip session:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!nextSession) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/sessions/${nextSession.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchNextSession()
        onSessionChange?.()
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectNewDJ = () => {
    if (nextBusinessDay) {
      // Find a DJ from the list and pass it to the parent
      const topDj = djs[0]
      if (topDj) {
        onSelectDJ(topDj, nextBusinessDay)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4">
        <div className="animate-pulse">
          <div className="h-5 bg-white/10 rounded w-32 mb-3" />
          <div className="h-16 bg-white/10 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="glass rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {t('session.nextSession')}
        </h4>

        {nextSession && nextSession.status !== 'skipped' ? (
          <div className="space-y-3">
            {/* Next DJ Info */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="text-3xl">🎧</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{nextSession.djName}</p>
                <p className="text-xs text-gray-400">
                  {formatDate(nextSession.date)}
                  {isToday && (
                    <span className="ml-2 text-neon-green">({t('session.today')})</span>
                  )}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedDjId(nextSession.djId || '')
                  setShowEditModal(true)
                }}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                {t('common.edit')}
              </button>
              <button
                onClick={() => setShowSkipModal(true)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg text-sm text-orange-400 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                {t('session.skip')}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400 mb-3">
              {nextSession?.status === 'skipped'
                ? t('session.sessionSkipped')
                : t('session.noNextSession')
              }
            </p>
            {nextBusinessDay && (
              <p className="text-xs text-gray-500 mb-3">
                {t('session.nextBusinessDay')}: {formatDate(nextBusinessDay)}
              </p>
            )}
            <button
              onClick={handleSelectNewDJ}
              className="px-4 py-2 bg-gradient-to-r from-neon-pink/20 to-neon-blue/20 hover:from-neon-pink/30 hover:to-neon-blue/30 rounded-lg text-sm text-white transition-colors"
            >
              {t('session.selectWithWheel')}
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-neon-blue" />
                {t('session.editNextDj')}
              </h3>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  {t('session.selectDj')}
                </label>
                <select
                  value={selectedDjId}
                  onChange={(e) => setSelectedDjId(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 text-white"
                >
                  <option value="">{t('history.selectDj')}</option>
                  {djs.map(dj => (
                    <option key={dj.id} value={dj.id}>
                      {dj.avatar} {dj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleEdit}
                  disabled={!selectedDjId || isSubmitting}
                  className="flex-1 px-4 py-2 bg-neon-blue/20 hover:bg-neon-blue/30 rounded-xl text-neon-blue transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {t('common.save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Modal */}
      <AnimatePresence>
        {showSkipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSkipModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                {t('session.skipSession')}
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                {t('session.skipConfirm')}
              </p>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  {t('session.skipReason')} ({t('common.optional')})
                </label>
                <input
                  type="text"
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  placeholder={t('session.dailyCancelled')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-white placeholder-gray-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSkipModal(false)}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-xl text-orange-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {t('session.skip')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
