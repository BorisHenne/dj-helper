'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/Header'
import YouTubePlayer, { PlayButton } from '@/components/YouTubePlayer'
import { DJHistory } from '@/types'
import { useTranslations, useLocale } from 'next-intl'
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Music,
  Youtube,
  RefreshCw,
  Loader2,
  Sparkles,
  ExternalLink,
  Play,
  Search,
} from 'lucide-react'

export default function HistoryPage() {
  const t = useTranslations()
  const locale = useLocale()
  const [history, setHistory] = useState<DJHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isFetchingYouTube, setIsFetchingYouTube] = useState(false)
  const [playerOpen, setPlayerOpen] = useState(false)
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(-1)
  const [searchQuery, setSearchQuery] = useState('')

  // Filtered history based on search
  const filteredHistory = history.filter(entry => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      entry.djName.toLowerCase().includes(query) ||
      entry.artist.toLowerCase().includes(query) ||
      entry.title.toLowerCase().includes(query)
    )
  })

  // Form states
  const [newEntry, setNewEntry] = useState({
    djName: '',
    title: '',
    artist: '',
    youtubeUrl: '',
    playedAt: new Date().toISOString().split('T')[0],
  })
  const [editEntry, setEditEntry] = useState<Partial<DJHistory>>({})

  // Fetch YouTube info and auto-fill title/artist
  const fetchYouTubeInfo = async (url: string) => {
    if (!url || isFetchingYouTube) return

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
    if (!youtubeRegex.test(url)) return

    setIsFetchingYouTube(true)
    try {
      const response = await fetch(`/api/youtube?url=${encodeURIComponent(url)}`)
      if (response.ok) {
        const data = await response.json()
        setNewEntry(prev => ({
          ...prev,
          title: data.title || prev.title,
          artist: data.artist || prev.artist,
        }))
      }
    } catch (error) {
      console.error('Failed to fetch YouTube info:', error)
    } finally {
      setIsFetchingYouTube(false)
    }
  }

  const handleYouTubeUrlChange = (url: string) => {
    setNewEntry(prev => ({ ...prev, youtubeUrl: url }))
    if (url.includes('youtube.com/watch?v=') || url.includes('youtu.be/')) {
      fetchYouTubeInfo(url)
    }
  }

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/history')
      const data = await response.json()
      setHistory(data)
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEntry.djName.trim() || !newEntry.title.trim() || !newEntry.artist.trim() || !newEntry.youtubeUrl.trim()) {
      return
    }

    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      })

      if (response.ok) {
        setNewEntry({
          djName: '',
          title: '',
          artist: '',
          youtubeUrl: '',
          playedAt: new Date().toISOString().split('T')[0],
        })
        setShowAddForm(false)
        fetchHistory()
      } else {
        const error = await response.json()
        alert(error.error || t('common.error'))
      }
    } catch (error) {
      console.error('Failed to add entry:', error)
    }
  }

  const handleUpdateEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/history/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editEntry),
      })

      if (response.ok) {
        setEditingId(null)
        setEditEntry({})
        fetchHistory()
      } else {
        const error = await response.json()
        alert(error.error || t('common.error'))
      }
    } catch (error) {
      console.error('Failed to update entry:', error)
    }
  }

  const handleDeleteEntry = async (id: string, title: string) => {
    if (!confirm(`${t('common.delete')} "${title}"?`)) return

    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' })
      fetchHistory()
    } catch (error) {
      console.error('Failed to delete entry:', error)
    }
  }

  const startEdit = (entry: DJHistory) => {
    setEditingId(entry.id)
    setEditEntry({
      djName: entry.djName,
      title: entry.title,
      artist: entry.artist,
      youtubeUrl: entry.youtubeUrl,
      playedAt: entry.playedAt.split('T')[0],
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[7].length === 11 ? match[7] : null
  }

  // Player functions
  const playVideo = (index: number) => {
    setCurrentPlayingIndex(index)
    setPlayerOpen(true)
  }

  const playNext = () => {
    if (currentPlayingIndex < filteredHistory.length - 1) {
      setCurrentPlayingIndex(currentPlayingIndex + 1)
    }
  }

  const playPrevious = () => {
    if (currentPlayingIndex > 0) {
      setCurrentPlayingIndex(currentPlayingIndex - 1)
    }
  }

  const closePlayer = () => {
    setPlayerOpen(false)
    setCurrentPlayingIndex(-1)
  }

  const currentVideo = currentPlayingIndex >= 0 ? filteredHistory[currentPlayingIndex] : null
  const currentVideoId = currentVideo ? getYoutubeVideoId(currentVideo.youtubeUrl) : null

  return (
    <div className="min-h-screen">
      <Header />

      {/* YouTube Player Modal */}
      {currentVideoId && currentVideo && (
        <YouTubePlayer
          videoId={currentVideoId}
          title={currentVideo.title}
          artist={currentVideo.artist}
          isOpen={playerOpen}
          onClose={closePlayer}
          onNext={playNext}
          onPrevious={playPrevious}
          hasNext={currentPlayingIndex < filteredHistory.length - 1}
          hasPrevious={currentPlayingIndex > 0}
        />
      )}

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-glow-sm text-neon-pink">{t('history.title')}</span>
          </h1>
          <p className="text-gray-400">
            {t('history.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-2xl p-6"
        >
          {/* Header avec actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Music className="w-5 h-5 text-neon-blue" />
              {t('common.history')} ({history.length} {t('history.entries')})
            </h2>

            <div className="flex flex-wrap gap-2">
              <motion.button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn-neon px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4" />
                {t('common.add')}
              </motion.button>

              <motion.button
                onClick={fetchHistory}
                className="btn-neon px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-4 h-4" />
                {t('common.refresh')}
              </motion.button>
            </div>
          </div>

          {/* Search bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`${t('common.search')} DJ, ${t('history.artist').toLowerCase()}, ${t('history.songTitle').toLowerCase()}...`}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-neon-blue focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-400 mt-2">
                {filteredHistory.length} {t('history.entries')} {locale === 'fr' ? 'trouvées' : 'found'}
              </p>
            )}
          </div>

          {/* Formulaire d'ajout */}
          <AnimatePresence>
            {showAddForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddEntry}
                className="mb-6 p-4 bg-white/5 rounded-xl"
              >
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">{t('history.djName')}</label>
                    <input
                      type="text"
                      value={newEntry.djName}
                      onChange={(e) => setNewEntry({ ...newEntry, djName: e.target.value })}
                      placeholder="Ex: DJ Max"
                      className="w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">{t('history.songTitle')}</label>
                    <input
                      type="text"
                      value={newEntry.title}
                      onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                      placeholder="Ex: Bohemian Rhapsody"
                      className="w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">{t('history.artist')}</label>
                    <input
                      type="text"
                      value={newEntry.artist}
                      onChange={(e) => setNewEntry({ ...newEntry, artist: e.target.value })}
                      placeholder="Ex: Queen"
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-sm text-gray-400 mb-1 block">{t('history.youtubeUrl')}</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newEntry.youtubeUrl}
                        onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-1"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => fetchYouTubeInfo(newEntry.youtubeUrl)}
                        disabled={isFetchingYouTube || !newEntry.youtubeUrl}
                        className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2"
                        title={t('history.autoFetch')}
                      >
                        {isFetchingYouTube ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">{t('history.autoFetch')}</span>
                      </button>
                    </div>
                    {isFetchingYouTube && (
                      <p className="text-xs text-purple-400 mt-1 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {t('history.fetchingInfo')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">{t('history.playedAt')}</label>
                    <input
                      type="date"
                      value={newEntry.playedAt}
                      onChange={(e) => setNewEntry({ ...newEntry, playedAt: e.target.value })}
                      className="w-full"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 rounded-lg font-bold"
                  >
                    {t('common.add')}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Table de l'historique */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="mb-2">{searchQuery ? (locale === 'fr' ? 'Aucun résultat' : 'No results') : t('history.noEntries')}</p>
              <p className="text-sm">{searchQuery ? (locale === 'fr' ? 'Essayez une autre recherche' : 'Try another search') : t('history.addMusic')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-gray-400 font-medium text-sm w-20">

                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                      {t('history.playedAt')}
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                      DJ
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                      {t('history.artist')}
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                      {t('history.songTitle')}
                    </th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      {editingId === entry.id ? (
                        // Mode édition
                        <>
                          <td className="py-2 px-2"></td>
                          <td className="py-2 px-4">
                            <input
                              type="date"
                              value={editEntry.playedAt?.split('T')[0] || ''}
                              onChange={(e) => setEditEntry({ ...editEntry, playedAt: e.target.value })}
                              className="w-full text-sm bg-white/10 rounded px-2 py-1"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <input
                              type="text"
                              value={editEntry.djName || ''}
                              onChange={(e) => setEditEntry({ ...editEntry, djName: e.target.value })}
                              className="w-full text-sm bg-white/10 rounded px-2 py-1"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <input
                              type="text"
                              value={editEntry.artist || ''}
                              onChange={(e) => setEditEntry({ ...editEntry, artist: e.target.value })}
                              className="w-full text-sm bg-white/10 rounded px-2 py-1"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <input
                              type="text"
                              value={editEntry.title || ''}
                              onChange={(e) => setEditEntry({ ...editEntry, title: e.target.value })}
                              className="w-full text-sm bg-white/10 rounded px-2 py-1"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleUpdateEntry(entry.id)}
                                className="p-1.5 text-green-500 hover:bg-green-500/20 rounded"
                                title={t('common.save')}
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setEditingId(null); setEditEntry({}); }}
                                className="p-1.5 text-gray-400 hover:bg-white/10 rounded"
                                title={t('common.cancel')}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        // Mode affichage
                        <>
                          {/* Thumbnail */}
                          <td className="py-2 px-2">
                            {getYoutubeVideoId(entry.youtubeUrl) ? (
                              <button
                                onClick={() => playVideo(index)}
                                className="relative group/thumb block w-16 h-10 rounded overflow-hidden bg-black"
                              >
                                <img
                                  src={`https://img.youtube.com/vi/${getYoutubeVideoId(entry.youtubeUrl)}/default.jpg`}
                                  alt={entry.title}
                                  className="w-full h-full object-cover opacity-80 group-hover/thumb:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/thumb:bg-black/10 transition-colors">
                                  <Play className="w-4 h-4 text-white" />
                                </div>
                              </button>
                            ) : (
                              <div className="w-16 h-10 rounded bg-white/5 flex items-center justify-center">
                                <Music className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {formatDate(entry.playedAt)}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium">
                            {entry.djName}
                          </td>
                          <td className="py-3 px-4 text-sm text-neon-pink">
                            {entry.artist}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <a
                              href={entry.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-neon-blue transition-colors flex items-center gap-1"
                            >
                              {entry.title}
                              <ExternalLink className="w-3 h-3 opacity-50" />
                            </a>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => playVideo(index)}
                                className="p-1.5 text-green-500 hover:bg-green-500/20 rounded transition-colors"
                                title={t('history.play')}
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <a
                                href={entry.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"
                                title={t('history.watchOnYoutube')}
                              >
                                <Youtube className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => startEdit(entry)}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded"
                                title={t('common.edit')}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEntry(entry.id, entry.title)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded"
                                title={t('common.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
