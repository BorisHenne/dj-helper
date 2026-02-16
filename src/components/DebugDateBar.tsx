'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { setMockDate, getMockDate, formatDateDisplay } from '@/lib/dates'
import { Bug, X, Calendar } from 'lucide-react'

export default function DebugDateBar() {
  const searchParams = useSearchParams()
  const [mockDateStr, setMockDateStr] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const dateParam = searchParams.get('mockDate')
    if (dateParam) {
      // Parse date string (YYYY-MM-DD)
      const [year, month, day] = dateParam.split('-').map(Number)
      if (year && month && day) {
        const date = new Date(year, month - 1, day, 9, 0, 0) // 9h du matin
        setMockDate(date)
        setMockDateStr(formatDateDisplay(date, 'fr'))
        setIsVisible(true)
      }
    } else {
      setMockDate(null)
      setMockDateStr(null)
      setIsVisible(false)
    }
  }, [searchParams])

  const clearMockDate = () => {
    // Remove mockDate from URL
    const url = new URL(window.location.href)
    url.searchParams.delete('mockDate')
    window.location.href = url.toString()
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
      <Bug className="w-4 h-4" />
      <span>Mode Debug - Date simulée:</span>
      <span className="font-bold flex items-center gap-1">
        <Calendar className="w-4 h-4" />
        {mockDateStr}
      </span>
      <span className="text-yellow-800">(9h du matin)</span>
      <button
        onClick={clearMockDate}
        className="ml-4 p-1 hover:bg-yellow-600 rounded transition-colors"
        title="Désactiver le mode debug"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
