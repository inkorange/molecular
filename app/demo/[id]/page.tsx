import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDemonstration } from '@/src/data/demonstrations'
import { DemoPlayer } from '@/src/demo/DemoPlayer'

type Level = 'elementary' | 'advanced'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ level?: string }>
}

const REACTION_TYPE_LABEL: Record<string, string> = {
  synthesis: 'synthesis',
  combustion: 'combustion',
  decomposition: 'decomposition',
  neutralization: 'neutralization',
  displacement: 'displacement',
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const demo = getDemonstration(id)
  if (!demo) {
    return {
      title: 'Demonstration not found',
      robots: { index: false, follow: false },
    }
  }
  const reactionType = REACTION_TYPE_LABEL[demo.reactionType] ?? demo.reactionType
  const description = `${demo.summary} An interactive 3D ${reactionType} reaction demonstration with step-by-step animation.`
  return {
    title: demo.title,
    description,
    keywords: [
      demo.title,
      `${reactionType} reaction`,
      `${reactionType} chemistry`,
      'chemistry demonstration',
      'chemistry for students',
      '3D chemistry',
      'reaction animation',
    ],
    alternates: { canonical: `/demo/${demo.id}` },
    openGraph: {
      title: `${demo.title} · Molecular`,
      description,
      url: `/demo/${demo.id}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${demo.title} · Molecular`,
      description,
    },
  }
}

export default async function DemoPlayerPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { level: rawLevel } = await searchParams

  const demo = getDemonstration(id)
  if (!demo) notFound()

  const level: Level = rawLevel === 'advanced' ? 'advanced' : 'elementary'

  // schema.org LearningResource — tells Google this URL is an educational
  // demo with a specific topic and audience, eligible for rich results
  // in the "Education" panel.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: demo.title,
    description: demo.summary,
    educationalUse: ['Demonstration'],
    learningResourceType: 'Interactive 3D Simulation',
    about: { '@type': 'Thing', name: `${REACTION_TYPE_LABEL[demo.reactionType]} reaction` },
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
      <DemoPlayer demo={demo} initialLevel={level} />
    </>
  )
}
