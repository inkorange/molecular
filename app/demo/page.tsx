import type { Metadata } from 'next'
import { DemoPicker } from '@/src/demo/DemoPicker'

export const metadata: Metadata = {
  title: 'Demonstrations · Molecular',
  description:
    'Pick a chemistry demonstration to play. Step-by-step reactions with animation effects keyed to the reaction type — synthesis, combustion, decomposition, neutralization, and displacement.',
}

export default function DemoIndexPage() {
  return <DemoPicker />
}
