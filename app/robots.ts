import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * Crawler policy. Index the marketing + content surface (home, demo
 * picker, individual demos, the interactive app shell); explicitly
 * block the share-link namespace so search results don't fill up with
 * one-off shared scenes. Sitemap pointer helps crawlers find every
 * demo page without crawling links.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/s/', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
