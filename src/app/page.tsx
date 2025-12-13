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
import { DJWithProbability, ProbabilityResponse, TodaySessionResponse, RegistrationStatus } from '@/types'
import { Trophy, Users, Calendar, Clock, Lock, Unlock, AlertCircle } from 'lucide-react'
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

  // Registration status (10h-11h protection)
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null)

  // Pending completion
  const [pendingCompletion, setPendingCompletion] = useState<PendingCompletion | null>(null)

  // DJs refusés
  const [refusedDjIds, setRefusedDjIds] = useState<string[]>([])

  // Refs
  const wheelContainerRef = useRef<HTMLDivElement>(null)
  const spinningWheelRef = useRef<SpinningWheelRef>(null)

  const fetchProbabilities = useCallback(async () => {
    try {
      const response = await fetch('/api/probability')
      const data: ProbabilityResponse = await response.json()
      setDjs(data.djs)
    } catch (error) {
      console.error('Failed to fetch probabilities:', error)
    } finally {
      setIsLoading(false)
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
    fetchTodaySession()
    fetchNextBusinessDay()
    fetchRegistrationStatus()

    // Refresh registration status every minute
    const statusInterval = setInterval(fetchRegistrationStatus, 60000)

    // Window size for confetti
    setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearInterval(statusInterval)
    }
  }, [fetchProbabilities, fetchTodaySession, fetchNextBusinessDay, fetchRegistrationStatus])

  const handleSpinComplete = (selectedDJ: DJWithProbability) => {
    setWinner(selectedDJ)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 5000)
  }

  const handleConfirmWinner = async () => {
    if (!winner) return

    // Vérifier si on peut enregistrer (mode actif 10h-11h)
    const canRegister = registrationStatus?.canRegister ?? false

    setIsConfirming(true)
    try {
      if (pendingCompletion) {
        // Compléter la session actuelle
        await fetch(`/api/sessions/${pendingCompletion.sessionId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            youtubeUrl: pendingCompletion.youtubeUrl,
            title: pendingCompletion.videoInfo?.title || '',
            artist: pendingCompletion.videoInfo?.artist || ''
          })
        })

        // Seulement si on est en mode actif (10h-11h), créer la session et enregistrer
        if (canRegister) {
          const nextDate = nextBusinessDay || new Date()
          const dateStr = nextDate.toISOString().split('T')[0]

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

          // Enregistrer le passage
          await fetch(`/api/djs/${winner.id}/play`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              notes: `Blindtest du ${nextDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}`
            }),
          })

          // Verrouiller l'enregistrement pour aujourd'hui
          await fetch('/api/registration/status', { method: 'POST' })
        }

        setPendingCompletion(null)
      } else {
        // Flow normal - seulement si mode actif
        if (canRegister) {
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

          // Verrouiller l'enregistrement
          await fetch('/api/registration/status', { method: 'POST' })
        }
      }

      // Rafraîchir les données
      await fetchProbabilities()
      await fetchTodaySession()
      await fetchNextBusinessDay()
      await fetchRegistrationStatus()
      setWinner(null)
      setIsSelectingForDate(null)
      setRefusedDjIds([])
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

  const handleReset = () => {
    setWinner(null)
    setIsSelectingForDate(null)
    setPendingCompletion(null)
    setRefusedDjIds([])
    fetchProbabilities()
  }

  const handleSessionChange = () => {
    fetchTodaySession()
    fetchNextBusinessDay()
    fetchRegistrationStatus()
    setRefreshKey(prev => prev + 1)
  }

  const handleRequestSpin = (sessionId: string, djId: string | null, youtubeUrl: string, videoInfo: { title: string; artist: string } | null) => {
    setPendingCompletion({ sessionId, djId, youtubeUrl, videoInfo })

    if (nextBusinessDay) {
      setIsSelectingForDate(nextBusinessDay)
    }

    wheelContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    setTimeout(() => {
      spinningWheelRef.current?.triggerSpin()
    }, 500)
  }

  const formatNextDate = (date: Date) => {
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  const showTodaySection = true

  // Determine registration mode display
  const isActiveMode = registrationStatus?.canRegister ?? false
  const isPassiveMode = !isActiveMode

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

      <main className="container mx-auto px-4 py-6">
        {/* Registration Status Banner */}
        {registrationStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-3 rounded-xl flex items-center justify-center gap-3 text-sm ${
              isActiveMode
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : 'bg-orange-500/20 border border-orange-500/30 text-orange-400'
            }`}
          >
            {isActiveMode ? (
              <>
                <Unlock className="w-4 h-4" />
                <span>{registrationStatus.messageKey ? t(registrationStatus.messageKey, { minutes: registrationStatus.timeLeftMinutes }) : ""}</span>
                <Clock className="w-4 h-4" />
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>{registrationStatus.messageKey ? t(registrationStatus.messageKey, { minutes: registrationStatus.timeLeftMinutes }) : ""}</span>
                {registrationStatus.nextOpenTimeKey && (
                  <span className="text-xs opacity-75">({t(registrationStatus.nextOpenTimeKey)})</span>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Header avec titre */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-1">
            {isSelectingForDate || pendingCompletion ? (
              <>
                <span className="text-glow text-neon-pink">{t('session.selectDjFor')}</span>
                {' '}
                <span className="text-glow text-neon-blue">
                  {isSelectingForDate ? formatNextDate(isSelectingForDate) : ''}
                </span>
              </>
            ) : (
              <>
                <span className="text-glow text-neon-pink">{t('home.whoWillBeDj')}</span>
                {' '}
                <span className="text-glow text-neon-blue">{t('home.ofTheDay')}</span>
              </>
            )}
          </h2>
          <p className="text-gray-400 text-sm">
            {isSelectingForDate || pendingCompletion
              ? t('session.spinForNextDay')
              : isPassiveMode
                ? t('home.passiveModeDescription')
                : t('home.spinDescription')
            }
          </p>
        </motion.div>

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Colonne gauche - Roue */}
          <div ref={wheelContainerRef} className="lg:col-span-5 xl:col-span-4 flex flex-col items-center">
            {isLoading ? (
              <div className="flex items-center justify-center h-72">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="text-6xl"
                >
                  🎵
                </motion.div>
              </div>
            ) : (
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
            )}

            {/* Confirmation du gagnant */}
            <AnimatePresence>
              {winner && !isSpinning && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-4 w-full max-w-sm"
                >
                  {/* Mode indicator */}
                  {isPassiveMode && (
                    <div className="mb-3 p-2 bg-orange-500/10 rounded-lg text-center">
                      <p className="text-xs text-orange-400 flex items-center justify-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        {t('home.passiveModeIndicator')}
                      </p>
                    </div>
                  )}
                  {(isSelectingForDate || pendingCompletion) && (
                    <div className="mb-3 p-2 bg-neon-blue/10 rounded-lg text-center">
                      <p className="text-sm text-neon-blue flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {isSelectingForDate ? formatNextDate(isSelectingForDate) : ''}
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

          {/* Colonne centrale - DJ du jour + dernière musique */}
          <div className="lg:col-span-7 xl:col-span-4 space-y-6">
            {showTodaySection ? (
              <TodayDJ
                key={`today-${refreshKey}`}
                onSessionUpdated={handleSessionChange}
                onRequestSpin={handleRequestSpin}
              />
            ) : (
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
                  {!todaySession?.isBusinessDay ? (
                    <>
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">{t('session.weekend')}</p>
                    </>
                  ) : (
                    <>
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">{t('session.noSessionToday')}</p>
                      <p className="text-xs mt-2 text-gray-500">
                        {t('session.useWheelToSelect')}
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            <LatestMusic key={`music-${refreshKey}`} />
          </div>

          {/* Colonne droite - Probabilités */}
          <div className="lg:col-span-12 xl:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-neon-yellow" />
                  {t('home.probabilities')}
                  {djs.length > 0 && (
                    <span className="text-sm font-normal text-gray-400">
                      ({djs.length} DJs)
                    </span>
                  )}
                </h3>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-white/5 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : djs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">{t('home.noDjsYet')}</p>
                  <p className="text-xs mt-1">
                    {t('home.addParticipantsInAdmin')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-[400px] xl:max-h-[500px] overflow-y-auto pr-1">
                    {djs.map((dj, index) => (
                      <DJCard
                        key={dj.id}
                        dj={dj}
                        rank={index}
                        isWinner={winner?.id === dj.id}
                        compact
                      />
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-center">
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
    </div>
  )
}
