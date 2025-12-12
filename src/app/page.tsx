'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/Header'
import SpinningWheel from '@/components/SpinningWheel'
import DJCard from '@/components/DJCard'
import ConfirmButton from '@/components/ConfirmButton'
import LatestMusic from '@/components/LatestMusic'
import { DJWithProbability, ProbabilityResponse } from '@/types'
import { RefreshCw, Trophy, Users } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

// Import dynamique de react-confetti pour éviter les erreurs SSR
const ReactConfetti = dynamic(() => import('react-confetti'), { ssr: false })

export default function HomePage() {
  const t = useTranslations()
  const locale = useLocale()
  const [djs, setDjs] = useState<DJWithProbability[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<DJWithProbability | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

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

  useEffect(() => {
    fetchProbabilities()

    // Window size for confetti
    setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [fetchProbabilities])

  const handleSpinComplete = (selectedDJ: DJWithProbability) => {
    setWinner(selectedDJ)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 5000)
  }

  const handleConfirmWinner = async () => {
    if (!winner) return

    setIsConfirming(true)
    try {
      await fetch(`/api/djs/${winner.id}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: `Blindtest du ${new Date().toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}` }),
      })

      // Rafraîchir les probabilités
      await fetchProbabilities()
      setWinner(null)
    } catch (error) {
      console.error('Failed to confirm winner:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleReset = () => {
    setWinner(null)
    fetchProbabilities()
  }

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
        {/* Header avec titre */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-1">
            <span className="text-glow text-neon-pink">{t('home.whoWillBeDj')}</span>
            {' '}
            <span className="text-glow text-neon-blue">{t('home.ofTheDay')}</span>
          </h2>
          <p className="text-gray-400 text-sm">
            {t('home.spinDescription')}
          </p>
        </motion.div>

        {/* Layout principal - 3 colonnes sur xl, 2 sur lg, 1 sur mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Colonne gauche - Roue */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center">
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
                djs={djs}
                onSpinComplete={handleSpinComplete}
                isSpinning={isSpinning}
                setIsSpinning={setIsSpinning}
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
                  <ConfirmButton
                    winner={winner}
                    onConfirm={handleConfirmWinner}
                    isLoading={isConfirming}
                  />
                  <button
                    onClick={handleReset}
                    className="mt-2 w-full py-2 text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t('common.restart')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Colonne centrale - Dernière musique */}
          <div className="lg:col-span-7 xl:col-span-4">
            <LatestMusic />
          </div>

          {/* Colonne droite - Probabilités (tous les DJs) */}
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
                <button
                  onClick={fetchProbabilities}
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
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
                  {/* Liste compacte de tous les DJs */}
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

                  {/* Stats en bas */}
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
