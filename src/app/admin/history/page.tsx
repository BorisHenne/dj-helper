'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/Header'
import { DJHistory } from '@/types'
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Music,
  Calendar,
  Youtube,
  User,
  RefreshCw,
  Loader2,
  Sparkles,
} from 'lucide-react'

export default function HistoryPage() {
  const [history, setHistory] = useState<DJHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isFetchingYouTube, setIsFetchingYouTube] = useState(false)

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

    // Validate YouTube URL
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

  // Handle YouTube URL change with auto-fetch
  const handleYouTubeUrlChange = (url: string) => {
    setNewEntry(prev => ({ ...prev, youtubeUrl: url }))
    // Auto-fetch when URL looks complete
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
        alert(error.error || 'Erreur lors de l\'ajout')
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
        alert(error.error || 'Erreur lors de la modification')
      }
    } catch (error) {
      console.error('Failed to update entry:', error)
    }
  }

  const handleDeleteEntry = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" de l'historique ?`)) return

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
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[7].length === 11 ? match[7] : null
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-glow-sm text-neon-pink">Historique des musiques</span>
          </h1>
          <p className="text-gray-400">
            Gérez l'historique des musiques passées par les DJs
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
              Historique ({history.length} entrées)
            </h2>

            <div className="flex flex-wrap gap-2">
              <motion.button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn-neon px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </motion.button>

              <motion.button
                onClick={fetchHistory}
                className="btn-neon px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-4 h-4" />
                Rafraîchir
              </motion.button>
            </div>
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
                    <label className="text-sm text-gray-400 mb-1 block">Nom du DJ</label>
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
                    <label className="text-sm text-gray-400 mb-1 block">Titre de la musique</label>
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
                    <label className="text-sm text-gray-400 mb-1 block">Artiste</label>
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
                    <label className="text-sm text-gray-400 mb-1 block">Lien YouTube</label>
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
                        title="Récupérer titre et artiste automatiquement"
                      >
                        {isFetchingYouTube ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Auto</span>
                      </button>
                    </div>
                    {isFetchingYouTube && (
                      <p className="text-xs text-purple-400 mt-1 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Récupération des infos YouTube...
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Date de passage</label>
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
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 rounded-lg font-bold"
                  >
                    Ajouter
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Liste de l'historique */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="mb-2">Aucune musique dans l'historique</p>
              <p className="text-sm">
                Ajoutez les musiques passées par les DJs
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  className="p-4 rounded-xl bg-white/5"
                >
                  {editingId === entry.id ? (
                    // Mode édition
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">DJ</label>
                          <input
                            type="text"
                            value={editEntry.djName || ''}
                            onChange={(e) => setEditEntry({ ...editEntry, djName: e.target.value })}
                            className="w-full text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Titre</label>
                          <input
                            type="text"
                            value={editEntry.title || ''}
                            onChange={(e) => setEditEntry({ ...editEntry, title: e.target.value })}
                            className="w-full text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Artiste</label>
                          <input
                            type="text"
                            value={editEntry.artist || ''}
                            onChange={(e) => setEditEntry({ ...editEntry, artist: e.target.value })}
                            className="w-full text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Date</label>
                          <input
                            type="date"
                            value={editEntry.playedAt?.split('T')[0] || ''}
                            onChange={(e) => setEditEntry({ ...editEntry, playedAt: e.target.value })}
                            className="w-full text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Lien YouTube</label>
                        <input
                          type="url"
                          value={editEntry.youtubeUrl || ''}
                          onChange={(e) => setEditEntry({ ...editEntry, youtubeUrl: e.target.value })}
                          className="w-full text-sm"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleUpdateEntry(entry.id)}
                          className="p-2 text-green-500 hover:bg-green-500/20 rounded-lg flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          <span className="text-sm">Sauvegarder</span>
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditEntry({}); }}
                          className="p-2 text-gray-400 hover:bg-white/10 rounded-lg flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          <span className="text-sm">Annuler</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Mode affichage
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Thumbnail YouTube */}
                      <div className="flex-shrink-0">
                        {getYoutubeVideoId(entry.youtubeUrl) ? (
                          <a
                            href={entry.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative group"
                          >
                            <img
                              src={`https://img.youtube.com/vi/${getYoutubeVideoId(entry.youtubeUrl)}/mqdefault.jpg`}
                              alt={entry.title}
                              className="w-40 h-24 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                              <Youtube className="w-10 h-10 text-red-500" />
                            </div>
                          </a>
                        ) : (
                          <div className="w-40 h-24 bg-white/10 rounded-lg flex items-center justify-center">
                            <Music className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="flex-grow min-w-0">
                        <h3 className="font-bold text-lg truncate">{entry.title}</h3>
                        <p className="text-neon-pink truncate">{entry.artist}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {entry.djName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(entry.playedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-start gap-1 flex-shrink-0">
                        <a
                          href={entry.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                          title="Voir sur YouTube"
                        >
                          <Youtube className="w-5 h-5" />
                        </a>
                        <button
                          onClick={() => startEdit(entry)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                          title="Modifier"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id, entry.title)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
