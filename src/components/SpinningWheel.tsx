'use client'

import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { DJWithProbability } from '@/types'
import { useTranslations } from 'next-intl'

interface SpinningWheelProps {
  djs: DJWithProbability[]
  onSpinComplete: (winner: DJWithProbability) => void
  isSpinning: boolean
  setIsSpinning: (spinning: boolean) => void
  excludeDjIds?: string[]
}

export interface SpinningWheelRef {
  triggerSpin: () => void
  resetWinner: () => void
}

const SpinningWheel = forwardRef<SpinningWheelRef, SpinningWheelProps>(({
  djs,
  onSpinComplete,
  isSpinning,
  setIsSpinning,
  excludeDjIds = [],
}, ref) => {
  const t = useTranslations()
  const wheelRef = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState(0)
  const [winner, setWinner] = useState<DJWithProbability | null>(null)
  const [wheelSize, setWheelSize] = useState(320)

  // Calculate wheel size based on viewport
  useEffect(() => {
    const calculateSize = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      // Use smaller dimension, max 384px, min 260px
      const maxSize = Math.min(vw * 0.85, vh * 0.45, 384)
      const size = Math.max(260, maxSize)
      setWheelSize(size)
    }

    calculateSize()
    window.addEventListener('resize', calculateSize)
    return () => window.removeEventListener('resize', calculateSize)
  }, [])

  const spinWheel = useCallback(async () => {
    if (isSpinning || djs.length === 0) return

    // Haptic feedback on mobile if available
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }

    setIsSpinning(true)
    setWinner(null)

    // Sélectionner le gagnant côté serveur (exclure les DJs spécifiés)
    const response = await fetch('/api/probability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ excludeDjIds })
    })
    const data = await response.json()
    const selectedDJ = data.selected as DJWithProbability

    // Calculer l'angle pour ce DJ
    const djIndex = djs.findIndex(dj => dj.id === selectedDJ.id)
    const segmentAngle = 360 / djs.length
    const targetAngle = djIndex * segmentAngle + segmentAngle / 2

    // Ajouter des tours complets + ajustement pour que la flèche pointe vers le gagnant
    const spins = 5 + Math.random() * 3 // 5-8 tours
    const finalRotation = rotation + spins * 360 + (360 - targetAngle) + 90

    setRotation(finalRotation)

    // Haptic feedback during spin
    if (navigator.vibrate) {
      // Create a pattern: vibrate during spin
      const pattern = Array(10).fill([30, 100]).flat()
      navigator.vibrate(pattern)
    }

    // Attendre la fin de l'animation
    setTimeout(() => {
      setWinner(selectedDJ)
      setIsSpinning(false)
      onSpinComplete(selectedDJ)

      // Final haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
    }, 5000)
  }, [isSpinning, djs, rotation, setIsSpinning, onSpinComplete, excludeDjIds])

  // Expose spinWheel and resetWinner to parent via ref
  useImperativeHandle(ref, () => ({
    triggerSpin: spinWheel,
    resetWinner: () => setWinner(null)
  }), [spinWheel])

  if (djs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-6xl mb-4">🎧</div>
        <p className="text-gray-400 text-center">
          {t('home.noDjActive')}<br />
          {t('home.addParticipantsInAdmin')}
        </p>
      </div>
    )
  }

  const segmentAngle = 360 / djs.length
  // Calculate label radius based on wheel size
  const labelRadius = wheelSize * 0.31

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-8 touch-manipulation">
      {/* Indicateur / Flèche */}
      <div className="relative">
        <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 z-10">
          <div
            className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[22px] sm:border-l-[20px] sm:border-r-[20px] sm:border-t-[30px] border-l-transparent border-r-transparent border-t-neon-yellow drop-shadow-[0_0_10px_#fff700]"
          />
        </div>

        {/* La Roue - Responsive sizing */}
        <motion.div
          ref={wheelRef}
          className="relative rounded-full shadow-2xl no-select"
          style={{
            width: wheelSize,
            height: wheelSize,
            background: 'conic-gradient(from 0deg, ' +
              djs.map((dj, i) =>
                `${dj.color || '#ff6ec7'} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
              ).join(', ') + ')',
          }}
          animate={{ rotate: rotation }}
          transition={{ duration: 5, ease: [0.17, 0.67, 0.12, 0.99] }}
        >
          {/* Labels des DJs */}
          {djs.map((dj, index) => {
            const angle = index * segmentAngle + segmentAngle / 2 - 90

            return (
              <div
                key={dj.id}
                className="absolute text-center no-select"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `
                    translate(-50%, -50%)
                    rotate(${angle}deg)
                    translateY(-${labelRadius}px)
                    rotate(${-angle}deg)
                  `,
                }}
              >
                <span
                  className="drop-shadow-lg"
                  style={{ fontSize: Math.max(wheelSize * 0.06, 18) }}
                >
                  {dj.avatar || '🎧'}
                </span>
                <p
                  className="font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mt-0.5 truncate"
                  style={{
                    fontSize: Math.max(wheelSize * 0.028, 10),
                    maxWidth: Math.max(wheelSize * 0.15, 50)
                  }}
                >
                  {dj.name}
                </p>
              </div>
            )
          })}

          {/* Centre de la roue */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-900 border-4 border-white flex items-center justify-center shadow-lg"
            style={{
              width: wheelSize * 0.21,
              height: wheelSize * 0.21,
            }}
          >
            <span style={{ fontSize: wheelSize * 0.08 }}>🎶</span>
          </div>
        </motion.div>
      </div>

      {/* Bouton Spin - Touch optimized */}
      <motion.button
        onClick={spinWheel}
        disabled={isSpinning}
        className={`
          btn-neon px-6 py-3 sm:px-8 sm:py-4 rounded-full text-lg sm:text-xl font-bold uppercase tracking-wider
          tap-target min-h-[52px]
          ${isSpinning
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-neon-pink to-neon-blue hover:from-neon-blue hover:to-neon-pink active:scale-95'
          }
          transition-all duration-300 shadow-lg
        `}
        whileHover={!isSpinning ? { scale: 1.05 } : {}}
        whileTap={!isSpinning ? { scale: 0.95 } : {}}
      >
        {isSpinning ? (
          <span className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              🎵
            </motion.span>
            {t('home.spinning')}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span>🎰</span>
            {t('home.spinWheel')}
          </span>
        )}
      </motion.button>

      {/* Affichage du gagnant */}
      {winner && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="winner-animation glass rounded-2xl p-4 sm:p-6 text-center w-full max-w-sm"
        >
          <p className="text-neon-yellow text-xs sm:text-sm uppercase tracking-wider mb-2">
            {t('home.djOfTheDayIs')}
          </p>
          <div className="text-5xl sm:text-6xl mb-2">{winner.avatar || '🎧'}</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-glow text-neon-pink">
            {winner.name}
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-2">
            {t('home.probability')}: {winner.probability.toFixed(1)}%
          </p>
        </motion.div>
      )}
    </div>
  )
})

SpinningWheel.displayName = 'SpinningWheel'

export default SpinningWheel
