'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DailySession, TodaySessionResponse, NextSessionResponse, DJWithProbability } from '@/types'
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
  CalendarClock,
  ChevronDown,
  Lock,
  RefreshCw
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { getCurrentHour } from '@/lib/dates'

interface TodayDJProps {
  onSessionUpdated?: () => void
  onRequestSpin?: (sessionId: string, djId: string | null, youtubeUrl: string, videoInfo: { title: string; artist: string } | null) => void
  onOpenWheel?: () => void
  djs?: DJWithProbability[]
}

export default function TodayDJ({ onSessionUpdated, onRequestSpin, onOpenWheel, djs = [] }: TodayDJProps) {
  const t = useTranslations()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const [session, setSession] = useState<DailySession | null>(null)
  const [isBusinessDay, setIsBusinessDay] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isFetchingInfo, setIsFetchingInfo] = useState(false)
  const [videoInfo, setVideoInfo] = useState<{ title: string; artist: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showingNextSession, setShowingNextSession] = useState(false)
  const [isPostponing, setIsPostponing] = useState(false)
  const [youtubeSubmitted, setYoutubeSubmitted] = useState(false)
  const [isSubmittingYoutube, setIsSubmittingYoutube] = useState(false)

  // Next DJ selection
  const [selectedNextDjId, setSelectedNextDjId] = useState('')
  const [showNextDjConfirm, setShowNextDjConfirm] = useState(false)
  const [isSelectingNextDj, setIsSelectingNextDj] = useState(false)

  // Change today's DJ
  const [showChangeDj, setShowChangeDj] = useState(false)
  const [selectedChangeDjId, setSelectedChangeDjId] = useState('')
  const [isChangingDj, setIsChangingDj] = useState(false)

  const getMockDateParam = () => searchParams.get('mockDate') || ''

  const fetchTodaySession = async () => {
    try {
      const mockDate = getMockDateParam()
      const params = mockDate ? `?mockDate=${mockDate}` : ''

      const response = await fetch(`/api/sessions/today${params}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      const data: TodaySessionResponse = await response.json()

      if (!data.isBusinessDay) {
        try {
          const nextResponse = await fetch(`/api/sessions/next${params}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          })
          const nextData: NextSessionResponse = await nextResponse.json()
          if (nextData.session) {
            setSession(nextData.session)
            setShowingNextSession(true)
            setIsBusinessDay(false)
            setIsLoading(false)
            return
          }
        } catch (nextError) {
          console.error('Failed to fetch next session:', nextError)
        }
        setIsBusinessDay(false)
        setSession(null)
        setIsLoading(false)
        return
      }

      if (!data.session || data.session.status === 'skipped' || data.session.status === 'completed') {
        try {
          const nextResponse = await fetch(`/api/sessions/next${params}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          })
          const nextData: NextSessionResponse = await nextResponse.json()
          if (nextData.session && !nextData.isToday) {
            setSession(nextData.session)
            setShowingNextSession(true)
            setIsBusinessDay(data.isBusinessDay)
            setIsLoading(false)
            return
          }
        } catch (nextError) {
          console.error('Failed to fetch next session:', nextError)
        }
      }

      setSession(data.session)
      setIsBusinessDay(data.isBusinessDay)
      setShowingNextSession(false)
    } catch (error) {
      console.error('Failed to fetch today session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTodaySession()
  }, [searchParams])

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

  const handleSubmitYoutube = async () => {
    if (!session || !youtubeUrl.trim()) return

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
    if (!youtubeRegex.test(youtubeUrl)) {
      setError(t('validation.invalidYoutubeUrl'))
      return
    }

    setError(null)
    setIsSubmittingYoutube(true)

    try {
      const response = await fetch(`/api/sessions/${session.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeUrl: youtubeUrl.trim(),
          title: videoInfo?.title || '',
          artist: videoInfo?.artist || ''
        })
      })

      if (response.ok) {
        setYoutubeSubmitted(true)
        setYoutubeUrl('')
        setVideoInfo(null)
        onSessionUpdated?.()
      }
    } catch (error) {
      console.error('Failed to submit YouTube link:', error)
    } finally {
      setIsSubmittingYoutube(false)
    }
  }

  const handleSelectNextDj = async () => {
    if (!selectedNextDjId) return

    const selectedDj = djs.find(d => d.id === selectedNextDjId)
    if (!selectedDj) return

    setIsSelectingNextDj(true)

    try {
      const mockDate = getMockDateParam()
      const params = mockDate ? `?mockDate=${mockDate}` : ''

      // Get next business day
      const nextResponse = await fetch(`/api/sessions/next${params}`, {
        cache: 'no-store'
      })
      const nextData = await nextResponse.json()
      const nextDate = nextData.nextBusinessDay

      // Create session for next business day
      const sessionResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          djId: selectedDj.id,
          djName: selectedDj.name,
          date: nextDate
        }),
      })

      if (!sessionResponse.ok) {
        const error = await sessionResponse.json()
        if (error.session) {
          // Update existing session
          await fetch(`/api/sessions/${error.session.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              djId: selectedDj.id,
              djName: selectedDj.name
            }),
          })
        }
      }

      // Record play
      await fetch(`/api/djs/${selectedDj.id}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: `Blindtest du ${new Date(nextDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}`
        }),
      })

      setSelectedNextDjId('')
      setShowNextDjConfirm(false)
      onSessionUpdated?.()
    } catch (error) {
      console.error('Failed to select next DJ:', error)
    } finally {
      setIsSelectingNextDj(false)
    }
  }

  const handleChangeTodayDj = async () => {
    if (!selectedChangeDjId || !session) return

    const selectedDj = djs.find(d => d.id === selectedChangeDjId)
    if (!selectedDj) return

    setIsChangingDj(true)

    try {
      await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          djId: selectedDj.id,
          djName: selectedDj.name
        }),
      })

      setSelectedChangeDjId('')
      setShowChangeDj(false)
      await fetchTodaySession()
      onSessionUpdated?.()
    } catch (error) {
      console.error('Failed to change today DJ:', error)
    } finally {
      setIsChangingDj(false)
    }
  }

  const handlePostpone = async () => {
    if (!session || isPostponing) return

    setIsPostponing(true)
    try {
      const mockDate = getMockDateParam()
      const response = await fetch(`/api/sessions/${session.id}/postpone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockDate: mockDate || undefined })
      })

      if (response.ok) {
        await fetchTodaySession()
        onSessionUpdated?.()
      }
    } catch (error) {
      console.error('Failed to postpone session:', error)
    } finally {
      setIsPostponing(false)
    }
  }

  // Available DJs for next DJ selection (not on leave, not current DJ)
  const availableDjs = djs.filter(d => !d.isOnLeave && d.id !== session?.djId)

  // Can select next DJ? Only if YouTube was submitted or session is not pending
  const canSelectNextDj = youtubeSubmitted || !session || session.status !== 'pending'

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

  // Weekend without session
  if (!isBusinessDay && !session) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-neon-blue" />
          {t('session.nextDj')}
        </h3>
        <div className="text-center py-6 text-gray-400">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('session.weekend')}</p>
        </div>

        {renderNextDjSelector()}
      </motion.div>
    )
  }

  // No session
  if (!session) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-neon-pink" />
          {t('session.todayDj')}
        </h3>
        <div className="text-center py-6 text-gray-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('session.noSessionToday')}</p>
        </div>

        {renderNextDjSelector()}
      </motion.div>
    )
  }

  // Skipped session
  if (session.status === 'skipped') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <XCircle className="w-5 h-5 text-orange-500" />
          {t('session.todayDj')}
        </h3>
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 rounded-full text-orange-400 text-sm mb-3">
            <XCircle className="w-4 h-4" />
            {t('session.cancelled')}
          </div>
          <p className="text-gray-400 text-sm">
            {session.skipReason || t('session.dailyCancelled')}
          </p>
        </div>

        {renderNextDjSelector()}
      </motion.div>
    )
  }

  // Completed session
  if (session.status === 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Check className="w-5 h-5 text-green-500" />
          {t('session.todayDj')}
        </h3>

        <div className="flex items-center gap-3 mb-4 p-3 bg-green-500/5 rounded-xl">
          <div className="text-3xl">🎧</div>
          <div>
            <h4 className="font-bold text-lg text-white">{session.djName}</h4>
            <p className="text-green-400 text-sm flex items-center gap-1">
              <Check className="w-3 h-3" />
              {t('session.completed')}
            </p>
          </div>
        </div>

        {session.youtubeUrl && (
          <a
            href={session.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm"
          >
            <Youtube className="w-4 h-4" />
            <span className="flex-1 truncate">
              {session.title ? `${session.artist} - ${session.title}` : t('session.viewBlindtest')}
            </span>
          </a>
        )}

        {renderNextDjSelector()}
      </motion.div>
    )
  }

  // Pending session - main view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6"
    >
      <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
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
      <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl ${
        showingNextSession ? 'bg-neon-blue/5' : 'bg-neon-pink/5'
      }`}>
        <div className="text-3xl">🎧</div>
        <div className="flex-grow">
          <h4 className="font-bold text-xl text-white">{session.djName}</h4>
          <p className="text-gray-400 text-sm flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(session.date)}
          </p>
        </div>
        {!showingNextSession && (
          <button
            onClick={() => { setShowChangeDj(!showChangeDj); setSelectedChangeDjId('') }}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title={t('session.editNextDj')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Change today's DJ */}
      <AnimatePresence>
        {showChangeDj && !showingNextSession && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedChangeDjId}
                    onChange={(e) => setSelectedChangeDjId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-neon-pink/50"
                  >
                    <option value="" className="bg-gray-800">{t('session.chooseDj')}</option>
                    {djs.filter(d => !d.isOnLeave && d.id !== session?.djId).map((dj) => (
                      <option key={dj.id} value={dj.id} className="bg-gray-800">
                        {dj.avatar} {dj.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <button
                  onClick={handleChangeTodayDj}
                  disabled={!selectedChangeDjId || isChangingDj}
                  className="px-3 py-2 bg-neon-pink/80 hover:bg-neon-pink text-white font-bold rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isChangingDj ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.confirm')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming session - just info, no form */}
      {showingNextSession && (
        <p className="text-center text-gray-300 text-sm">
          {t('session.upcomingSession')}
        </p>
      )}

      {/* YouTube form + Next DJ selection - only for today's session */}
      {!showingNextSession && (
        <div className="space-y-4">
          {/* Postpone button - more discrete */}
          <button
            onClick={handlePostpone}
            disabled={isPostponing}
            className="w-full py-1.5 px-3 text-gray-500 hover:text-gray-300 text-xs transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
          >
            {isPostponing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                {t('session.postponing')}
              </>
            ) : (
              <>
                <CalendarClock className="w-3 h-3" />
                {t('session.postponeToNextDay')}
              </>
            )}
          </button>

          {/* YouTube Link Section */}
          {!youtubeSubmitted && session.status === 'pending' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                {t('session.addYoutubeLink')}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-3 py-2 pl-9 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-neon-pink/50 text-white placeholder-gray-500 text-sm"
                  />
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  {isFetchingInfo && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-pink animate-spin" />
                  )}
                </div>
                <button
                  onClick={handleSubmitYoutube}
                  disabled={!youtubeUrl.trim() || isFetchingInfo || isSubmittingYoutube}
                  className="px-4 py-2 bg-neon-pink/80 hover:bg-neon-pink text-white font-bold rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmittingYoutube ? <Loader2 className="w-4 h-4 animate-spin" /> : t('session.addLink')}
                </button>
              </div>

              {/* Video Preview */}
              <AnimatePresence>
                {videoInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mt-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-xs"
                  >
                    <span className="text-white">{videoInfo.title}</span>
                    <span className="text-gray-400"> - {videoInfo.artist}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="mt-1.5 px-3 py-1.5 bg-red-500/10 rounded-lg text-red-400 text-xs">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* YouTube submitted confirmation */}
          {youtubeSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-lg text-green-400 text-sm"
            >
              <Check className="w-4 h-4" />
              {t('session.youtubeAdded')}
            </motion.div>
          )}

          {/* Separator */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Next DJ Selection - locked until YouTube is submitted */}
          {canSelectNextDj ? (
            renderNextDjSelector()
          ) : (
            <div className="mt-3 opacity-50">
              <p className="text-sm text-gray-500 mb-2 font-medium flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                {t('session.selectNextDj')}
              </p>
              <div className="flex items-center gap-2 pointer-events-none">
                <div className="relative flex-1">
                  <select
                    disabled
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-600 text-sm appearance-none cursor-not-allowed"
                  >
                    <option>{t('session.chooseDj')}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                </div>
                <button
                  disabled
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-lg opacity-50 cursor-not-allowed"
                >
                  🎰
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )

  function renderNextDjSelector() {
    return (
      <div className="mt-3">
        <p className="text-sm text-gray-400 mb-2 font-medium">{t('session.selectNextDj')}</p>

        <div className="flex items-center gap-2">
          {/* Dropdown */}
          <div className="relative flex-1">
            <select
              value={selectedNextDjId}
              onChange={(e) => {
                setSelectedNextDjId(e.target.value)
                if (e.target.value) setShowNextDjConfirm(true)
              }}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-neon-blue/50"
            >
              <option value="" className="bg-gray-800">{t('session.chooseDj')}</option>
              {availableDjs.map((dj) => (
                <option key={dj.id} value={dj.id} className="bg-gray-800">
                  {dj.avatar} {dj.name} ({dj.probability.toFixed(1)}%)
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Spin wheel button */}
          <button
            onClick={() => onOpenWheel?.()}
            className="px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg transition-colors text-lg"
            title={t('session.orSpinWheel')}
          >
            🎰
          </button>
        </div>

        {/* Confirmation modal for dropdown selection */}
        <AnimatePresence>
          {showNextDjConfirm && selectedNextDjId && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10"
            >
              <p className="text-sm text-gray-300 mb-2">
                {t('session.confirmNextDj', { name: availableDjs.find(d => d.id === selectedNextDjId)?.name || '' })}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowNextDjConfirm(false); setSelectedNextDjId('') }}
                  className="px-3 py-1 text-xs text-gray-400 hover:text-white"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSelectNextDj}
                  disabled={isSelectingNextDj}
                  className="px-3 py-1 text-xs bg-neon-blue/80 hover:bg-neon-blue text-white rounded font-bold disabled:opacity-50"
                >
                  {isSelectingNextDj ? <Loader2 className="w-3 h-3 animate-spin" /> : t('common.confirm')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
}
