import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getElementContent } from '@/src/data/elementsContent'
import { getPeriodicElementBySlug } from '@/src/data/elementsFull'
import { ElementsExplorer } from '@/src/elements/ElementsExplorer'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const element = getPeriodicElementBySlug(slug)
  if (!element) {
    return { title: 'Element not found', robots: { index: false, follow: false } }
  }
  const content = getElementContent(element.Z)
  const description = content.everydayExamples
    ? `${element.name} (${element.symbol}, atomic number ${element.Z}). ${content.everydayExamples}`
    : `${element.name} (${element.symbol}) — atomic number ${element.Z}, atomic mass ${element.mass}. Explore the atom in interactive 3D.`
  return {
    title: `${element.name} (${element.symbol})`,
    description,
    alternates: { canonical: `/elements/${slug}` },
    openGraph: {
      title: `${element.name} (${element.symbol}) · Molecular`,
      description,
      url: `/elements/${slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${element.name} (${element.symbol}) · Molecular`,
      description,
    },
  }
}

export default async function ElementDetailPage({ params }: PageProps) {
  const { slug } = await params
  const element = getPeriodicElementBySlug(slug)
  if (!element) notFound()

  // schema.org LearningResource for richer search results.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: `${element.name} (${element.symbol})`,
    description: `Atomic number ${element.Z}, mass ${element.mass}. Interactive 3D visualization of the atom.`,
    educationalUse: ['Exploration', 'Demonstration'],
    learningResourceType: 'Interactive 3D Simulation',
    about: { '@type': 'Thing', name: `Chemical element: ${element.name}` },
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: ['student', 'teacher'],
    },
    isAccessibleForFree: true,
  }

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted constant JSON-LD payload
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ElementsExplorer initialSlug={slug} />
    </>
  )
}
