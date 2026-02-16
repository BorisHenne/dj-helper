'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Wifi, WifiOff } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const t = useTranslations()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIOS(isIOSDevice)

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) return

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // For iOS, show prompt if not standalone
    if (isIOSDevice && !isStandalone) {
      const hasSeenPrompt = localStorage.getItem('pwa-prompt-seen')
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 5000)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    }
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-seen', 'true')
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-seen', 'true')
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="install-prompt"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-2xl">🎧</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm">
                {t('pwa.installTitle')}
              </h3>
              <p className="text-white/80 text-xs mt-1">
                {isIOS ? t('pwa.installIOSDescription') : t('pwa.installDescription')}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isIOS ? (
            <div className="mt-3 p-3 bg-white/10 rounded-lg">
              <p className="text-xs text-white/90 flex items-center gap-2">
                <span>1. {t('pwa.iosStep1')}</span>
              </p>
              <p className="text-xs text-white/90 flex items-center gap-2 mt-1">
                <span>2. {t('pwa.iosStep2')}</span>
              </p>
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 py-2 px-4 bg-white text-gray-900 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('pwa.install')}
              </button>
              <button
                onClick={handleDismiss}
                className="py-2 px-4 bg-white/20 text-white rounded-lg text-sm"
              >
                {t('pwa.later')}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function OfflineIndicator() {
  const t = useTranslations()
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="offline-indicator flex items-center gap-2"
        >
          <WifiOff className="w-4 h-4" />
          <span>{t('pwa.offline')}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function PWAComponents() {
  return (
    <>
      <PWAInstallPrompt />
      <OfflineIndicator />
    </>
  )
}
