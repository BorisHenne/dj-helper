import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import ClientLayout from '@/components/ClientLayout'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  themeColor: '#0a0a0a',
}

export const metadata: Metadata = {
  title: 'DJ Rotation | Blindtest Daily',
  description: 'Application de rotation DJ pour les blindtests quotidiens',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className={`${inter.className} disco-bg min-h-screen text-white antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ClientLayout>
            {children}
          </ClientLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
