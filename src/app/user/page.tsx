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

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            <span className="text-glow-sm text-neon-pink">{t('user.title')}</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            {t('user.subtitle')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Section principale - Liste des DJs */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-2xl p-4 sm:p-6"
            >
              {/* Header avec actions */}
              <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-neon-blue flex-shrink-0" />
                  <span className="hidden xs:inline">{t('user.participants')}</span>
                  <span className="text-sm font-normal text-gray-400">({djs.length})</span>
                </h2>

                <motion.button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="btn-neon px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center gap-2 tap-target flex-shrink-0"
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden xs:inline">{t('common.add')}</span>
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
                    className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white/5 rounded-xl overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                              className={`text-xl p-1 rounded tap-target ${
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
                        className="px-4 py-2 text-gray-400 hover:text-white tap-target"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-500 rounded-lg font-bold tap-target"
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
                <div className="space-y-2 sm:space-y-3">
                  {djs.map((dj) => (
                    <motion.div
                      key={dj.id}
                      layout
                      className={`p-3 sm:p-4 rounded-xl flex items-center gap-2 sm:gap-4 ${
                        dj.isActive ? 'bg-white/5' : 'bg-white/5 opacity-50'
                      }`}
                    >
                      {editingId === dj.id ? (
                        // Mode édition - simplifié sur mobile
                        <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:items-center">
                          <div className="flex gap-2 items-center">
                            <div className="flex flex-wrap gap-1 max-w-[80px] sm:max-w-[100px]">
                              {AVATAR_EMOJIS.slice(0, 8).map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => setEditDj({ ...editDj, avatar: emoji })}
                                  className={`text-base sm:text-lg p-0.5 rounded ${
                                    editDj.avatar === emoji ? 'bg-neon-pink/30' : ''
                                  }`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex-grow grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={editDj.name || ''}
                              onChange={(e) => setEditDj({ ...editDj, name: e.target.value })}
                              className="text-sm col-span-2 sm:col-span-1"
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

                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => handleUpdateDj(dj.id)}
                              className="p-2 text-green-500 hover:bg-green-500/20 rounded-lg tap-target"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditDj({}); }}
                              className="p-2 text-gray-400 hover:bg-white/10 rounded-lg tap-target"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Mode affichage
                        <>
                          <div
                            className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg sm:text-xl"
                            style={{ backgroundColor: dj.color || '#ff6ec7' }}
                          >
                            {dj.avatar || '🎧'}
                          </div>

                          <div className="flex-grow min-w-0">
                            <h3 className="font-bold truncate text-sm sm:text-base">{dj.name}</h3>
                            <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-400">
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

                          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleToggleActive(dj.id, dj.isActive)}
                              className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-colors tap-target ${
                                dj.isActive
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {dj.isActive ? t('user.active') : t('user.inactive')}
                            </button>
                            <button
                              onClick={() => startEdit(dj)}
                              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg tap-target"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDj(dj.id, dj.name)}
                              className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg tap-target"
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
              className="glass rounded-2xl p-4 sm:p-6 sticky top-24"
            >
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-4 sm:mb-6">
                <Sliders className="w-5 h-5 text-neon-yellow" />
                {t('user.settings')}
              </h2>

              {settings && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Poids ancienneté */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs sm:text-sm text-gray-400">
                        {t('user.weightSeniority')}
                      </label>
                      <span className="text-neon-pink font-bold text-sm">
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
                      <label className="text-xs sm:text-sm text-gray-400">
                        {t('user.weightPlayCount')}
                      </label>
                      <span className="text-neon-blue font-bold text-sm">
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
