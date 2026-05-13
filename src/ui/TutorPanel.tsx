'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
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
}

/**
 * Streaming tutor chat. Sends the current scene summary + mode/tier/question
 * to `/api/tutor`, then reads chunks off the response body and grows the
 * placeholder assistant message in place. Suggestion chips below the
 * messages switch with the current mode so prompts feel relevant.
 */
export function TutorPanel() {
  const messages = useStore((s) => s.tutor.messages)
  const streaming = useStore((s) => s.tutor.streaming)
  const tier = useStore((s) => s.scene.tier)
  const mode = useStore((s) => s.scene.mode)
  const addTutorMessage = useStore((s) => s.addTutorMessage)
  const appendToLast = useStore((s) => s.appendToLast)
  const setStreaming = useStore((s) => s.setStreaming)
  const clearTutor = useStore((s) => s.clearTutor)
  const [question, setQuestion] = useState('')
  const messagesRef = useRef<HTMLDivElement>(null)

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

    const sceneSummary = sceneToPrompt(useStore.getState().scene)
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneSummary, tier, mode, question: q }),
      })
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
          {(SUGGESTIONS[mode] ?? []).map((s) => (
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
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask the tutor…"
            disabled={streaming}
            className="border-[#2a2655] bg-[#14112e] text-[#dffaff] placeholder:text-[#6a6f95]"
          />
          <Button
            type="submit"
            disabled={streaming || !question.trim()}
            size="sm"
            className="min-h-[40px] bg-[#5cc6ff] font-bold text-[#07051a] hover:bg-[#80d4ff]"
          >
            Ask
          </Button>
        </form>
      </div>
    </div>
  )
}
