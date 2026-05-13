import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDemonstration } from '@/src/data/demonstrations'
import { DemoPlayer } from '@/src/demo/DemoPlayer'

type Level = 'elementary' | 'advanced'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ level?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const demo = getDemonstration(id)
  if (!demo) return { title: 'Demonstration · Molecular' }
  return {
    title: `${demo.title} · Molecular`,
    description: demo.summary,
  }
}

export default async function DemoPlayerPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { level: rawLevel } = await searchParams

  const demo = getDemonstration(id)
  if (!demo) notFound()

  const level: Level = rawLevel === 'advanced' ? 'advanced' : 'elementary'

  return <DemoPlayer demo={demo} initialLevel={level} />
}
