import { produce } from 'immer'
import type { StateCreator } from 'zustand'

export interface TutorMessage {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

export interface TutorSliceState {
  tutor: {
    messages: TutorMessage[]
    /** True while a streaming response is in flight. Used to disable the
     *  composer + suggestion buttons so the user can't pile up requests. */
    streaming: boolean
  }
}

export interface TutorSliceActions {
  addTutorMessage: (m: TutorMessage) => void
  /** Append a streamed chunk to the most recent message in the log. The
   *  assistant placeholder message is created up front and grown in-place
   *  as tokens arrive. */
  appendToLast: (chunk: string) => void
  setStreaming: (v: boolean) => void
  clearTutor: () => void
}

export type TutorSlice = TutorSliceState & TutorSliceActions

export const createTutorSlice: StateCreator<TutorSlice> = (set) => ({
  tutor: { messages: [], streaming: false },
  addTutorMessage: (m) =>
    set(
      produce<TutorSlice>((s) => {
        s.tutor.messages.push(m)
      }),
    ),
  appendToLast: (chunk) =>
    set(
      produce<TutorSlice>((s) => {
        const last = s.tutor.messages[s.tutor.messages.length - 1]
        if (last) last.content += chunk
      }),
    ),
  setStreaming: (v) =>
    set(
      produce<TutorSlice>((s) => {
        s.tutor.streaming = v
      }),
    ),
  clearTutor: () =>
    set(
      produce<TutorSlice>((s) => {
        s.tutor.messages = []
      }),
    ),
})
