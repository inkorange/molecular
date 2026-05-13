import { streamText } from 'ai'
import { z } from 'zod'

// Default Vercel runtime (Fluid Compute / Node). Edge isn't needed —
// streamText handles SSE buffering itself, and Node lets us use the
// standard Vercel AI Gateway resolution without bundler quirks.
export const runtime = 'nodejs'

const PayloadSchema = z.object({
  sceneSummary: z.string().max(4000),
  tier: z.enum(['beginner', 'standard', 'advanced']),
  mode: z.enum(['explore', 'build', 'lab']),
  question: z.string().min(1).max(500),
})

function systemPrompt(tier: 'beginner' | 'standard' | 'advanced') {
  const base = `You are a friendly, accurate chemistry tutor inside an educational 3D app called Molecular.
You see the current scene as text and answer the student's question.
Keep responses concise (3-6 sentences). Use plain text, no Markdown.`
  if (tier === 'beginner') {
    return `${base}
This student is in middle / early high school. Use simple analogies. Avoid jargon like "electronegativity" — say "how greedy an atom is for electrons" instead.`
  }
  if (tier === 'standard') {
    return `${base}
Use standard high-school / AP chemistry terms: valence, covalent, ionic, polarity.`
  }
  return `${base}
Use precise college-level terms: electronegativity, hybridization, formal charge, lone pairs.`
}

export async function POST(req: Request) {
  const json = await req.json()
  const parsed = PayloadSchema.safeParse(json)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Bad request', issues: parsed.error.issues }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }

  const { sceneSummary, tier, mode, question } = parsed.data

  // Route through Vercel AI Gateway via provider/model strings — no
  // provider-specific SDK package needed. Beginner tier uses Haiku for
  // snappier streams; the rest use Sonnet for richer chemistry depth.
  const model = tier === 'beginner' ? 'anthropic/claude-haiku-4-5' : 'anthropic/claude-sonnet-4-6'

  const result = streamText({
    model,
    system: systemPrompt(tier),
    prompt: `Mode: ${mode}\n\n${sceneSummary}\n\nStudent question: ${question}`,
  })

  return result.toTextStreamResponse()
}
