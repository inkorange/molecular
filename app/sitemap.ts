import type { MetadataRoute } from 'next'
import { DEMOS } from '@/src/data/demonstrations'
import { listElementSlugs } from '@/src/data/elementsFull'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * Sitemap. Lists every indexable surface so search engines pick up the
 * demo catalogue + individual demo pages without having to crawl. The
 * share-link namespace (/s/[hash]) is intentionally omitted — those
 * URLs are private and `app/s/layout.tsx` already sets `robots:noindex`.
 *
 * `lastModified` is the build time. Re-generated on every deploy, which
 * is when content actually changes for this static-ish site.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/demo`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/app`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/elements`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ]

  const demoPages: MetadataRoute.Sitemap = DEMOS.map((d) => ({
    url: `${SITE_URL}/demo/${d.id}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const elementPages: MetadataRoute.Sitemap = listElementSlugs().map((slug) => ({
    url: `${SITE_URL}/elements/${slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticPages, ...demoPages, ...elementPages]
}
