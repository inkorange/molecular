'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { sceneToPrompt } from '@/src/lib/sceneToPrompt'
import { useStore } from '@/src/store'

const SUGGESTIONS: Record<string, string[]> = {
  explore: [
    'What is this molecule used for?',
    'Why does this shape matter?',
    'How is this molecule made in nature?',
  ],
  build: [
    "Why didn't this bond form?",
    'What molecule am I making?',
    'What atom should I add next for water?',
  ],
  lab: ['What just happened?', 'Why did this release energy?', 'What else could I try?'],
  demo: [
    'Why does this reaction work?',
    'What real-world use does this have?',
    'Where does the energy come from?',
  ],
}

type TutorMode = 'explore' | 'build' | 'lab' | 'demo'
type TutorTier = 'beginner' | 'standard' | 'advanced'

interface TutorPanelProps {
  /** Override the context summary sent as `sceneSummary` to the API.
   *  Used by the /demo player where the "scene" is a curated
   *  demonstration (title + reaction + current step) rather than an
   *  ad-hoc scene from the sandbox. When omitted, the panel falls
   *  back to deriving a summary from the store. */
  contextSummary?: string
  /** Override the mode tag sent to the API. Demo player sends 'demo'. */
  mode?: TutorMode
  /** Override the tier sent to the API. Demo player maps its
   *  `elementary | advanced` audience setting to beginner | advanced. */
  tier?: TutorTier
  /** Override the suggestion chips. When omitted, falls back to the
   *  mode-keyed defaults in SUGGESTIONS above. */
  suggestions?: readonly string[]
}

/**
 * Streaming tutor chat. Sends a context summary + mode/tier/question to
 * `/api/tutor`, then reads chunks off the response body and grows the
 * placeholder assistant message in place. Suggestion chips below the
 * messages adapt to the mode (or to an explicit `suggestions` prop)
 * so prompts feel relevant.
 *
 * Props are all OPTIONAL — when omitted, the panel derives everything
 * from the global store (sandbox flow). Demo pages override every prop
 * because they don't share the sandbox store's `scene.mode/tier`.
 */
export function TutorPanel({ contextSummary, mode, tier, suggestions }: TutorPanelProps = {}) {
  const messages = useStore((s) => s.tutor.messages)
  const streaming = useStore((s) => s.tutor.streaming)
  const storeTier = useStore((s) => s.scene.tier)
  const storeMode = useStore((s) => s.scene.mode)
  const addTutorMessage = useStore((s) => s.addTutorMessage)
  const appendToLast = useStore((s) => s.appendToLast)
  const setStreaming = useStore((s) => s.setStreaming)
  const clearTutor = useStore((s) => s.clearTutor)
  const [question, setQuestion] = useState('')
  const messagesRef = useRef<HTMLDivElement>(null)

  // Resolved values — prop wins over store. Lets the same component
  // serve both the sandbox (store-driven) and the demo player (prop-driven).
  const effectiveMode: TutorMode = mode ?? storeMode
  const effectiveTier: TutorTier = tier ?? storeTier
  const effectiveSuggestions: readonly string[] =
    suggestions ?? SUGGESTIONS[effectiveMode] ?? SUGGESTIONS.explore ?? []

  // Auto-scroll the message list to the bottom on every update — keeps the
  // currently-streaming token visible without the user chasing it. We
  // intentionally depend on `messages` reference (not just .length) so that
  // appendToLast mutations during streaming also trigger a scroll.
  // biome-ignore lint/correctness/useExhaustiveDependencies: effect body uses the ref, not messages directly
  useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  async function ask(q: string) {
    if (!q.trim() || streaming) return
    addTutorMessage({ role: 'user', content: q, ts: Date.now() })
    // Placeholder assistant message that we'll fill in chunk-by-chunk.
    addTutorMessage({ role: 'assistant', content: '', ts: Date.now() })
    setStreaming(true)
    setQuestion('')

    // Caller-provided context (demo player) takes precedence; otherwise
    // derive from the sandbox store.
    const sceneSummary = contextSummary ?? sceneToPrompt(useStore.getState().scene)
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneSummary,
          tier: effectiveTier,
          mode: effectiveMode,
          question: q,
        }),
      })
      if (res.status === 429) {
        const retry = res.headers.get('retry-after')
        const wait = retry ? ` Try again in ${retry}s.` : ''
        appendToLast(`Rate limit reached (10 questions per minute).${wait}`)
        return
      }
      if (!res.ok || !res.body) {
        appendToLast('\n[Error fetching response]')
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        appendToLast(decoder.decode(value))
      }
    } catch {
      appendToLast('\n[Network error]')
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={messagesRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-[#6a6f95]">
            Ask the tutor anything about the current scene. Suggestions below adapt to your mode.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: messages are append-only; user-vs-assistant pairs can share a ts
            key={`${m.role}-${m.ts}-${i}`}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[85%] rounded-md bg-[#3a2e7a]/40 px-3 py-2 text-sm text-[#dffaff]'
                : 'mr-auto max-w-[95%] rounded-md bg-[#14112e] px-3 py-2 text-sm text-[#dffaff]'
            }
          >
            {m.content || (streaming && i === messages.length - 1 ? '…' : '')}
          </div>
        ))}
      </div>
      <div className="border-[#2a2655] border-t p-3">
        <div className="mb-2 flex flex-wrap gap-1">
          {effectiveSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              disabled={streaming}
              className="min-h-[28px] rounded-full bg-[#14112e] px-3 py-1 text-[11px] text-[#9aa0c8] transition-colors hover:bg-[#1a163a] hover:text-[#dffaff] disabled:opacity-50"
            >
              {s}
            </button>
          ))}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearTutor}
              disabled={streaming}
              className="ml-auto min-h-[28px] rounded-full border border-[#ff7a7a]/30 bg-transparent px-3 py-1 text-[11px] text-[#ff7a7a] transition-colors hover:bg-[#5a1f1f]/30 disabled:opacity-50"
            >
              Clear chat
            </button>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask(question)
          }}
          className="flex gap-2"
        >
          {/* Input matches the rest of the app's pill vocabulary —
              rounded-full, min-h-[40px], same height as the submit
              button so they sit on a single visual baseline. */}
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask the tutor…"
            disabled={streaming}
            className="h-10 min-h-[40px] flex-1 rounded-full border-[#2a2655] bg-[#14112e] px-4 text-[#dffaff] placeholder:text-[#6a6f95]"
          />
          {/* Submit — same gradient pill the global header CTAs use
              ("Open the lab", etc.) so the action reads as primary. */}
          <button
            type="submit"
            disabled={streaming || !question.trim()}
            className="button-glow inline-flex min-h-[40px] items-center justify-center rounded-full px-5 py-1.5 font-extrabold text-white text-xs uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
            style={{
              background: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
            }}
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  )
}
