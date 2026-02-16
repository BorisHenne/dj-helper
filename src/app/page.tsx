'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/Header'
import SpinningWheel, { SpinningWheelRef } from '@/components/SpinningWheel'
import DJCard from '@/components/DJCard'
import ConfirmButton from '@/components/ConfirmButton'
import TodayDJ from '@/components/TodayDJ'
import LatestMusic from '@/components/LatestMusic'
import { DJ, DJWithProbability, ProbabilityResponse, TodaySessionResponse, RegistrationStatus } from '@/types'
import { AVATAR_EMOJIS } from '@/lib/probability'
import {
  Users, Calendar, AlertCircle,
  Settings, Plus, Palmtree, ChevronDown, X
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'

const ReactConfetti = dynamic(() => import('react-confetti'), { ssr: false })

interface PendingCompletion {
  sessionId: string
  djId: string | null
  youtubeUrl: string
  videoInfo: { title: string; artist: string } | null
}

export default function HomePage() {
  const t = useTranslations()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const mockDateParam = searchParams.get('mockDate') || ''
  const [djs, setDjs] = useState<DJWithProbability[]>([])
  const [onLeaveDjs, setOnLeaveDjs] = useState<DJWithProbability[]>([])
  const [allDjs, setAllDjs] = useState<DJ[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<DJWithProbability | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  // Session state
  const [todaySession, setTodaySession] = useState<TodaySessionResponse | null>(null)
  const [nextBusinessDay, setNextBusinessDay] = useState<Date | null>(null)
  const [isSelectingForDate, setIsSelectingForDate] = useState<Date | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Registration status
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null)

  // Pending completion
  const [pendingCompletion, setPendingCompletion] = useState<PendingCompletion | null>(null)

  // DJs refuses
  const [refusedDjIds, setRefusedDjIds] = useState<string[]>([])

  // Wheel modal
  const [showWheelModal, setShowWheelModal] = useState(false)

  // Sidebar management
  const [showAddForm, setShowAddForm] = useState(false)
  const [showOnLeave, setShowOnLeave] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [newDj, setNewDj] = useState({ name: '', avatar: '🎧', color: '#ff6ec7' })

  // Refs
  const spinningWheelRef = useRef<SpinningWheelRef>(null)

  const fetchProbabilities = useCallback(async () => {
    try {
      const response = await fetch('/api/probability')
      const data: ProbabilityResponse = await response.json()
      setDjs(data.djs)
      setOnLeaveDjs(data.onLeaveDjs || [])
    } catch (error) {
      console.error('Failed to fetch probabilities:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchAllDjs = useCallback(async () => {
    try {
      const response = await fetch('/api/djs')
      const data = await response.json()
      setAllDjs(data)
    } catch (error) {
      console.error('Failed to fetch all DJs:', error)
    }
  }, [])

  const fetchTodaySession = useCallback(async () => {
    try {
      const params = mockDateParam ? `?mockDate=${mockDateParam}` : ''
      const response = await fetch(`/api/sessions/today${params}`)
      const data: TodaySessionResponse = await response.json()
      setTodaySession(data)
    } catch (error) {
      console.error('Failed to fetch today session:', error)
    }
  }, [mockDateParam])

  const fetchNextBusinessDay = useCallback(async () => {
    try {
      const params = mockDateParam ? `?mockDate=${mockDateParam}` : ''
      const response = await fetch(`/api/sessions/next${params}`)
      const data = await response.json()
      setNextBusinessDay(new Date(data.nextBusinessDay))
    } catch (error) {
      console.error('Failed to fetch next business day:', error)
    }
  }, [mockDateParam])

  const fetchRegistrationStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/registration/status', { cache: 'no-store' })
      const data: RegistrationStatus = await response.json()
      setRegistrationStatus(data)
    } catch (error) {
      console.error('Failed to fetch registration status:', error)
    }
  }, [])

  useEffect(() => {
    fetchProbabilities()
    fetchAllDjs()
    fetchTodaySession()
    fetchNextBusinessDay()
    fetchRegistrationStatus()

    const statusInterval = setInterval(fetchRegistrationStatus, 60000)

    setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearInterval(statusInterval)
    }
  }, [fetchProbabilities, fetchAllDjs, fetchTodaySession, fetchNextBusinessDay, fetchRegistrationStatus])

  const handleSpinComplete = (selectedDJ: DJWithProbability) => {
    setWinner(selectedDJ)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 5000)
  }

  const handleConfirmWinner = async () => {
    if (!winner) return

    setIsConfirming(true)
    try {
      const sessionDate = isSelectingForDate || nextBusinessDay || new Date()
      const dateStr = sessionDate.toISOString().split('T')[0]

      const sessionResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          djId: winner.id,
          djName: winner.name,
          date: dateStr
        }),
      })

      if (!sessionResponse.ok) {
        const error = await sessionResponse.json()
        if (error.session) {
          await fetch(`/api/sessions/${error.session.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              djId: winner.id,
              djName: winner.name
            }),
          })
        }
      }

      await fetch(`/api/djs/${winner.id}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: `Blindtest du ${sessionDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}`
        }),
      })

      await fetchProbabilities()
      await fetchAllDjs()
      await fetchTodaySession()
      await fetchNextBusinessDay()
      await fetchRegistrationStatus()
      setWinner(null)
      setIsSelectingForDate(null)
      setRefusedDjIds([])
      setShowWheelModal(false)
      spinningWheelRef.current?.resetWinner()
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Failed to confirm winner:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleRefuseWinner = () => {
    if (!winner) return
    setRefusedDjIds(prev => [...prev, winner.id])
    setWinner(null)
    setTimeout(() => {
      spinningWheelRef.current?.triggerSpin()
    }, 300)
  }

  const handleSessionChange = () => {
    fetchTodaySession()
    fetchNextBusinessDay()
    fetchRegistrationStatus()
    fetchProbabilities()
    fetchAllDjs()
    setRefreshKey(prev => prev + 1)
  }

  const handleRequestSpin = (sessionId: string, djId: string | null, youtubeUrl: string, videoInfo: { title: string; artist: string } | null) => {
    setPendingCompletion({ sessionId, djId, youtubeUrl, videoInfo })

    if (nextBusinessDay) {
      setIsSelectingForDate(nextBusinessDay)
    }

    setShowWheelModal(true)

    setTimeout(() => {
      spinningWheelRef.current?.triggerSpin()
    }, 500)
  }

  const handleOpenWheel = () => {
    if (nextBusinessDay) {
      setIsSelectingForDate(nextBusinessDay)
    }
    setShowWheelModal(true)
  }

  const handleToggleLeave = async (djId: string, currentOnLeave: boolean) => {
    try {
      await fetch(`/api/djs/${djId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnLeave: !currentOnLeave }),
      })
      await fetchProbabilities()
      await fetchAllDjs()
    } catch (error) {
      console.error('Failed to toggle leave:', error)
    }
  }

  const handleEditDj = async (djId: string, data: { name: string; avatar: string; color: string }) => {
    try {
      await fetch(`/api/djs/${djId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      await fetchProbabilities()
      await fetchAllDjs()
    } catch (error) {
      console.error('Failed to edit DJ:', error)
    }
  }

  const handleDeleteDj = async (djId: string) => {
    try {
      await fetch(`/api/djs/${djId}`, { method: 'DELETE' })
      await fetchProbabilities()
      await fetchAllDjs()
    } catch (error) {
      console.error('Failed to delete DJ:', error)
    }
  }

  const handleAddDj = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDj.name.trim()) return

    try {
      const response = await fetch('/api/djs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDj),
      })

      if (response.ok) {
        setNewDj({ name: '', avatar: '🎧', color: '#ff6ec7' })
        setShowAddForm(false)
        await fetchProbabilities()
        await fetchAllDjs()
      }
    } catch (error) {
      console.error('Failed to add DJ:', error)
    }
  }

  const formatNextDate = (date: Date) => {
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  const isPassiveMode = !(registrationStatus?.canRegister ?? false)
  const totalParticipants = djs.length + onLeaveDjs.length

  // Find next DJ from today session
  const nextDjId = todaySession?.session?.djId || null

  return (
    <div className="min-h-screen">
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          colors={['#ff6ec7', '#00f5ff', '#39ff14', '#fff700', '#a855f7']}
        />
      )}

      <Header />

      <main className="container mx-auto px-4 py-4">
        {/* Layout 2 colonnes */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">

          {/* Colonne principale */}
          <div className="xl:col-span-8 space-y-4">
            <TodayDJ
              key={`today-${refreshKey}`}
              onSessionUpdated={handleSessionChange}
              onRequestSpin={handleRequestSpin}
              onOpenWheel={handleOpenWheel}
              djs={djs}
            />

            <LatestMusic key={`music-${refreshKey}`} />
          </div>

          {/* Sidebar droite - Participants */}
          <div className="xl:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-2xl p-4"
            >
              {/* Header sidebar */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-neon-blue" />
                  {t('sidebar.participants')}
                  {totalParticipants > 0 && (
                    <span className="text-sm font-normal text-gray-400">
                      {djs.length}/{totalParticipants}
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-1">
                  <motion.button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/20 transition-colors"
                    whileTap={{ scale: 0.95 }}
                    title={t('user.addDj')}
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
                    whileTap={{ scale: 0.95 }}
                    title={t('user.settings')}
                  >
                    <Settings className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Add DJ form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddDj}
                    className="mb-3 p-3 bg-white/5 rounded-xl overflow-hidden"
                  >
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newDj.name}
                        onChange={(e) => setNewDj({ ...newDj, name: e.target.value })}
                        placeholder={t('common.name')}
                        className="w-full text-sm px-3 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-neon-blue/50 outline-none"
                        required
                      />
                      <div className="flex gap-2 items-center">
                        <div className="flex flex-wrap gap-0.5 flex-1">
                          {AVATAR_EMOJIS.slice(0, 10).map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setNewDj({ ...newDj, avatar: emoji })}
                              className={`text-sm p-0.5 rounded ${
                                newDj.avatar === emoji ? 'bg-neon-pink/30' : 'hover:bg-white/10'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        <input
                          type="color"
                          value={newDj.color}
                          onChange={(e) => setNewDj({ ...newDj, color: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs bg-green-500 rounded-lg font-bold"
                      >
                        {t('common.add')}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* DJ list */}
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-12 bg-white/5 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : djs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">{t('home.noDjsYet')}</p>
                  <p className="text-xs mt-1">
                    {t('sidebar.addParticipantHint')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5 max-h-[400px] xl:max-h-[450px] overflow-y-auto pr-1">
                    {djs.map((dj, index) => (
                      <DJCard
                        key={dj.id}
                        dj={dj}
                        rank={index}
                        isWinner={winner?.id === dj.id}
                        isNextDj={dj.id === nextDjId}
                        compact
                        onToggleLeave={handleToggleLeave}
                        onEdit={handleEditDj}
                        onDelete={handleDeleteDj}
                      />
                    ))}
                  </div>

                  {/* On leave section */}
                  {onLeaveDjs.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <button
                        onClick={() => setShowOnLeave(!showOnLeave)}
                        className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors w-full"
                      >
                        <Palmtree className="w-4 h-4" />
                        <span>{t('sidebar.onLeave')} ({onLeaveDjs.length})</span>
                        <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showOnLeave ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {showOnLeave && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 space-y-1.5 overflow-hidden"
                          >
                            {onLeaveDjs.map((dj, index) => (
                              <DJCard
                                key={dj.id}
                                dj={dj}
                                rank={djs.length + index}
                                compact
                                onToggleLeave={handleToggleLeave}
                                onEdit={handleEditDj}
                                onDelete={handleDeleteDj}
                              />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-neon-pink">
                        {djs.length}
                      </div>
                      <div className="text-xs text-gray-400">{t('home.activeDjs')}</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-neon-blue">
                        {djs.reduce((sum, dj) => sum + dj.totalPlays, 0)}
                      </div>
                      <div className="text-xs text-gray-400">{t('home.totalBlindtests')}</div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Wheel Modal */}
      <AnimatePresence>
        {showWheelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSpinning) {
                setShowWheelModal(false)
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
            >
              {!isSpinning && (
                <button
                  onClick={() => setShowWheelModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <div className="flex flex-col items-center">
                {isSelectingForDate && (
                  <div className="mb-4 p-2 bg-neon-blue/10 rounded-lg text-center">
                    <p className="text-sm text-neon-blue flex items-center justify-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatNextDate(isSelectingForDate)}
                    </p>
                  </div>
                )}

                <SpinningWheel
                  ref={spinningWheelRef}
                  djs={djs}
                  onSpinComplete={handleSpinComplete}
                  isSpinning={isSpinning}
                  setIsSpinning={setIsSpinning}
                  excludeDjIds={[
                    ...(pendingCompletion?.djId ? [pendingCompletion.djId] : []),
                    ...refusedDjIds
                  ]}
                />

                {/* Winner confirmation */}
                <AnimatePresence>
                  {winner && !isSpinning && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mt-4 w-full max-w-sm"
                    >
                      {isPassiveMode && (
                        <div className="mb-3 p-2 bg-orange-500/10 rounded-lg text-center">
                          <p className="text-xs text-orange-400 flex items-center justify-center gap-2">
                            <AlertCircle className="w-3 h-3" />
                            {t('home.passiveModeIndicator')}
                          </p>
                        </div>
                      )}
                      <ConfirmButton
                        winner={winner}
                        onConfirm={handleConfirmWinner}
                        onRefuse={handleRefuseWinner}
                        isLoading={isConfirming}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
