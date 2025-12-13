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
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ff6ec7' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export const metadata: Metadata = {
  title: 'DJ Rotation | Blindtest Daily',
  description: 'Application de rotation DJ pour les blindtests quotidiens - Who will be today\'s DJ?',
  keywords: ['DJ', 'blindtest', 'music', 'rotation', 'party', 'game'],
  authors: [{ name: 'DJ Helper Team' }],
  creator: 'DJ Helper',
  publisher: 'DJ Helper',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/icon-512x512.png', color: '#ff6ec7' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DJ Rotation',
    startupImage: [
      {
        url: '/icons/icon-512x512.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/icon-512x512.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/icon-512x512.png',
        media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/icons/icon-512x512.png',
        media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },
  applicationName: 'DJ Rotation',
  openGraph: {
    type: 'website',
    siteName: 'DJ Rotation',
    title: 'DJ Rotation | Blindtest Daily',
    description: 'Application de rotation DJ pour les blindtests quotidiens',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'DJ Rotation Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'DJ Rotation | Blindtest Daily',
    description: 'Application de rotation DJ pour les blindtests quotidiens',
    images: ['/icons/icon-512x512.png'],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#0a0a0a',
    'msapplication-TileImage': '/icons/icon-144x144.png',
    'msapplication-config': 'none',
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
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DJ Rotation" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
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
