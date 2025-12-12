'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'

interface YouTubePlayerProps {
  videoId: string
  title: string
  artist: string
  isOpen: boolean
  onClose: () => void
  onNext?: () => void
  onPrevious?: () => void
  hasNext?: boolean
  hasPrevious?: boolean
}

export default function YouTubePlayer({
  videoId,
  title,
  artist,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
}: YouTubePlayerProps) {
  const [isMuted, setIsMuted] = useState(false)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext()
      if (e.key === 'ArrowLeft' && hasPrevious && onPrevious) onPrevious()
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, onNext, onPrevious, hasNext, hasPrevious])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* YouTube Embed */}
            <div className="relative aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1${isMuted ? '&mute=1' : ''}`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>

            {/* Controls bar */}
            <div className="p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                {/* Song info */}
                <div className="flex-1 min-w-0 mr-4">
                  <h3 className="font-bold text-lg truncate">{title}</h3>
                  <p className="text-gray-400 text-sm truncate">{artist}</p>
                </div>

                {/* Navigation controls */}
                <div className="flex items-center gap-2">
                  {/* Previous button */}
                  <button
                    onClick={onPrevious}
                    disabled={!hasPrevious}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Previous (Left arrow)"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  {/* Mute button */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>

                  {/* Next button */}
                  <button
                    onClick={onNext}
                    disabled={!hasNext}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Next (Right arrow)"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Keyboard shortcuts hint */}
              <div className="mt-2 text-xs text-gray-500 text-center">
                ESC to close | Arrow keys to navigate
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Mini player button component
interface PlayButtonProps {
  onClick: () => void
  size?: 'sm' | 'md' | 'lg'
}

export function PlayButton({ onClick, size = 'sm' }: PlayButtonProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <button
      onClick={onClick}
      className="p-1.5 text-green-500 hover:bg-green-500/20 rounded transition-colors"
      title="Play"
    >
      <Play className={sizeClasses[size]} />
    </button>
  )
}
