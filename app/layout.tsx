import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Molecular — Build the periodic table in 3D',
  description:
    'An immersive 3D web app for students to browse, build, and experiment with atoms, molecules, and reactions.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#07051a] text-[#dffaff] antialiased">{children}</body>
    </html>
  )
}
