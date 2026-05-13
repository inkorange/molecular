import type { Metadata } from 'next'
import './globals.css'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import { ServiceWorkerRegister } from './sw-register'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Molecular — Build the periodic table in 3D',
  description:
    'An immersive 3D web app for students to browse, build, and experiment with atoms, molecules, and reactions.',
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
