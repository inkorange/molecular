import type { Metadata } from 'next'
import './globals.css'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import { ServiceWorkerRegister } from './sw-register'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

const SITE_NAME = 'Molecular'
const SITE_TITLE = 'Molecular — Build the periodic table in 3D'
const SITE_DESCRIPTION =
  'An immersive 3D web app for students to browse, build, and experiment with atoms, molecules, and reactions.'

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
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
    images: [{ url: '/applogo.png', alt: 'Molecular' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/applogo.png'],
  },
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
