'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/Header'
import { DJ, Settings } from '@/types'
import { AVATAR_EMOJIS } from '@/lib/probability'
import { useTranslations, useLocale } from 'next-intl'
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  User,
  Calendar,
  Hash,
  Sliders,
} from 'lucide-react'

export default function UserPage() {
  const t = useTranslations()
  const locale = useLocale()
  const [djs, setDjs] = useState<DJ[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Form states
  const [newDj, setNewDj] = useState({ name: '', avatar: '🎧', color: '#ff6ec7' })
  const [editDj, setEditDj] = useState<Partial<DJ>>({})

  const fetchData = useCallback(async () => {
    try {
      const [djsRes, settingsRes] = await Promise.all([
        fetch('/api/djs'),
        fetch('/api/settings'),
      ])
      const djsData = await djsRes.json()
      const settingsData = await settingsRes.json()
      setDjs(djsData)
      setSettings(settingsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
        fetchData()
      }
    } catch (error) {
      console.error('Failed to add DJ:', error)
    }
  }

  const handleUpdateDj = async (id: string) => {
    try {
      await fetch(`/api/djs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDj),
      })
      setEditingId(null)
      setEditDj({})
      fetchData()
    } catch (error) {
      console.error('Failed to update DJ:', error)
    }
  }

  const handleDeleteDj = async (id: string, name: string) => {
    if (!confirm(t('user.deleteConfirm', { name }))) return

    try {
      await fetch(`/api/djs/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Failed to delete DJ:', error)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/djs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      fetchData()
    } catch (error) {
      console.error('Failed to toggle DJ:', error)
    }
  }

  const handleUpdateSettings = async (key: string, value: number) => {
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      fetchData()
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }

  const startEdit = (dj: DJ) => {
    setEditingId(dj.id)
    setEditDj({
      name: dj.name,
      avatar: dj.avatar,
      color: dj.color,
      totalPlays: dj.totalPlays,
      lastPlayedAt: dj.lastPlayedAt,
    })
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')
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
            <span className="text-glow-sm text-neon-pink">{t('user.title')}</span>
          </h1>
          <p className="text-gray-400">
            {t('user.subtitle')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Section principale - Liste des DJs */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-2xl p-6"
            >
              {/* Header avec actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-neon-blue" />
                  {t('user.participants')} ({djs.length})
                </h2>

                <motion.button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="btn-neon px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" />
                  {t('common.add')}
                </motion.button>
              </div>

              {/* Formulaire d'ajout */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddDj}
                    className="mb-6 p-4 bg-white/5 rounded-xl"
                  >
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-1 block">{t('common.name')}</label>
                        <input
                          type="text"
                          value={newDj.name}
                          onChange={(e) => setNewDj({ ...newDj, name: e.target.value })}
                          placeholder={t('history.djName')}
                          className="w-full"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-400 mb-1 block">{t('common.avatar')}</label>
                        <div className="flex flex-wrap gap-1 p-2 bg-white/5 rounded-lg max-h-20 overflow-y-auto">
                          {AVATAR_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setNewDj({ ...newDj, avatar: emoji })}
                              className={`text-xl p-1 rounded ${
                                newDj.avatar === emoji ? 'bg-neon-pink/30' : 'hover:bg-white/10'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-gray-400 mb-1 block">{t('common.color')}</label>
                        <input
                          type="color"
                          value={newDj.color}
                          onChange={(e) => setNewDj({ ...newDj, color: e.target.value })}
                          className="w-full h-10 rounded-lg cursor-pointer"
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

              {/* Liste des DJs */}
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : djs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">{t('user.noParticipants')}</p>
                  <p className="text-sm">
                    {t('user.addParticipantsHint')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {djs.map((dj) => (
                    <motion.div
                      key={dj.id}
                      layout
                      className={`p-4 rounded-xl flex items-center gap-4 ${
                        dj.isActive ? 'bg-white/5' : 'bg-white/5 opacity-50'
                      }`}
                    >
                      {editingId === dj.id ? (
                        // Mode édition
                        <>
                          <div className="flex-shrink-0">
                            <div className="flex flex-wrap gap-1 max-w-[100px]">
                              {AVATAR_EMOJIS.slice(0, 10).map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => setEditDj({ ...editDj, avatar: emoji })}
                                  className={`text-lg p-0.5 rounded ${
                                    editDj.avatar === emoji ? 'bg-neon-pink/30' : ''
                                  }`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex-grow grid sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={editDj.name || ''}
                              onChange={(e) => setEditDj({ ...editDj, name: e.target.value })}
                              className="text-sm"
                            />
                            <input
                              type="number"
                              value={editDj.totalPlays || 0}
                              onChange={(e) => setEditDj({ ...editDj, totalPlays: parseInt(e.target.value) || 0 })}
                              className="text-sm"
                              min="0"
                            />
                            <input
                              type="color"
                              value={editDj.color || '#ff6ec7'}
                              onChange={(e) => setEditDj({ ...editDj, color: e.target.value })}
                              className="h-9 w-full rounded cursor-pointer"
                            />
                          </div>

                          <div className="flex gap-1">
                            <button
                              onClick={() => handleUpdateDj(dj.id)}
                              className="p-2 text-green-500 hover:bg-green-500/20 rounded-lg"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditDj({}); }}
                              className="p-2 text-gray-400 hover:bg-white/10 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        // Mode affichage
                        <>
                          <div
                            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: dj.color || '#ff6ec7' }}
                          >
                            {dj.avatar || '🎧'}
                          </div>

                          <div className="flex-grow min-w-0">
                            <h3 className="font-bold truncate">{dj.name}</h3>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {dj.totalPlays}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(dj.lastPlayedAt)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleActive(dj.id, dj.isActive)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                dj.isActive
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {dj.isActive ? t('user.active') : t('user.inactive')}
                            </button>
                            <button
                              onClick={() => startEdit(dj)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDj(dj.id, dj.name)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar - Paramètres */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-2xl p-6 sticky top-24"
            >
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <Sliders className="w-5 h-5 text-neon-yellow" />
                {t('user.settings')}
              </h2>

              {settings && (
                <div className="space-y-6">
                  {/* Poids ancienneté */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-gray-400">
                        {t('user.weightSeniority')}
                      </label>
                      <span className="text-neon-pink font-bold">
                        {(settings.weightLastPlayed * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.weightLastPlayed}
                      onChange={(e) =>
                        handleUpdateSettings('weightLastPlayed', parseFloat(e.target.value))
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('user.weightSeniorityDescription')}
                    </p>
                  </div>

                  {/* Poids nombre de passages */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-gray-400">
                        {t('user.weightPlayCount')}
                      </label>
                      <span className="text-neon-blue font-bold">
                        {(settings.weightTotalPlays * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.weightTotalPlays}
                      onChange={(e) =>
                        handleUpdateSettings('weightTotalPlays', parseFloat(e.target.value))
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('user.weightPlayCountDescription')}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
