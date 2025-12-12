'use client'

import { useEffect, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues
const PWAComponents = dynamic(() => import('./PWAPrompt'), { ssr: false })
const DebugDateBar = dynamic(() => import('./DebugDateBar'), { ssr: false })

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {mounted && (
        <Suspense fallback={null}>
          <DebugDateBar />
        </Suspense>
      )}
      {children}
      {mounted && <PWAComponents />}
    </>
  )
}
