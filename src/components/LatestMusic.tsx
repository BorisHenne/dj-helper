'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DJHistory } from '@/types'
import { Music, User, Calendar, Youtube, ExternalLink } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

export default function LatestMusic() {
  const t = useTranslations()
  const locale = useLocale()
  const [latest, setLatest] = useState<DJHistory | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const response = await fetch('/api/history/latest')
        const data = await response.json()
        setLatest(data)
      } catch (error) {
        console.error('Failed to fetch latest music:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLatest()
  }, [])

  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[7].length === 11 ? match[7] : null
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
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
          <div className="aspect-video bg-white/10 rounded-xl mb-4" />
          <div className="h-4 bg-white/10 rounded w-32 mb-2" />
          <div className="h-4 bg-white/10 rounded w-24" />
        </div>
      </motion.div>
    )
  }

  if (!latest) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Music className="w-5 h-5 text-neon-green" />
          {t('home.latestMusic')}
        </h3>
        <div className="text-center py-8 text-gray-400">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">{t('history.noEntries')}</p>
        </div>
      </motion.div>
    )
  }

  // Get video ID from database field first, then try to extract from URL
  const videoId = latest.videoId || getYoutubeVideoId(latest.youtubeUrl)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6"
    >
      <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
        <Music className="w-5 h-5 text-neon-green" />
        {t('home.latestMusic')}
      </h3>

      {/* Embedded YouTube Player */}
      {videoId ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title={latest.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      ) : (
        <a
          href={latest.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block aspect-video rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-red-900/50 to-red-600/50 flex items-center justify-center group hover:from-red-800/50 hover:to-red-500/50 transition-colors"
        >
          <div className="text-center">
            <Youtube className="w-16 h-16 mx-auto mb-2 text-red-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm text-gray-300">{t('history.watchOnYoutube')}</span>
          </div>
        </a>
      )}

      {/* Info */}
      <div className="space-y-2">
        <h4 className="font-bold text-lg text-white truncate">
          {latest.title}
        </h4>
        <p className="text-neon-pink font-medium truncate">{latest.artist}</p>

        <div className="flex items-center gap-4 text-sm text-gray-400 pt-2">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {latest.djName}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(latest.playedAt)}
          </span>
        </div>
      </div>

      {/* Link to YouTube */}
      <a
        href={latest.youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm"
      >
        <Youtube className="w-4 h-4" />
        {t('history.watchOnYoutube')}
        <ExternalLink className="w-3 h-3" />
      </a>
    </motion.div>
  )
}
