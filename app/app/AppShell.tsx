'use client'

import { ArrowUp, Share2, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { freeCapacity } from '@/src/chem/rules'
import type { AtomId } from '@/src/chem/types'
import { useStore } from '@/src/store'
import type { Mode } from '@/src/store/sceneSlice'
import { Inspector } from '@/src/ui/Inspector'
import { LabToolbar } from '@/src/ui/LabToolbar'
import { LibraryBrowser } from '@/src/ui/LibraryBrowser'
import { ModeSwitcher } from '@/src/ui/ModeSwitcher'
import { PeriodicSidebar } from '@/src/ui/PeriodicSidebar'
import { TutorPanel } from '@/src/ui/TutorPanel'
import { ValidityBar } from '@/src/ui/ValidityBar'
import { AppScene } from './AppScene'

const VALID_MODES = new Set<Mode>(['explore', 'build', 'lab'])

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [tutorOpen, setTutorOpen] = useState(false)
  const [shareToast, setShareToast] = useState<string | null>(null)
  const mode = useStore((s) => s.scene.mode)
  const resetScene = useStore((s) => s.resetScene)
  const clearHeld = useStore((s) => s.clearHeld)
  const setSelection = useStore((s) => s.setSelection)
  const connectingFromAtomId = useStore((s) => s.build.connectingFromAtomId)
  const cancelConnecting = useStore((s) => s.cancelConnecting)
  const sceneAtoms = useStore((s) => s.scene.atoms)
  const sceneBonds = useStore((s) => s.scene.bonds)
  const setMode = useStore((s) => s.setMode)

  // Hydrate mode from ?mode=... whenever the query param changes. Uses
  // Next.js `useSearchParams` (reactive) instead of `window.location` so
  // client-side navigations from another route (e.g. clicking "Build" on
  // the homepage → /app?mode=build) actually flip the mode — reading
  // `window.location.search` directly was stale on those transitions.
  const searchParams = useSearchParams()
  useEffect(() => {
    const requested = searchParams.get('mode')
    if (requested && VALID_MODES.has(requested as Mode)) {
      const current = useStore.getState().scene.mode
      if (current !== requested) setMode(requested as Mode)
    }
  }, [searchParams, setMode])

  // Write-side: any time mode changes, replace the URL's ?mode= without
  // navigating (history.replaceState avoids a Next.js route transition).
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('mode') === mode) return
    url.searchParams.set('mode', mode)
    window.history.replaceState(null, '', url.toString())
  }, [mode])

  // While in connecting mode, check whether any OTHER atom in the scene still
  // has a free bond slot. If not, the banner shifts from the cyan "tap another
  // atom" prompt to a red explanation — there is nothing to connect to.
  const hasAvailableConnectTarget =
    connectingFromAtomId !== null &&
    Object.values(sceneAtoms).some(
      (a) =>
        a.id !== connectingFromAtomId && freeCapacity(a.id as AtomId, sceneAtoms, sceneBonds) >= 1,
    )

  function handleClear() {
    clearHeld()
    resetScene()
  }

  // Global Esc → cancel connecting → drop held → deselect.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      const state = useStore.getState()
      if (state.build.connectingFromAtomId !== null) {
        cancelConnecting()
        e.preventDefault()
        return
      }
      if (state.build.heldZ !== null) {
        clearHeld()
        e.preventDefault()
        return
      }
      if (state.scene.selection) {
        setSelection(null)
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [clearHeld, setSelection, cancelConnecting])

  return (
    <div className="relative h-dvh w-screen overflow-hidden">
      {/* Full-bleed 3D scene. .scene-shift-portrait translates the canvas
          up ~8dvh on mobile portrait so the bottom Elements/Molecules
          drawer trigger + validity bar don't crop the working scene. */}
      <div className="scene-shift-portrait absolute inset-0">
        <AppScene />
      </div>

      {/* Top toolbar — mode switcher + Clear (Build/Lab only) + Info + Share.
          The Tutor button moved out to a circular FAB at lower-left, so the
          remaining three pills fit in a single row on mobile next to the
          now-vertical ModeSwitcher. */}
      <header className="absolute top-0 right-0 left-0 z-10 flex items-start justify-between gap-2 px-4 py-3 sm:items-center">
        <ModeSwitcher />
        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          {mode !== 'explore' && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear scene"
              className="button-glow inline-flex min-h-[40px] items-center gap-1 rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white transition-transform hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #ff7a8c 0%, #ec59b6 100%)' }}
            >
              Clear
            </button>
          )}
          <Dialog open={inspectorOpen} onOpenChange={setInspectorOpen}>
            <DialogTrigger
              render={
                <button
                  type="button"
                  className="button-glow inline-flex min-h-[40px] items-center gap-1 rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white transition-transform hover:scale-105 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #5cc6ff 0%, #3a2e7a 100%)' }}
                >
                  Info
                </button>
              }
            />
            <DialogContent
              showCloseButton
              className="max-h-[80vh] w-[85vw] border-[#5cc6ff]/40 bg-black/75 p-0 text-[#dffaff] shadow-[0_0_60px_rgba(92,198,255,0.25)] backdrop-blur lg:w-[50vw]"
              style={{ maxWidth: 600 }}
            >
              {/* modal-glow wraps the visible content so pseudo-elements can
                  extend beyond it (overflow must stay visible here). */}
              <div className="modal-glow rounded-xl">
                {/* Third halo layer — large soft drifting blob behind the
                    two rotating conic gradients, breaks the rectangle outline. */}
                <span className="modal-glow-blob" aria-hidden />
                {/* Inner shell sits ABOVE the rotating pseudo-element halo in
                    the modal-glow stacking context. Its solid dark background
                    hides the glow inside the modal — the halo only shows
                    bleeding past its edges. */}
                <div className="relative overflow-hidden rounded-xl bg-black/90">
                  {/* Branded header with gradient bar */}
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(92,198,255,0.18) 0%, rgba(236,89,182,0.18) 60%, rgba(255,217,122,0.12) 100%)',
                      borderBottom: '1px solid rgba(92,198,255,0.25)',
                    }}
                  >
                    <DialogTitle className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#dffaff]">
                      Molecule Info
                    </DialogTitle>
                  </div>
                  {/* Inspector scrolls inside the dialog */}
                  <div className="max-h-[calc(80vh-3rem)] overflow-y-auto">
                    <Inspector />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {/* Share — encodes the current scene as a short URL hash and copies
              a /s/<hash> link to clipboard. Pako compresses heavily so even
              large scenes fit comfortably in a URL. */}
          <button
            type="button"
            onClick={async () => {
              const state = useStore.getState()
              const [{ encodeToHash }, { serializeScene }] = await Promise.all([
                import('@/src/lib/shareUrl'),
                import('@/src/lib/serializeScene'),
              ])
              // Pack the scene JSON together with the user's current camera
              // view (if we've captured one) so the recipient lands looking
              // at the same angle / zoom the sender chose — useful for a
              // teacher drawing attention to a specific bond or atom.
              const payload = JSON.stringify({
                scene: serializeScene(state.scene),
                view: state.view.currentView,
              })
              const hash = encodeToHash(payload)
              const url = `${window.location.origin}/s/${hash}`
              try {
                await navigator.clipboard.writeText(url)
                setShareToast('Share link copied to clipboard')
              } catch {
                setShareToast(url)
              }
              setTimeout(() => setShareToast(null), 2400)
            }}
            aria-label="Share scene"
            className="button-glow inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #a4ff8c 0%, #5cc6ff 100%)' }}
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Tutor — streaming AI chat keyed to the current scene + tier + mode.
          Floating circular icon button at lower-left, sitting just above
          the bottom drawer panel. Distinct gold/magenta gradient + sparkle
          icon so it reads as "AI helper" rather than another header pill. */}
      <Sheet open={tutorOpen} onOpenChange={setTutorOpen}>
        <SheetTrigger
          render={
            <button
              type="button"
              aria-label="Open chemistry tutor"
              className="button-glow absolute bottom-16 left-3 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full text-white shadow-[0_4px_20px_rgba(236,89,182,0.45)] transition-transform hover:scale-110 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #ffd97a 0%, #ec59b6 100%)' }}
            >
              <Sparkles className="h-5 w-5" />
            </button>
          }
        />
        <SheetContent
          side="bottom"
          style={{ height: '60vh', maxHeight: '60vh' }}
          className="flex flex-col gap-0 overflow-hidden border-[#5cc6ff]/40 bg-[#0d0a22] p-0 text-[#dffaff]"
        >
          <SheetTitle className="shrink-0 border-[#2a2655] border-b px-4 py-3 text-xs font-extrabold uppercase tracking-[0.25em] text-[#dffaff]">
            Chemistry tutor
          </SheetTitle>
          <div className="min-h-0 flex-1">
            <TutorPanel />
          </div>
        </SheetContent>
      </Sheet>

      {/* Share toast — small confirmation pill near the top after the user
          taps Share. Auto-dismisses after a couple of seconds. */}
      {shareToast && (
        <div className="pointer-events-none absolute top-16 right-0 left-0 z-20 flex justify-center px-4">
          <div className="pointer-events-auto max-w-[90vw] truncate rounded-full border border-[#a4ff8c]/50 bg-[#0d0a22]/95 px-4 py-2 text-[#dffaff] text-xs shadow-[0_0_18px_rgba(164,255,140,0.35)] backdrop-blur">
            {shareToast}
          </div>
        </div>
      )}

      {/* Connecting-mode banner — appears below the top toolbar while the user
          is picking a second atom to bond. Pink "tap another atom" when at
          least one valid target exists; red "no free valence" when nothing
          in the scene can accept another bond. */}
      {connectingFromAtomId !== null && (
        <div className="pointer-events-none absolute top-16 right-0 left-0 z-10 flex justify-center px-4">
          {hasAvailableConnectTarget ? (
            <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-[#ec59b6]/60 bg-[#0d0a22]/95 px-4 py-2 text-xs shadow-[0_0_24px_rgba(236,89,182,0.45)] backdrop-blur">
              <span className="font-extrabold uppercase tracking-wider text-[#dffaff]">
                Tap another atom to connect
              </span>
              <button
                type="button"
                onClick={cancelConnecting}
                className="min-h-[28px] rounded-full bg-[#14112e] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9aa0c8] hover:bg-[#1a163a] hover:text-[#dffaff]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="pointer-events-auto flex items-center gap-3 rounded-md border border-[#ff7a7a]/70 bg-[#2a0d15]/95 px-4 py-2 text-xs shadow-[0_0_24px_rgba(255,122,122,0.45)] backdrop-blur">
              <span className="font-extrabold uppercase tracking-wider text-[#ffb8b8]">
                No atoms have free valence to bond
              </span>
              <button
                type="button"
                onClick={cancelConnecting}
                className="min-h-[28px] rounded-md bg-[#5a1f1f] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#ffb8b8] hover:bg-[#6f2929]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bottom drawer — Library + validity bar peek */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <button
            type="button"
            aria-label={mode === 'build' ? 'Open elements palette' : 'Open molecule library'}
            className="absolute right-0 bottom-0 left-0 z-10 flex items-center justify-between gap-3 bg-[#0d0a22]/95 px-2 py-2 text-left backdrop-blur"
          >
            <ValidityBar />
            <span
              className="button-glow inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2 text-sm font-extrabold uppercase tracking-wider text-white transition-transform hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
              }}
            >
              {mode === 'build' ? 'Elements' : 'Molecules'}
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            </span>
          </button>
        </DrawerTrigger>
        {/* DrawerContent carries the solid bg so the vaul drag-handle area
            at the top reads as part of the panel. The modal-glow halo was
            removed from this drawer — its `inset: -36px` pseudo-elements
            were bleeding INTO the handle area on top of DrawerContent's
            background, making the handle band look tinted/transparent. The
            library panel is information-dense; the halo wasn't adding
            anything and was actively competing with the molecule rows. */}
        <DrawerContent className="border-[#5cc6ff]/40 bg-black">
          <DrawerTitle className="sr-only">
            {mode === 'build' ? 'Periodic Table' : 'Molecule Library'}
          </DrawerTitle>
          <div className="relative flex h-[70vh] min-h-0 flex-col overflow-hidden rounded-t-xl bg-black">
            {mode === 'build' ? (
              <PeriodicSidebar onPick={() => setDrawerOpen(false)} />
            ) : (
              <LibraryBrowser onPick={() => setDrawerOpen(false)} />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Lab-mode toolbar: spawn reactants + run reactions + view log. */}
      {mode === 'lab' && <LabToolbar />}
    </div>
  )
}
