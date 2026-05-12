'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { freeCapacity } from '@/src/chem/rules'
import type { AtomId } from '@/src/chem/types'
import { useStore } from '@/src/store'
import { Inspector } from '@/src/ui/Inspector'
import { LibraryBrowser } from '@/src/ui/LibraryBrowser'
import { ModeSwitcher } from '@/src/ui/ModeSwitcher'
import { PeriodicSidebar } from '@/src/ui/PeriodicSidebar'
import { ValidityBar } from '@/src/ui/ValidityBar'
import { AppScene } from './AppScene'

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const mode = useStore((s) => s.scene.mode)
  const resetScene = useStore((s) => s.resetScene)
  const clearHeld = useStore((s) => s.clearHeld)
  const setSelection = useStore((s) => s.setSelection)
  const connectingFromAtomId = useStore((s) => s.build.connectingFromAtomId)
  const cancelConnecting = useStore((s) => s.cancelConnecting)
  const sceneAtoms = useStore((s) => s.scene.atoms)
  const sceneBonds = useStore((s) => s.scene.bonds)

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
      {/* Full-bleed 3D scene */}
      <div className="absolute inset-0">
        <AppScene />
      </div>

      {/* Top toolbar — mode switcher + Clear (Build/Lab only) + Info button */}
      <header className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between px-4 py-3">
        <ModeSwitcher />
        <div className="flex items-center gap-2">
          {mode !== 'explore' && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear scene"
              className="inline-flex min-h-[40px] items-center gap-1 rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_0_18px_rgba(255,122,140,0.45)] transition-transform hover:scale-105 active:scale-95"
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
                  className="inline-flex min-h-[40px] items-center gap-1 rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_0_18px_rgba(92,198,255,0.45)] transition-transform hover:scale-105 active:scale-95"
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
        </div>
      </header>

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
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2 text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(236,89,182,0.55)] transition-transform hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
              }}
            >
              {mode === 'build' ? 'Elements' : 'Molecules'}
              <span className="text-base leading-none">↑</span>
            </span>
          </button>
        </DrawerTrigger>
        <DrawerContent className="border-[#5cc6ff]/40 bg-transparent">
          <DrawerTitle className="sr-only">
            {mode === 'build' ? 'Periodic Table' : 'Molecule Library'}
          </DrawerTitle>
          {/* modal-glow wraps the drawer body so the rotating halo bleeds
              above the drawer's top edge into the scene area. */}
          <div className="modal-glow rounded-t-xl">
            <span className="modal-glow-blob" aria-hidden />
            <div className="relative flex h-[70vh] min-h-0 flex-col overflow-hidden rounded-t-xl bg-black/90">
              {mode === 'build' ? (
                <PeriodicSidebar onPick={() => setDrawerOpen(false)} />
              ) : (
                <LibraryBrowser onPick={() => setDrawerOpen(false)} />
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
