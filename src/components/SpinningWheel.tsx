'use client'

import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DJWithProbability } from '@/types'

interface SpinningWheelProps {
  djs: DJWithProbability[]
  onSpinComplete: (winner: DJWithProbability) => void
  isSpinning: boolean
  setIsSpinning: (spinning: boolean) => void
}

export default function SpinningWheel({
  djs,
  onSpinComplete,
  isSpinning,
  setIsSpinning,
}: SpinningWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState(0)
  const [winner, setWinner] = useState<DJWithProbability | null>(null)

  const spinWheel = async () => {
    if (isSpinning || djs.length === 0) return

    setIsSpinning(true)
    setWinner(null)

    // Sélectionner le gagnant côté serveur
    const response = await fetch('/api/probability', { method: 'POST' })
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

    // Attendre la fin de l'animation
    setTimeout(() => {
      setWinner(selectedDJ)
      setIsSpinning(false)
      onSpinComplete(selectedDJ)
    }, 5000)
  }

  if (djs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-6xl mb-4">🎧</div>
        <p className="text-gray-400 text-center">
          Aucun DJ actif pour le moment.<br />
          Ajoutez des participants dans l'admin !
        </p>
      </div>
    )
  }

  const segmentAngle = 360 / djs.length

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Indicateur / Flèche */}
      <div className="relative">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-neon-yellow drop-shadow-[0_0_10px_#fff700]" />
        </div>

        {/* La Roue */}
        <motion.div
          ref={wheelRef}
          className="relative w-80 h-80 md:w-96 md:h-96 rounded-full shadow-2xl"
          style={{
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
            const radius = 120 // Distance du centre

            return (
              <div
                key={dj.id}
                className="absolute text-center"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `
                    translate(-50%, -50%)
                    rotate(${angle}deg)
                    translateY(-${radius}px)
                    rotate(${-angle}deg)
                  `,
                }}
              >
                <span className="text-2xl drop-shadow-lg">{dj.avatar || '🎧'}</span>
                <p className="text-xs font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mt-1 max-w-[60px] truncate">
                  {dj.name}
                </p>
              </div>
            )
          })}

          {/* Centre de la roue */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gray-900 border-4 border-white flex items-center justify-center shadow-lg">
            <span className="text-3xl">🎶</span>
          </div>
        </motion.div>
      </div>

      {/* Bouton Spin */}
      <motion.button
        onClick={spinWheel}
        disabled={isSpinning}
        className={`
          btn-neon px-8 py-4 rounded-full text-xl font-bold uppercase tracking-wider
          ${isSpinning
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-neon-pink to-neon-blue hover:from-neon-blue hover:to-neon-pink'
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
            Spinning...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span>🎰</span>
            Tourner la roue !
          </span>
        )}
      </motion.button>

      {/* Affichage du gagnant */}
      {winner && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="winner-animation glass rounded-2xl p-6 text-center"
        >
          <p className="text-neon-yellow text-sm uppercase tracking-wider mb-2">
            Le DJ du jour est...
          </p>
          <div className="text-6xl mb-2">{winner.avatar || '🎧'}</div>
          <h2 className="text-3xl font-bold text-glow text-neon-pink">
            {winner.name}
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Probabilité: {winner.probability.toFixed(1)}%
          </p>
        </motion.div>
      )}
    </div>
  )
}
