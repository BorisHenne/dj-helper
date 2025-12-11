'use client'

import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'

interface ConfirmButtonProps {
  winner: { id: string; name: string; avatar: string | null }
  onConfirm: () => void
  isLoading: boolean
}

export default function ConfirmButton({
  winner,
  onConfirm,
  isLoading,
}: ConfirmButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6 text-center"
    >
      <p className="text-gray-300 mb-4">
        Confirmer que <strong className="text-neon-pink">{winner.name}</strong> {winner.avatar} est le DJ du jour ?
      </p>

      <div className="flex gap-3 justify-center">
        <motion.button
          onClick={onConfirm}
          disabled={isLoading}
          className="btn-neon px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 font-bold flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          C'est validé !
        </motion.button>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Cela enregistrera le passage et mettra à jour les probabilités
      </p>
    </motion.div>
  )
}
