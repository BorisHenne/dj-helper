'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'

const languages = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
]

export default function LanguageSwitcher() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)

  const switchLocale = async (locale: string) => {
    try {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      })

      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Failed to switch locale:', error)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        disabled={isPending}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">
          {isPending ? '...' : 'Lang'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 bg-gray-800 rounded-lg shadow-xl border border-white/10 overflow-hidden min-w-[120px]">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLocale(lang.code)}
                className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
