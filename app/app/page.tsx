import type { Metadata } from 'next'
import { AppShell } from './AppShell'

const PAGE_TITLE = 'The lab'
const PAGE_DESCRIPTION =
  'The interactive Molecular lab. Drag atoms from the periodic table, snap bonds, run reactions, and ask the AI tutor anything about what you build.'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/app' },
  openGraph: {
    title: `${PAGE_TITLE} · Molecular`,
    description: PAGE_DESCRIPTION,
    url: '/app',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PAGE_TITLE} · Molecular`,
    description: PAGE_DESCRIPTION,
  },
}

export default function AppPage() {
  return <AppShell />
}
