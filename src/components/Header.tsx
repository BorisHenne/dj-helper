'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, Home, History } from 'lucide-react'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from './LanguageSwitcher'

export default function Header() {
  const pathname = usePathname()
  const t = useTranslations()

  return (
    <header className="sticky top-0 z-50 glass-dark safe-area-top">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Logo - compact on mobile */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-2xl sm:text-4xl"
            >
              🎧
            </motion.div>
            <div className="hidden xs:block">
              <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-neon-pink to-neon-blue bg-clip-text text-transparent whitespace-nowrap">
                {t('header.title')}
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">{t('header.subtitle')}</p>
            </div>
          </Link>

          {/* Navigation - compact on mobile */}
          <nav className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <NavLink href="/" active={pathname === '/'}>
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">{t('common.home')}</span>
            </NavLink>
            <NavLink href="/user/history" active={pathname === '/user/history'}>
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">{t('common.history')}</span>
            </NavLink>
            <NavLink href="/user" active={pathname === '/user'}>
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{t('common.user')}</span>
            </NavLink>
            <LanguageSwitcher />
          </nav>
        </div>
      </div>
    </header>
  )
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-all duration-300 tap-target
        ${active
          ? 'bg-gradient-to-r from-neon-pink/20 to-neon-blue/20 text-white border border-neon-pink/50'
          : 'text-gray-400 hover:text-white hover:bg-white/10'
        }
      `}
    >
      {children}
    </Link>
  )
}
