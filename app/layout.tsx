import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import { ServiceWorkerRegister } from './sw-register'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

const SITE_NAME = 'Molecular'
const SITE_TITLE = 'Molecular — Build atoms, form molecules, run reactions in 3D'
const SITE_DESCRIPTION =
  'A free, interactive 3D chemistry playground for students and teachers. Browse a curated molecule library, build atoms with a drag-and-snap interface, run guided reaction demonstrations, and explore the periodic table with an AI tutor.'

// Resolves to the production URL when NEXT_PUBLIC_SITE_URL is set on
// Vercel, otherwise falls back to localhost so dev `metadataBase`
// resolution doesn't throw. All og:image and twitter:image paths in
// per-route metadata resolve against this base.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    // %s placeholder lets per-route metadata set just the page title;
    // the suffix " · Molecular" is added automatically. Pages that
    // already include "Molecular" in their title use `absolute` to skip.
    template: '%s · Molecular',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: 'Chris West' }],
  creator: 'Chris West',
  publisher: 'Molecular',
  keywords: [
    'chemistry',
    'periodic table',
    '3D chemistry',
    'molecular visualization',
    'chemistry education',
    'chemistry simulator',
    'interactive chemistry',
    'atoms and molecules',
    'chemical reactions',
    'science education',
    'STEM',
    'AI tutor',
  ],
  category: 'education',
  // Default robots policy — index everything, follow links, allow rich
  // snippets. Routes that need different behavior (e.g. /s/[hash])
  // override this in their own metadata.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  // Both icon files live in /public and are referenced by absolute root
  // paths. Browsers auto-request /favicon.ico; iOS reads apple-touch-icon
  // for the home-screen install icon.
  icons: {
    icon: '/favicon.ico',
    apple: '/applogo.png',
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    images: [{ url: '/applogo.png', alt: 'Molecular' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/applogo.png'],
  },
}

// Theme color matches the dark page background so mobile browsers
// (iOS Safari address bar, Android Chrome status bar) tint to the app
// shell instead of system white.
export const viewport: Viewport = {
  themeColor: '#07051a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      <body className="bg-[#07051a] text-[#dffaff] antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
