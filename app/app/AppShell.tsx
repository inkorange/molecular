'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Inspector } from '@/src/ui/Inspector'
import { LibraryBrowser } from '@/src/ui/LibraryBrowser'
import { ModeSwitcher } from '@/src/ui/ModeSwitcher'
import { ValidityBar } from '@/src/ui/ValidityBar'
import { AppScene } from './AppScene'

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  return (
    <div className="relative h-dvh w-screen overflow-hidden">
      {/* Full-bleed 3D scene */}
      <div className="absolute inset-0">
        <AppScene />
      </div>

      {/* Top toolbar — mode switcher + Info button */}
      <header className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between px-4 py-3">
        <ModeSwitcher />
        <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[36px] bg-[#14112e]/80 text-[#dffaff] hover:bg-[#1a163a]"
              >
                Info
              </Button>
            }
          />
          <SheetContent
            side="top"
            className="max-h-[70vh] border-[#2a2655] bg-[#0d0a22] text-[#dffaff]"
          >
            <SheetTitle className="sr-only">Molecule Info</SheetTitle>
            <Inspector />
          </SheetContent>
        </Sheet>
      </header>

      {/* Bottom drawer — Library + validity bar peek */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <button
            type="button"
            className="absolute right-0 bottom-0 left-0 z-10 flex items-center justify-between bg-[#0d0a22]/95 px-4 py-2 text-left backdrop-blur"
          >
            <ValidityBar />
            <span className="text-xs text-[#8d92b8]">Library ↑</span>
          </button>
        </DrawerTrigger>
        <DrawerContent className="border-[#2a2655] bg-[#0d0a22]">
          <DrawerTitle className="sr-only">Molecule Library</DrawerTitle>
          <div className="flex h-[70vh] min-h-0 flex-col overflow-hidden">
            <LibraryBrowser onPick={() => setDrawerOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
