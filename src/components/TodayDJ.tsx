'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DailySession, TodaySessionResponse, NextSessionResponse } from '@/types'
import {
  Music,
  User,
  Calendar,
  Youtube,
  Loader2,
  Check,
  Link as LinkIcon,
  XCircle,
  AlertCircle,
  ArrowRight,
  Disc3
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

interface TodayDJProps {
  onSessionUpdated?: () => void
  onRequestSpin?: (sessionId: string, youtubeUrl: string, videoInfo: { title: string; artist: string } | null) => void
}

export default function TodayDJ({ onSessionUpdated, onRequestSpin }: TodayDJProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [session, setSession] = useState<DailySession | null>(null)
  const [isBusinessDay, setIsBusinessDay] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isFetchingInfo, setIsFetchingInfo] = useState(false)
  const [videoInfo, setVideoInfo] = useState<{ title: string; artist: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showingNextSession, setShowingNextSession] = useState(false)

  const isAfterNoon = () => new Date().getHours() >= 12

  const fetchTodaySession = async () => {
    try {
      const response = await fetch('/api/sessions/today')
      const data: TodaySessionResponse = await response.json()

      // Si après midi et session terminée/annulée, afficher la prochaine session
      if (isAfterNoon() && data.session && (data.session.status === 'skipped' || data.session.status === 'completed')) {
        const nextResponse = await fetch('/api/sessions/next')
        const nextData: NextSessionResponse = await nextResponse.json()
        if (nextData.session && !nextData.isToday) {
          setSession(nextData.session)
          setShowingNextSession(true)
          setIsBusinessDay(true)
          return
        }
      }

      setSession(data.session)
      setIsBusinessDay(data.isBusinessDay)
      setShowingNextSession(false)
    } catch (error) {
      console.error('Failed to fetch today\'s session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTodaySession()
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Fetch YouTube info when URL changes
  useEffect(() => {
    const fetchYoutubeInfo = async () => {
      if (!youtubeUrl.trim()) {
        setVideoInfo(null)
        return
      }

      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
      if (!youtubeRegex.test(youtubeUrl)) {
        return
      }

      setIsFetchingInfo(true)
      try {
        const response = await fetch('/api/youtube', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: youtubeUrl })
        })
        if (response.ok) {
          const data = await response.json()
          setVideoInfo({ title: data.title, artist: data.artist })
        }
      } catch (error) {
        console.error('Failed to fetch YouTube info:', error)
      } finally {
        setIsFetchingInfo(false)
      }
    }

    const debounce = setTimeout(fetchYoutubeInfo, 500)
    return () => clearTimeout(debounce)
  }, [youtubeUrl])

  const handleSpinRequest = () => {
    if (!session || !youtubeUrl.trim()) return

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
    if (!youtubeRegex.test(youtubeUrl)) {
      setError(t('validation.invalidYoutubeUrl'))
      return
    }

    setError(null)
    onRequestSpin?.(session.id, youtubeUrl.trim(), videoInfo)
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-48 mb-4" />
          <div className="h-24 bg-white/10 rounded-xl mb-4" />
          <div className="h-12 bg-white/10 rounded-xl" />
        </div>
      </motion.div>
    )
  }

  // Si ce n'est pas un jour ouvrable
  if (!isBusinessDay) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-neon-blue" />
          {t('session.todayDj')}
        </h3>
        <div className="text-center py-8 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">{t('session.weekend')}</p>
        </div>
      </motion.div>
    )
  }

  // Si pas de session pour aujourd'hui
  if (!session) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-neon-pink" />
          {t('session.todayDj')}
        </h3>
        <div className="text-center py-8 text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">{t('session.noSessionToday')}</p>
          <p className="text-xs mt-2">{t('session.selectNextDj')}</p>
        </div>
      </motion.div>
    )
  }

  // Session annulée
  if (session.status === 'skipped') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border border-orange-500/30"
      >
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
          <XCircle className="w-5 h-5 text-orange-500" />
          {t('session.todayDj')}
        </h3>
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-full text-orange-400 mb-4">
            <XCircle className="w-4 h-4" />
            {t('session.cancelled')}
          </div>
          <p className="text-gray-400 text-sm">
            {session.skipReason || t('session.dailyCancelled')}
          </p>
          <p className="text-gray-500 text-xs mt-2">
            {formatDate(session.date)}
          </p>
        </div>
      </motion.div>
    )
  }

  // Session complétée
  if (session.status === 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border border-green-500/30"
      >
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Check className="w-5 h-5 text-green-500" />
          {t('session.todayDj')}
        </h3>

        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl">🎧</div>
          <div>
            <h4 className="font-bold text-xl text-white">{session.djName}</h4>
            <p className="text-green-400 text-sm flex items-center gap-1">
              <Check className="w-4 h-4" />
              {t('session.completed')}
            </p>
          </div>
        </div>

        {session.youtubeUrl && (
          <a
            href={session.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-colors"
          >
            <Youtube className="w-5 h-5" />
            <span className="flex-1 truncate">
              {session.title ? `${session.artist} - ${session.title}` : t('session.viewBlindtest')}
            </span>
          </a>
        )}
      </motion.div>
    )
  }

  // Session en cours (pending) - Afficher le formulaire ou la prochaine session
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6"
    >
      <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
        {showingNextSession ? (
          <>
            <ArrowRight className="w-5 h-5 text-neon-blue" />
            {t('session.nextDj')}
          </>
        ) : (
          <>
            <Music className="w-5 h-5 text-neon-pink" />
            {t('session.todayDj')}
          </>
        )}
      </h3>

      {/* DJ Info */}
      <div className={`flex items-center gap-4 ${showingNextSession ? 'mb-4' : 'mb-6'} p-4 bg-gradient-to-r ${showingNextSession ? 'from-neon-blue/10 to-neon-green/10' : 'from-neon-pink/10 to-neon-blue/10'} rounded-xl`}>
        <div className="text-5xl">🎧</div>
        <div>
          <h4 className="font-bold text-2xl text-white">{session.djName}</h4>
          <p className="text-gray-400 text-sm flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(session.date)}
          </p>
        </div>
      </div>

      {/* Si on montre la prochaine session, pas de formulaire YouTube */}
      {showingNextSession && (
        <p className="text-center text-gray-500 text-sm">
          {t('session.upcomingSession')}
        </p>
      )}

      {/* YouTube Form - seulement pour la session du jour */}
      {!showingNextSession && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t('session.addYoutubeLink')}
            </label>
            <div className="relative">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-3 pl-10 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-pink/50 text-white placeholder-gray-500"
              />
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              {isFetchingInfo && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neon-pink animate-spin" />
              )}
            </div>
          </div>

          {/* Video Info Preview */}
          <AnimatePresence>
            {videoInfo && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-white/5 rounded-lg text-sm"
              >
                <p className="text-white font-medium truncate">{videoInfo.title}</p>
                <p className="text-gray-400 truncate">{videoInfo.artist}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Bouton pour lancer la roue */}
          <button
            onClick={handleSpinRequest}
            disabled={!youtubeUrl.trim() || isFetchingInfo}
            className="w-full py-3 px-4 bg-gradient-to-r from-neon-pink to-neon-blue text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Disc3 className="w-5 h-5" />
            {t('session.validateAndSpin')}
          </button>

          <p className="text-center text-gray-500 text-xs">
            {t('session.spinExplanation')}
          </p>
        </div>
      )}
    </motion.div>
  )
}
