import type { Metadata } from 'next'
import type { ReactNode } from 'react'

/**
 * Shared-scene routes (/s/[hash]) are private, user-generated payloads
 * — every URL is a unique encoded snapshot, not durable content. Block
 * crawlers from indexing them so search results don't fill up with
 * one-off share links.
 *
 * The page itself is a client component, so this layout is the
 * canonical place to attach route-scoped metadata.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function SharedSceneLayout({ children }: { children: ReactNode }) {
  return children
}
