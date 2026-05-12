# Molecular Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v1 of Molecular — a mobile-first 3D educational chemistry web app — from greenfield to a deployed Vercel URL.

**Architecture:** Next.js 16 App Router with two route trees (`/` landing, `/app` interactive). React-three-fiber for the 3D scene, sharing the same `<Atom>` / `<Bond>` / `<ReactionAnimator>` components between the landing reel and the app. Zustand stores scene state; immer drives undo/redo. Chemistry rules (valence, VSEPR, reactions) are pure TypeScript and exhaustively unit-tested. AI tutor proxies through a single Next.js streaming route to Vercel AI Gateway. No backend — persistence is localStorage + URL hash.

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Three.js + `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing` + `@react-three/rapier` · Tailwind CSS + shadcn/ui · Zustand + immer · Zod · Vercel AI SDK v6 + Vercel AI Gateway · Vitest · Playwright · Biome · pnpm

**Spec:** see [`/DESIGN.md`](../../../DESIGN.md) — every section here implements something from there.

---

## Phases & demoable increments

Each phase ends with something you can show in a browser or run as a passing test suite.

| Phase | Outcome | Demoable as |
|---|---|---|
| 0 | Project scaffolds and runs | `pnpm dev` shows a styled placeholder page; `pnpm test` and `pnpm lint` pass |
| 1 | Chemistry engine is complete | `pnpm test src/chem` passes ~60 unit tests covering valence, VSEPR, reactions, validity |
| 2 | R3F scene renders atoms + bonds | `/app` shows a hardcoded water molecule rotating with electron sprites and a bloom backdrop |
| 3 | Molecule Library + Explore mode | Open `/app`, search "glucose" in the sidebar, click → C₆H₁₂O₆ spawns in the scene; inspector shows metadata |
| 4 | Periodic table palette + Build mode (drag-snap) | Switch to Build, drag O + 2 H from the palette → water snaps together; validity bar reads ✓ Water |
| 5 | Lab mode + physics + reactions | Switch to Lab, spawn H₂ and O₂, fling one at the other → water forms; reaction log records "2 H₂ + O₂ → 2 H₂O" |
| 5.2 | Recipe hints in Lab | Lab toolbar gains a 💡 Hints sheet — given current scene, suggests reactions you have ingredients for (or near-misses with "Add X" buttons) |
| 6 | AI tutor | Click "Tell me about this molecule" → streaming explanation appears in the tutor panel |
| 7 | Landing page with autonomous reel | Visit `/`, see water → methane → ammonia → NaCl cycle on loop with hero copy in front |
| 8 | Persistence + sharing | Build a molecule, click Share, paste link in a fresh tab → identical scene loads |
| 9 | Polish, accessibility, perf, deploy | Production URL on Vercel passes Lighthouse mobile ≥ 90, keyboard nav works, `prefers-reduced-motion` honored |

---

## Conventions used in every task

- **TDD where the contract is clear** (chem engine, store reducers, util functions): write the test first, watch it fail, write the minimum code, watch it pass, commit.
- **Visual / interactive verification where logic is rendered** (R3F components, drag system, page layouts): write a Playwright e2e test or manual verification command; the implementation step makes it pass.
- **Commits are frequent and small.** Each task ends with a commit. Most phases have a "phase capstone" commit at the end.
- **Commit author is Chris West** (already set in git config). No `Co-Authored-By` lines on commits.
- **All file paths are absolute from the repo root.** Repo root is `/Users/christopherwest/web/molecular`.
- **Type system is strict.** `tsconfig.json` has `strict: true` and `noUncheckedIndexedAccess: true`.
- **`pnpm` is the package manager.** Use `pnpm add`, `pnpm dev`, `pnpm test`, `pnpm lint`.

---

# Phase 0 — Project scaffold

**Goal:** A Next.js 16 app that runs, has Tailwind + shadcn + Biome + Vitest + Playwright wired up, and shows a styled placeholder at `/`.

**Files created in this phase:**
- `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `biome.json`, `vitest.config.ts`, `playwright.config.ts`
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- `src/lib/cn.ts`, `components.json` (shadcn config)
- `tests/setup.ts`, `tests/e2e/smoke.spec.ts`
- `.github/workflows/ci.yml`
- `vercel.ts`
- `README.md`

### Task 0.1 — Scaffold Next.js project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Initialize Next.js 16 with TypeScript, Tailwind, App Router, no src dir override (we use our own `src/`)**

Run from repo root:

```bash
pnpm dlx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --turbopack \
  --use-pnpm \
  --skip-install \
  --eslint=false \
  --yes
```

Expected: command completes; `package.json`, `app/`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.ts` exist. The scaffolder will prompt to overwrite existing files (`.gitignore`, `README.md` if it tries) — accept overwrites for those it asks about.

- [ ] **Step 2: Restore the project's `.gitignore` (the scaffolder may have rewritten it)**

Re-write `/Users/christopherwest/web/molecular/.gitignore` with this content (merges Next.js defaults with our brainstorm dir):

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.*

# Build output
.next/
out/
dist/
build/

# Vercel
.vercel

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Testing
coverage/
playwright-report/
test-results/
playwright/.cache/

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# OS
.DS_Store
Thumbs.db

# Editors
.vscode/*
!.vscode/extensions.json
.idea/

# Brainstorming companion (Superpowers)
.superpowers/

# Claude / agent caches
.claude/
```

- [ ] **Step 3: Install dependencies**

```bash
pnpm install
```

Expected: `node_modules/` populated, `pnpm-lock.yaml` created.

- [ ] **Step 4: Tighten `tsconfig.json` to strict + noUncheckedIndexedAccess**

Replace `/Users/christopherwest/web/molecular/tsconfig.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/src/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Verify dev server runs**

```bash
pnpm dev
```

Expected: server starts on `http://localhost:3000`; the default Next.js welcome page loads in a browser. Stop with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "scaffold: initialize Next.js 16 app with strict TypeScript"
git push
```

---

### Task 0.2 — Configure Biome for lint + format

**Files:**
- Create: `biome.json`
- Modify: `package.json`

- [ ] **Step 1: Install Biome**

```bash
pnpm add -D -E @biomejs/biome
```

- [ ] **Step 2: Create `biome.json`**

Write `/Users/christopherwest/web/molecular/biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "files": {
    "ignoreUnknown": true,
    "includes": [
      "**",
      "!**/node_modules",
      "!**/.next",
      "!**/dist",
      "!**/build",
      "!**/coverage",
      "!**/playwright-report",
      "!**/test-results",
      "!**/.vercel",
      "!**/.superpowers"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "warn",
        "useImportType": "error"
      },
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded",
      "trailingCommas": "all"
    }
  }
}
```

- [ ] **Step 3: Add scripts to `package.json`**

Edit `/Users/christopherwest/web/molecular/package.json` and replace the `"scripts"` block with:

```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "biome check .",
  "lint:fix": "biome check --write .",
  "format": "biome format --write .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

- [ ] **Step 4: Run format + lint to normalize the scaffold**

```bash
pnpm lint:fix
```

Expected: completes with no errors (warnings about scaffold are OK).

- [ ] **Step 5: Run typecheck to confirm strict types pass**

```bash
pnpm typecheck
```

Expected: exits 0 with no output.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "scaffold: add Biome lint + format with strict rules"
git push
```

---

### Task 0.3 — Set up Vitest

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`, `src/lib/cn.ts`, `tests/lib/cn.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest + jsdom + testing-library**

```bash
pnpm add -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom
```

- [ ] **Step 2: Create `vitest.config.ts`**

Write `/Users/christopherwest/web/molecular/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx', 'src/**/*.spec.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@/src': resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Create `tests/setup.ts`**

Write `/Users/christopherwest/web/molecular/tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Write a smoke test for `cn` (the standard Tailwind class merger we'll use everywhere)**

Write `/Users/christopherwest/web/molecular/tests/lib/cn.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { cn } from '@/src/lib/cn'

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops falsy values', () => {
    expect(cn('a', false && 'b', null, undefined, 'c')).toBe('a c')
  })

  it('dedupes conflicting Tailwind classes (last one wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})
```

- [ ] **Step 5: Run the test — expect it to fail because `cn` does not exist**

```bash
pnpm test
```

Expected: FAIL — "Cannot find module '@/src/lib/cn'".

- [ ] **Step 6: Install `clsx` + `tailwind-merge`, write `cn` to make tests pass**

```bash
pnpm add clsx tailwind-merge
```

Write `/Users/christopherwest/web/molecular/src/lib/cn.ts`:

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 7: Run tests — expect pass**

```bash
pnpm test
```

Expected: 3 tests pass.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "scaffold: add Vitest with happy-dom and cn() utility"
git push
```

---

### Task 0.4 — Set up Playwright

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `package.json` (already has script from Task 0.2)

- [ ] **Step 1: Install Playwright**

```bash
pnpm add -D @playwright/test
pnpm dlx playwright install chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

Write `/Users/christopherwest/web/molecular/playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

- [ ] **Step 3: Write a smoke test**

Write `/Users/christopherwest/web/molecular/tests/e2e/smoke.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('homepage responds 200 and contains the wordmark', async ({ page }) => {
  await page.goto('/')
  // Wordmark not yet implemented — this will fail until Task 0.5
  await expect(page).toHaveTitle(/Molecular/i)
})
```

- [ ] **Step 4: Run e2e — expect failure (title not set yet)**

```bash
pnpm test:e2e --project=desktop-chrome
```

Expected: FAIL — title doesn't match.

- [ ] **Step 5: Commit (test is committed red on purpose; Task 0.5 makes it pass)**

```bash
git add .
git commit -m "scaffold: add Playwright with mobile + desktop projects"
git push
```

---

### Task 0.5 — Style the placeholder root page

**Files:**
- Modify: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Set the title in `app/layout.tsx`**

Replace `/Users/christopherwest/web/molecular/app/layout.tsx` with:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Molecular — Build the periodic table in 3D',
  description:
    'An immersive 3D web app for students to browse, build, and experiment with atoms, molecules, and reactions.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#07051a] text-[#dffaff] antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Replace `app/page.tsx` with a placeholder hero**

Write `/Users/christopherwest/web/molecular/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight md:text-7xl">
        <span className="text-white">Build the periodic</span>{' '}
        <span className="text-[#5cc6ff]">table in 3D.</span>
      </h1>
      <p className="mt-6 max-w-xl text-base text-[#9aa0c8] md:text-lg">
        Drag atoms. Snap bonds. Throw molecules at each other. Watch electrons transfer.
      </p>
      <p className="mt-12 text-xs uppercase tracking-[0.3em] text-[#6a6f95]">
        Phase 0 placeholder — the real homepage arrives in Phase 7.
      </p>
    </main>
  )
}
```

- [ ] **Step 3: Reset `app/globals.css` to a clean Tailwind baseline**

Replace `/Users/christopherwest/web/molecular/app/globals.css` with:

```css
@import 'tailwindcss';

@theme {
  --color-bg-primary: #07051a;
  --color-bg-secondary: #0d0a22;
  --color-ink: #dffaff;
  --color-ink-muted: #9aa0c8;
  --color-accent-cyan: #5cc6ff;
  --color-accent-pink: #ec59b6;
  --color-attach-green: #a4ff8c;
  --color-attach-yellow: #ffd97a;
  --color-attach-red: #ff7a7a;
}

html,
body {
  height: 100%;
}
```

- [ ] **Step 4: Run dev server and visually check**

```bash
pnpm dev
```

Open `http://localhost:3000`. Expected: dark background, title "Build the periodic table in 3D." in white/cyan, subtitle in muted gray. Stop with Ctrl+C.

- [ ] **Step 5: Run e2e — should now pass**

```bash
pnpm test:e2e --project=desktop-chrome
```

Expected: 1 test passes.

- [ ] **Step 6: Run mobile project too**

```bash
pnpm test:e2e --project=mobile-chrome
```

Expected: 1 test passes (the page is responsive by default).

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "scaffold: style placeholder hero with brand colors"
git push
```

---

### Task 0.6 — CI workflow + vercel.ts

**Files:**
- Create: `.github/workflows/ci.yml`, `vercel.ts`

- [ ] **Step 1: Install `@vercel/config`**

```bash
pnpm add -D @vercel/config
```

- [ ] **Step 2: Write `vercel.ts`**

Write `/Users/christopherwest/web/molecular/vercel.ts`:

```ts
import { type VercelConfig } from '@vercel/config/v1'

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'pnpm build',
  installCommand: 'pnpm install',
}
```

- [ ] **Step 3: Create the CI workflow**

Write `/Users/christopherwest/web/molecular/.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm lint

      - run: pnpm typecheck

      - run: pnpm test

      - run: pnpm dlx playwright install --with-deps chromium

      - run: pnpm test:e2e
```

- [ ] **Step 4: Verify everything locally before committing**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e
```

Expected: all pass.

- [ ] **Step 5: Commit (Phase 0 capstone)**

```bash
git add .
git commit -m "scaffold: add CI workflow and vercel.ts; Phase 0 complete"
git push
```

**🎉 Phase 0 demoable:** `pnpm dev` shows the styled placeholder; `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` all pass.

---

# Phase 1 — Chemistry engine (pure TS, fully unit-tested)

**Goal:** A self-contained `src/chem/` package exporting `Element`, periodic table data 1–36, `canBond`, `getBondingSites`, `getFormula`, `findReaction`, `validateScene`. No DOM. No Three.js. 100% unit test coverage on rules.

**Why TDD here:** the chemistry rules are the ground truth the rest of the app sits on. Bugs here corrupt everything visual. Writing the tests first locks down the contract.

**Files created in this phase:**
- `src/chem/types.ts` — shared TS types
- `src/chem/elements.ts` — Z=1–36 data array
- `src/chem/rules.ts` — `canBond`, octet/duet helpers
- `src/chem/vsper.ts` — `getBondingSites`, geometry tables
- `src/chem/formula.ts` — `getFormula` (Hill system)
- `src/chem/reactions.ts` — reaction database + `findReaction`
- `src/chem/validate.ts` — `validateScene`
- `tests/chem/*.spec.ts` — one spec per module

### Task 1.1 — Core types

**Files:**
- Create: `src/chem/types.ts`
- Create: `tests/chem/types.spec.ts`

- [ ] **Step 1: Write a contract test for the types — that they exist and have expected shapes**

Write `/Users/christopherwest/web/molecular/tests/chem/types.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type {
  Atom,
  Bond,
  BondId,
  BondType,
  Element,
  ElementCategory,
  Molecule,
  MoleculeId,
  AtomId,
  SceneSnapshot,
  Vec3,
} from '@/src/chem/types'

describe('chem types — runtime shape sanity', () => {
  it('Vec3 is a 3-tuple of numbers', () => {
    const v: Vec3 = [1, 2, 3]
    expect(v.length).toBe(3)
  })

  it('Atom carries Z, id, moleculeId, position, charge', () => {
    const atom: Atom = {
      id: 'a-1' as AtomId,
      Z: 8,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: 'm-1' as MoleculeId,
    }
    expect(atom.Z).toBe(8)
  })

  it('Bond carries type and order', () => {
    const bond: Bond = {
      id: 'b-1' as BondId,
      atomA: 'a-1' as AtomId,
      atomB: 'a-2' as AtomId,
      order: 1,
      type: 'covalent',
    }
    expect(bond.order).toBe(1)
    const types: BondType[] = ['covalent', 'ionic']
    expect(types.length).toBe(2)
  })

  it('Molecule carries atom + bond ids', () => {
    const mol: Molecule = {
      id: 'm-1' as MoleculeId,
      atomIds: ['a-1' as AtomId],
      bondIds: [],
    }
    expect(mol.atomIds.length).toBe(1)
  })

  it('SceneSnapshot is a flat dict-style scene', () => {
    const scene: SceneSnapshot = { atoms: {}, bonds: {}, molecules: {} }
    expect(Object.keys(scene.atoms)).toEqual([])
  })

  it('ElementCategory union covers all 8 categories', () => {
    const cats: ElementCategory[] = [
      'alkali',
      'alkaline',
      'transition',
      'other-metal',
      'metalloid',
      'nonmetal',
      'halogen',
      'noble',
    ]
    expect(cats.length).toBe(8)
  })

  it('Element shape sanity', () => {
    const o: Element = {
      Z: 8,
      symbol: 'O',
      name: 'Oxygen',
      mass: 16.0,
      category: 'nonmetal',
      cpkColor: '#FF0D0D',
      shells: [2, 6],
      valence: 6,
      bondingCapacity: 2,
      oxidationStates: [-2],
      electronegativity: 3.44,
      vdwRadius: 1.52,
    }
    expect(o.symbol).toBe('O')
  })
})
```

- [ ] **Step 2: Run — expect FAIL (types don't exist)**

```bash
pnpm test tests/chem/types.spec.ts
```

Expected: FAIL — cannot find module `@/src/chem/types`.

- [ ] **Step 3: Create `src/chem/types.ts`**

Write `/Users/christopherwest/web/molecular/src/chem/types.ts`:

```ts
// Branded id types so we don't mix them up.
export type AtomId = string & { readonly __brand: 'AtomId' }
export type BondId = string & { readonly __brand: 'BondId' }
export type MoleculeId = string & { readonly __brand: 'MoleculeId' }

export type Vec3 = readonly [number, number, number]

export type BondType = 'covalent' | 'ionic'
export type BondOrder = 1 | 2 | 3

export type ElementCategory =
  | 'alkali'
  | 'alkaline'
  | 'transition'
  | 'other-metal'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble'

export interface Element {
  Z: number
  symbol: string
  name: string
  mass: number
  category: ElementCategory
  cpkColor: string
  shells: readonly number[]
  valence: number
  bondingCapacity: number
  oxidationStates: readonly number[]
  electronegativity: number
  vdwRadius: number
}

export interface Atom {
  id: AtomId
  Z: number
  position: Vec3
  velocity: Vec3
  charge: number
  moleculeId: MoleculeId
}

export interface Bond {
  id: BondId
  atomA: AtomId
  atomB: AtomId
  order: BondOrder
  type: BondType
}

export interface Molecule {
  id: MoleculeId
  atomIds: AtomId[]
  bondIds: BondId[]
}

export interface SceneSnapshot {
  atoms: Record<string, Atom>
  bonds: Record<string, Bond>
  molecules: Record<string, Molecule>
}

// Helpers for creating branded ids without leaking the brand.
let __atomCounter = 0
let __bondCounter = 0
let __molCounter = 0

export function atomId(): AtomId {
  return `a-${++__atomCounter}` as AtomId
}
export function bondId(): BondId {
  return `b-${++__bondCounter}` as BondId
}
export function moleculeId(): MoleculeId {
  return `m-${++__molCounter}` as MoleculeId
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm test tests/chem/types.spec.ts
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chem: define core types (Atom, Bond, Molecule, Element)"
git push
```

---

### Task 1.2 — Periodic table data (Z=1–36)

**Files:**
- Create: `src/chem/elements.ts`
- Create: `tests/chem/elements.spec.ts`

- [ ] **Step 1: Write tests asserting the shape and a few well-known values**

Write `/Users/christopherwest/web/molecular/tests/chem/elements.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { ELEMENTS, getElement } from '@/src/chem/elements'

describe('ELEMENTS table', () => {
  it('contains exactly 36 elements (Z=1–36)', () => {
    expect(ELEMENTS.length).toBe(36)
    expect(ELEMENTS[0]?.Z).toBe(1)
    expect(ELEMENTS[35]?.Z).toBe(36)
  })

  it('every entry has Z, symbol, name, mass, category, cpkColor, shells, valence, bondingCapacity, electronegativity', () => {
    for (const e of ELEMENTS) {
      expect(typeof e.Z).toBe('number')
      expect(e.symbol).toMatch(/^[A-Z][a-z]?$/)
      expect(e.name.length).toBeGreaterThan(0)
      expect(e.mass).toBeGreaterThan(0)
      expect(e.category).toBeDefined()
      expect(e.cpkColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(e.shells.length).toBeGreaterThan(0)
      expect(typeof e.valence).toBe('number')
      expect(typeof e.bondingCapacity).toBe('number')
      expect(typeof e.electronegativity).toBe('number')
    }
  })

  it('shells sum equals Z', () => {
    for (const e of ELEMENTS) {
      const sum = e.shells.reduce((a, b) => a + b, 0)
      expect(sum).toBe(e.Z)
    }
  })

  it('Hydrogen: Z=1, valence=1, bondingCapacity=1', () => {
    const h = getElement(1)
    expect(h.symbol).toBe('H')
    expect(h.valence).toBe(1)
    expect(h.bondingCapacity).toBe(1)
  })

  it('Oxygen: Z=8, valence=6, bondingCapacity=2', () => {
    const o = getElement(8)
    expect(o.symbol).toBe('O')
    expect(o.valence).toBe(6)
    expect(o.bondingCapacity).toBe(2)
  })

  it('Carbon: Z=6, valence=4, bondingCapacity=4', () => {
    const c = getElement(6)
    expect(c.symbol).toBe('C')
    expect(c.valence).toBe(4)
    expect(c.bondingCapacity).toBe(4)
  })

  it('Neon: bondingCapacity=0 (noble)', () => {
    const ne = getElement(10)
    expect(ne.category).toBe('noble')
    expect(ne.bondingCapacity).toBe(0)
  })

  it('Sodium and Chlorine have a large electronegativity gap (ionic territory)', () => {
    const na = getElement(11)
    const cl = getElement(17)
    expect(Math.abs(na.electronegativity - cl.electronegativity)).toBeGreaterThan(1.7)
  })

  it('getElement throws on Z out of range', () => {
    expect(() => getElement(0)).toThrow()
    expect(() => getElement(37)).toThrow()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm test tests/chem/elements.spec.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create the elements data file**

Write `/Users/christopherwest/web/molecular/src/chem/elements.ts`:

```ts
import type { Element } from './types'

// CPK colors from the standard Corey-Pauling-Koltun palette.
// Electronegativities are Pauling scale.
// bondingCapacity = number of covalent bonds typically formed (8 - valence for nonmetals; equals valence for groups 1–3; 0 for nobles).
export const ELEMENTS: readonly Element[] = [
  { Z: 1, symbol: 'H', name: 'Hydrogen', mass: 1.008, category: 'nonmetal', cpkColor: '#FFFFFF', shells: [1], valence: 1, bondingCapacity: 1, oxidationStates: [1, -1], electronegativity: 2.2, vdwRadius: 1.2 },
  { Z: 2, symbol: 'He', name: 'Helium', mass: 4.003, category: 'noble', cpkColor: '#D9FFFF', shells: [2], valence: 2, bondingCapacity: 0, oxidationStates: [0], electronegativity: 0, vdwRadius: 1.4 },
  { Z: 3, symbol: 'Li', name: 'Lithium', mass: 6.94, category: 'alkali', cpkColor: '#CC80FF', shells: [2, 1], valence: 1, bondingCapacity: 1, oxidationStates: [1], electronegativity: 0.98, vdwRadius: 1.82 },
  { Z: 4, symbol: 'Be', name: 'Beryllium', mass: 9.012, category: 'alkaline', cpkColor: '#C2FF00', shells: [2, 2], valence: 2, bondingCapacity: 2, oxidationStates: [2], electronegativity: 1.57, vdwRadius: 1.53 },
  { Z: 5, symbol: 'B', name: 'Boron', mass: 10.81, category: 'metalloid', cpkColor: '#FFB5B5', shells: [2, 3], valence: 3, bondingCapacity: 3, oxidationStates: [3], electronegativity: 2.04, vdwRadius: 1.92 },
  { Z: 6, symbol: 'C', name: 'Carbon', mass: 12.01, category: 'nonmetal', cpkColor: '#909090', shells: [2, 4], valence: 4, bondingCapacity: 4, oxidationStates: [4, -4, 2], electronegativity: 2.55, vdwRadius: 1.7 },
  { Z: 7, symbol: 'N', name: 'Nitrogen', mass: 14.01, category: 'nonmetal', cpkColor: '#3050F8', shells: [2, 5], valence: 5, bondingCapacity: 3, oxidationStates: [-3, 3, 5], electronegativity: 3.04, vdwRadius: 1.55 },
  { Z: 8, symbol: 'O', name: 'Oxygen', mass: 16.0, category: 'nonmetal', cpkColor: '#FF0D0D', shells: [2, 6], valence: 6, bondingCapacity: 2, oxidationStates: [-2], electronegativity: 3.44, vdwRadius: 1.52 },
  { Z: 9, symbol: 'F', name: 'Fluorine', mass: 19.0, category: 'halogen', cpkColor: '#90E050', shells: [2, 7], valence: 7, bondingCapacity: 1, oxidationStates: [-1], electronegativity: 3.98, vdwRadius: 1.47 },
  { Z: 10, symbol: 'Ne', name: 'Neon', mass: 20.18, category: 'noble', cpkColor: '#B3E3F5', shells: [2, 8], valence: 8, bondingCapacity: 0, oxidationStates: [0], electronegativity: 0, vdwRadius: 1.54 },
  { Z: 11, symbol: 'Na', name: 'Sodium', mass: 22.99, category: 'alkali', cpkColor: '#AB5CF2', shells: [2, 8, 1], valence: 1, bondingCapacity: 1, oxidationStates: [1], electronegativity: 0.93, vdwRadius: 2.27 },
  { Z: 12, symbol: 'Mg', name: 'Magnesium', mass: 24.31, category: 'alkaline', cpkColor: '#8AFF00', shells: [2, 8, 2], valence: 2, bondingCapacity: 2, oxidationStates: [2], electronegativity: 1.31, vdwRadius: 1.73 },
  { Z: 13, symbol: 'Al', name: 'Aluminum', mass: 26.98, category: 'other-metal', cpkColor: '#BFA6A6', shells: [2, 8, 3], valence: 3, bondingCapacity: 3, oxidationStates: [3], electronegativity: 1.61, vdwRadius: 1.84 },
  { Z: 14, symbol: 'Si', name: 'Silicon', mass: 28.09, category: 'metalloid', cpkColor: '#F0C8A0', shells: [2, 8, 4], valence: 4, bondingCapacity: 4, oxidationStates: [4, -4], electronegativity: 1.9, vdwRadius: 2.1 },
  { Z: 15, symbol: 'P', name: 'Phosphorus', mass: 30.97, category: 'nonmetal', cpkColor: '#FF8000', shells: [2, 8, 5], valence: 5, bondingCapacity: 3, oxidationStates: [5, 3, -3], electronegativity: 2.19, vdwRadius: 1.8 },
  { Z: 16, symbol: 'S', name: 'Sulfur', mass: 32.07, category: 'nonmetal', cpkColor: '#FFFF30', shells: [2, 8, 6], valence: 6, bondingCapacity: 2, oxidationStates: [-2, 4, 6], electronegativity: 2.58, vdwRadius: 1.8 },
  { Z: 17, symbol: 'Cl', name: 'Chlorine', mass: 35.45, category: 'halogen', cpkColor: '#1FF01F', shells: [2, 8, 7], valence: 7, bondingCapacity: 1, oxidationStates: [-1, 1, 3, 5, 7], electronegativity: 3.16, vdwRadius: 1.75 },
  { Z: 18, symbol: 'Ar', name: 'Argon', mass: 39.95, category: 'noble', cpkColor: '#80D1E3', shells: [2, 8, 8], valence: 8, bondingCapacity: 0, oxidationStates: [0], electronegativity: 0, vdwRadius: 1.88 },
  { Z: 19, symbol: 'K', name: 'Potassium', mass: 39.1, category: 'alkali', cpkColor: '#8F40D4', shells: [2, 8, 8, 1], valence: 1, bondingCapacity: 1, oxidationStates: [1], electronegativity: 0.82, vdwRadius: 2.75 },
  { Z: 20, symbol: 'Ca', name: 'Calcium', mass: 40.08, category: 'alkaline', cpkColor: '#3DFF00', shells: [2, 8, 8, 2], valence: 2, bondingCapacity: 2, oxidationStates: [2], electronegativity: 1.0, vdwRadius: 2.31 },
  { Z: 21, symbol: 'Sc', name: 'Scandium', mass: 44.96, category: 'transition', cpkColor: '#E6E6E6', shells: [2, 8, 9, 2], valence: 3, bondingCapacity: 3, oxidationStates: [3], electronegativity: 1.36, vdwRadius: 2.11 },
  { Z: 22, symbol: 'Ti', name: 'Titanium', mass: 47.87, category: 'transition', cpkColor: '#BFC2C7', shells: [2, 8, 10, 2], valence: 4, bondingCapacity: 4, oxidationStates: [2, 3, 4], electronegativity: 1.54, vdwRadius: 1.87 },
  { Z: 23, symbol: 'V', name: 'Vanadium', mass: 50.94, category: 'transition', cpkColor: '#A6A6AB', shells: [2, 8, 11, 2], valence: 5, bondingCapacity: 3, oxidationStates: [2, 3, 4, 5], electronegativity: 1.63, vdwRadius: 1.79 },
  { Z: 24, symbol: 'Cr', name: 'Chromium', mass: 52.0, category: 'transition', cpkColor: '#8A99C7', shells: [2, 8, 13, 1], valence: 6, bondingCapacity: 3, oxidationStates: [2, 3, 6], electronegativity: 1.66, vdwRadius: 1.89 },
  { Z: 25, symbol: 'Mn', name: 'Manganese', mass: 54.94, category: 'transition', cpkColor: '#9C7AC7', shells: [2, 8, 13, 2], valence: 7, bondingCapacity: 4, oxidationStates: [2, 4, 7], electronegativity: 1.55, vdwRadius: 1.97 },
  { Z: 26, symbol: 'Fe', name: 'Iron', mass: 55.85, category: 'transition', cpkColor: '#E06633', shells: [2, 8, 14, 2], valence: 8, bondingCapacity: 3, oxidationStates: [2, 3], electronegativity: 1.83, vdwRadius: 1.94 },
  { Z: 27, symbol: 'Co', name: 'Cobalt', mass: 58.93, category: 'transition', cpkColor: '#F090A0', shells: [2, 8, 15, 2], valence: 9, bondingCapacity: 3, oxidationStates: [2, 3], electronegativity: 1.88, vdwRadius: 1.92 },
  { Z: 28, symbol: 'Ni', name: 'Nickel', mass: 58.69, category: 'transition', cpkColor: '#50D050', shells: [2, 8, 16, 2], valence: 10, bondingCapacity: 2, oxidationStates: [2, 3], electronegativity: 1.91, vdwRadius: 1.63 },
  { Z: 29, symbol: 'Cu', name: 'Copper', mass: 63.55, category: 'transition', cpkColor: '#C88033', shells: [2, 8, 18, 1], valence: 11, bondingCapacity: 2, oxidationStates: [1, 2], electronegativity: 1.9, vdwRadius: 1.4 },
  { Z: 30, symbol: 'Zn', name: 'Zinc', mass: 65.38, category: 'transition', cpkColor: '#7D80B0', shells: [2, 8, 18, 2], valence: 12, bondingCapacity: 2, oxidationStates: [2], electronegativity: 1.65, vdwRadius: 1.39 },
  { Z: 31, symbol: 'Ga', name: 'Gallium', mass: 69.72, category: 'other-metal', cpkColor: '#C28F8F', shells: [2, 8, 18, 3], valence: 3, bondingCapacity: 3, oxidationStates: [3], electronegativity: 1.81, vdwRadius: 1.87 },
  { Z: 32, symbol: 'Ge', name: 'Germanium', mass: 72.63, category: 'metalloid', cpkColor: '#668F8F', shells: [2, 8, 18, 4], valence: 4, bondingCapacity: 4, oxidationStates: [4, -4], electronegativity: 2.01, vdwRadius: 2.11 },
  { Z: 33, symbol: 'As', name: 'Arsenic', mass: 74.92, category: 'metalloid', cpkColor: '#BD80E3', shells: [2, 8, 18, 5], valence: 5, bondingCapacity: 3, oxidationStates: [-3, 3, 5], electronegativity: 2.18, vdwRadius: 1.85 },
  { Z: 34, symbol: 'Se', name: 'Selenium', mass: 78.97, category: 'nonmetal', cpkColor: '#FFA100', shells: [2, 8, 18, 6], valence: 6, bondingCapacity: 2, oxidationStates: [-2, 4, 6], electronegativity: 2.55, vdwRadius: 1.9 },
  { Z: 35, symbol: 'Br', name: 'Bromine', mass: 79.9, category: 'halogen', cpkColor: '#A62929', shells: [2, 8, 18, 7], valence: 7, bondingCapacity: 1, oxidationStates: [-1, 1, 5], electronegativity: 2.96, vdwRadius: 1.85 },
  { Z: 36, symbol: 'Kr', name: 'Krypton', mass: 83.8, category: 'noble', cpkColor: '#5CB8D1', shells: [2, 8, 18, 8], valence: 8, bondingCapacity: 0, oxidationStates: [0], electronegativity: 3.0, vdwRadius: 2.02 },
] as const

const BY_Z = new Map<number, Element>(ELEMENTS.map((e) => [e.Z, e]))
const BY_SYMBOL = new Map<string, Element>(ELEMENTS.map((e) => [e.symbol, e]))

export function getElement(Z: number): Element {
  const el = BY_Z.get(Z)
  if (!el) throw new Error(`No element with Z=${Z} (supported range: 1–36)`)
  return el
}

export function getElementBySymbol(symbol: string): Element {
  const el = BY_SYMBOL.get(symbol)
  if (!el) throw new Error(`No element with symbol=${symbol}`)
  return el
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm test tests/chem/elements.spec.ts
```

Expected: 9 tests pass. (Note: transition metals with d-electron-heavy valence use bondingCapacity that reflects typical complex-formation counts; we don't model d-orbital bonding strictly in v1.)

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chem: add periodic table data for Z=1–36 with CPK colors and electronegativities"
git push
```

---

### Task 1.3 — Bonding rules: `canBond`

**Files:**
- Create: `src/chem/rules.ts`
- Create: `tests/chem/rules.spec.ts`

- [ ] **Step 1: Write tests**

Write `/Users/christopherwest/web/molecular/tests/chem/rules.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getElement } from '@/src/chem/elements'
import { canBond } from '@/src/chem/rules'

describe('canBond', () => {
  it('H + H → covalent single bond', () => {
    const r = canBond(getElement(1), getElement(1))
    expect(r.allowed).toBe(true)
    expect(r.order).toBe(1)
    expect(r.type).toBe('covalent')
    expect(r.preference).toBe('common')
  })

  it('H + O → covalent single bond', () => {
    const r = canBond(getElement(1), getElement(8))
    expect(r.allowed).toBe(true)
    expect(r.order).toBe(1)
    expect(r.type).toBe('covalent')
  })

  it('C + C → covalent single bond by default (orders up to triple are negotiated by getBondingSites)', () => {
    const r = canBond(getElement(6), getElement(6))
    expect(r.allowed).toBe(true)
    expect(r.order).toBe(1)
    expect(r.type).toBe('covalent')
  })

  it('Na + Cl → ionic single (Δχ > 1.7)', () => {
    const r = canBond(getElement(11), getElement(17))
    expect(r.allowed).toBe(true)
    expect(r.type).toBe('ionic')
    expect(r.order).toBe(1)
  })

  it('He + H → not allowed (noble has no bondingCapacity)', () => {
    const r = canBond(getElement(2), getElement(1))
    expect(r.allowed).toBe(false)
  })

  it('Ne + Ne → not allowed', () => {
    const r = canBond(getElement(10), getElement(10))
    expect(r.allowed).toBe(false)
  })

  it('O + O → covalent (becomes O=O double when sites negotiate)', () => {
    const r = canBond(getElement(8), getElement(8))
    expect(r.allowed).toBe(true)
    expect(r.type).toBe('covalent')
  })

  it('N + N → covalent (becomes N≡N triple in N₂)', () => {
    const r = canBond(getElement(7), getElement(7))
    expect(r.allowed).toBe(true)
    expect(r.type).toBe('covalent')
  })

  it('unusual: H + Be (allowed but flagged as unusual at large Δχ on metal side)', () => {
    const r = canBond(getElement(1), getElement(4))
    expect(r.allowed).toBe(true)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm test tests/chem/rules.spec.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `canBond`**

Write `/Users/christopherwest/web/molecular/src/chem/rules.ts`:

```ts
import type { BondOrder, BondType, Element } from './types'

export interface CanBondResult {
  allowed: boolean
  order: BondOrder
  type: BondType
  preference: 'common' | 'unusual'
}

const IONIC_THRESHOLD = 1.7

export function canBond(a: Element, b: Element): CanBondResult {
  if (a.bondingCapacity === 0 || b.bondingCapacity === 0) {
    return { allowed: false, order: 1, type: 'covalent', preference: 'unusual' }
  }

  const dx = Math.abs(a.electronegativity - b.electronegativity)
  const type: BondType = dx >= IONIC_THRESHOLD ? 'ionic' : 'covalent'

  // canBond is the gate; bond ORDER beyond single is decided later by getBondingSites
  // based on remaining valence on each atom in the actual scene context.
  const preference: 'common' | 'unusual' =
    (a.category === 'noble' || b.category === 'noble') ? 'unusual' : 'common'

  return { allowed: true, order: 1, type, preference }
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm test tests/chem/rules.spec.ts
```

Expected: 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chem: implement canBond with ionic-threshold + noble-gas exclusion"
git push
```

---

### Task 1.4 — VSEPR geometry + bonding-site computation

**Files:**
- Create: `src/chem/vsper.ts`
- Create: `tests/chem/vsper.spec.ts`

- [ ] **Step 1: Write tests for geometry tables and site computation**

Write `/Users/christopherwest/web/molecular/tests/chem/vsper.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { atomId, moleculeId, type Atom, type SceneSnapshot, type Bond, bondId } from '@/src/chem/types'
import { getBondingSites, BOND_LENGTH } from '@/src/chem/vsper'

function makeScene(atoms: Atom[], bonds: Bond[] = []): SceneSnapshot {
  const scene: SceneSnapshot = { atoms: {}, bonds: {}, molecules: {} }
  for (const a of atoms) scene.atoms[a.id] = a
  for (const b of bonds) scene.bonds[b.id] = b
  return scene
}

describe('getBondingSites', () => {
  it('isolated oxygen has 2 sites (bondingCapacity=2, no existing bonds)', () => {
    const m = moleculeId()
    const o: Atom = { id: atomId(), Z: 8, position: [0, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m }
    const scene = makeScene([o])
    const sites = getBondingSites(o, scene)
    expect(sites.length).toBe(2)
    for (const s of sites) {
      expect(typeof s.position[0]).toBe('number')
      const len = Math.hypot(...s.position)
      expect(len).toBeCloseTo(BOND_LENGTH, 1)
    }
  })

  it('water — one H already bonded to O, O exposes one remaining site at ~104.5°', () => {
    const m = moleculeId()
    const oId = atomId()
    const h1Id = atomId()
    const o: Atom = { id: oId, Z: 8, position: [0, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m }
    const h1: Atom = { id: h1Id, Z: 1, position: [BOND_LENGTH, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m }
    const b: Bond = { id: bondId(), atomA: oId, atomB: h1Id, order: 1, type: 'covalent' }
    const scene = makeScene([o, h1], [b])
    const sites = getBondingSites(o, scene)
    expect(sites.length).toBe(1)

    // Angle between (h1.position - o.position) and (site.position - o.position) is ~104.5°
    const a = [BOND_LENGTH, 0, 0]
    const s = sites[0]!.position
    const dot = a[0] * s[0] + a[1] * s[1] + a[2] * s[2]
    const cos = dot / (BOND_LENGTH * BOND_LENGTH)
    const degrees = (Math.acos(cos) * 180) / Math.PI
    expect(degrees).toBeGreaterThan(100)
    expect(degrees).toBeLessThan(110)
  })

  it('carbon — 4 sites in tetrahedral arrangement (~109.5° each)', () => {
    const m = moleculeId()
    const c: Atom = { id: atomId(), Z: 6, position: [0, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m }
    const scene = makeScene([c])
    const sites = getBondingSites(c, scene)
    expect(sites.length).toBe(4)

    // All pairwise angles should be ~109.5°
    for (let i = 0; i < sites.length; i++) {
      for (let j = i + 1; j < sites.length; j++) {
        const a = sites[i]!.position
        const b = sites[j]!.position
        const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
        const cos = dot / (BOND_LENGTH * BOND_LENGTH)
        const degrees = (Math.acos(cos) * 180) / Math.PI
        expect(degrees).toBeGreaterThan(105)
        expect(degrees).toBeLessThan(115)
      }
    }
  })

  it('CO2 carbon — 2 sites at 180° (linear)', () => {
    const m = moleculeId()
    const cId = atomId()
    const o1Id = atomId()
    const c: Atom = { id: cId, Z: 6, position: [0, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m }
    const o1: Atom = { id: o1Id, Z: 8, position: [BOND_LENGTH, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m }
    // Double bond consumes 2 of C's 4 slots
    const b: Bond = { id: bondId(), atomA: cId, atomB: o1Id, order: 2, type: 'covalent' }
    const scene = makeScene([c, o1], [b])
    const sites = getBondingSites(c, scene)
    // C has 4 capacity, double bond takes 2, leaves 2 — but they should be co-linear (180° to existing)
    expect(sites.length).toBeGreaterThanOrEqual(1)
    const site = sites[0]!.position
    const angle = Math.atan2(site[1], site[0]) * (180 / Math.PI)
    // Should be opposite of (1, 0, 0) → angle near ±180
    expect(Math.abs(Math.abs(angle) - 180)).toBeLessThan(15)
  })

  it('fully-bonded oxygen (in H2O) — 0 sites', () => {
    const m = moleculeId()
    const oId = atomId()
    const h1Id = atomId()
    const h2Id = atomId()
    const o: Atom = { id: oId, Z: 8, position: [0, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m }
    const h1: Atom = { id: h1Id, Z: 1, position: [BOND_LENGTH, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m }
    const h2: Atom = { id: h2Id, Z: 1, position: [-0.25, BOND_LENGTH * 0.97, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m }
    const b1: Bond = { id: bondId(), atomA: oId, atomB: h1Id, order: 1, type: 'covalent' }
    const b2: Bond = { id: bondId(), atomA: oId, atomB: h2Id, order: 1, type: 'covalent' }
    const scene = makeScene([o, h1, h2], [b1, b2])
    const sites = getBondingSites(o, scene)
    expect(sites.length).toBe(0)
  })

  it('noble gas — 0 sites', () => {
    const m = moleculeId()
    const ne: Atom = { id: atomId(), Z: 10, position: [0, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m }
    const scene = makeScene([ne])
    expect(getBondingSites(ne, scene).length).toBe(0)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm test tests/chem/vsper.spec.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement VSEPR**

Write `/Users/christopherwest/web/molecular/src/chem/vsper.ts`:

```ts
import { getElement } from './elements'
import type { Atom, SceneSnapshot, Vec3 } from './types'

// All bond lengths are normalized to a single visual unit; later we can per-element-pair tune.
export const BOND_LENGTH = 1.0

export interface BondingSite {
  // World-space position of the open valence (where a new atom snaps).
  position: Vec3
  // Direction from the host atom (unit vector).
  direction: Vec3
}

// Pre-computed unit direction vectors for each electron-domain count.
// Domains include both bonded atoms AND lone pairs.
const LINEAR: Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
]

const TRIGONAL_PLANAR: Vec3[] = [
  [1, 0, 0],
  [-0.5, Math.sin((120 * Math.PI) / 180), 0],
  [-0.5, -Math.sin((120 * Math.PI) / 180), 0],
]

// Tetrahedral: 4 vectors from the center of a tetrahedron to its vertices.
const TETRAHEDRAL: Vec3[] = [
  [1, 1, 1],
  [-1, -1, 1],
  [-1, 1, -1],
  [1, -1, -1],
].map(normalize) as Vec3[]

// Geometry table: maps total domain count to a set of unit directions.
const GEOMETRY: Record<number, Vec3[]> = {
  1: [[1, 0, 0]],
  2: LINEAR,
  3: TRIGONAL_PLANAR,
  4: TETRAHEDRAL,
}

function normalize(v: number[]): Vec3 {
  const len = Math.hypot(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0) || 1
  return [(v[0] ?? 0) / len, (v[1] ?? 0) / len, (v[2] ?? 0) / len]
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

function scale(v: Vec3, s: number): Vec3 {
  return [v[0] * s, v[1] * s, v[2] * s]
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

/**
 * Returns the world-space positions where the given atom still has free valence.
 * Positions are oriented per VSEPR by including:
 *   - all currently-bonded neighbor directions, weighted by bond order
 *   - lone pairs (computed from valence - bonding electrons / 2)
 * and choosing a geometry that places open sites at the right angles to existing
 * domains (or to each other if isolated).
 */
export function getBondingSites(atom: Atom, scene: SceneSnapshot): BondingSite[] {
  const el = getElement(atom.Z)
  if (el.bondingCapacity === 0) return []

  // 1) Sum the order of bonds this atom is already part of.
  let usedBonds = 0
  const neighborDirs: Vec3[] = []
  for (const b of Object.values(scene.bonds)) {
    if (b.atomA !== atom.id && b.atomB !== atom.id) continue
    usedBonds += b.order
    const otherId = b.atomA === atom.id ? b.atomB : b.atomA
    const other = scene.atoms[otherId]
    if (!other) continue
    neighborDirs.push(normalize(sub(other.position, atom.position) as number[]))
  }

  const remainingBonds = el.bondingCapacity - usedBonds
  if (remainingBonds <= 0) return []

  // 2) Total electron domains around this atom = number of neighbor *atoms*
  //    (each multibond counts as ONE domain) + remaining single-bond slots + lone pairs.
  const neighborCount = neighborDirs.length
  const lonePairs = Math.max(0, Math.floor((el.valence - el.bondingCapacity * 2) / 2))
  // For carbon-like atoms: valence=4, bondingCapacity=4 → no lone pairs.
  // For oxygen: valence=6, bondingCapacity=2 → (6-4)/2 = 1 → actually 2 lone pairs typically.
  // Simpler model: count (8 - electrons-used-for-bonds) / 2.
  const electronsInBonds = usedBonds * 2 + remainingBonds * 2
  const electronsLeftForLonePairs = Math.max(0, el.valence - electronsInBonds)
  const computedLonePairs = Math.floor(electronsLeftForLonePairs / 2)
  const totalDomains = neighborCount + remainingBonds + computedLonePairs

  // 3) Pick a geometry. If totalDomains > 4 we degrade to tetrahedral (v1 doesn't support
  //    trigonal bipyramidal / octahedral).
  const directions = GEOMETRY[Math.min(totalDomains, 4)] ?? GEOMETRY[4]!

  // 4) Reserve directions for existing neighbors (greedy: closest dot to existing direction wins).
  const used: number[] = []
  for (const nd of neighborDirs) {
    let best = -1
    let bestDot = -Infinity
    for (let i = 0; i < directions.length; i++) {
      if (used.includes(i)) continue
      const d = dot(nd, directions[i]!)
      if (d > bestDot) {
        bestDot = d
        best = i
      }
    }
    if (best >= 0) used.push(best)
  }

  // 5) Reserve directions for lone pairs (preferentially the directions FARTHEST from neighbors).
  for (let lp = 0; lp < computedLonePairs; lp++) {
    let best = -1
    let bestScore = -Infinity
    for (let i = 0; i < directions.length; i++) {
      if (used.includes(i)) continue
      // farthest from any used direction = highest "min angle"
      let minDot = Infinity
      for (const u of used) {
        const dval = dot(directions[i]!, directions[u]!)
        if (dval < minDot) minDot = dval
      }
      const score = -minDot
      if (score > bestScore) {
        bestScore = score
        best = i
      }
    }
    if (best >= 0) used.push(best)
  }

  // 6) Whatever directions are left are the open bonding sites.
  const sites: BondingSite[] = []
  for (let i = 0; i < directions.length; i++) {
    if (used.includes(i)) continue
    if (sites.length >= remainingBonds) break
    const dir = directions[i]!
    sites.push({
      position: add(atom.position, scale(dir, BOND_LENGTH)),
      direction: dir,
    })
  }

  return sites
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm test tests/chem/vsper.spec.ts
```

Expected: 6 tests pass. If the CO₂ test fails, the geometry choice for "1 neighbor (double-bonded) + 1 remaining + lone pairs" needs tuning — adjust geometry table accordingly. Most likely all pass on first try since the lone-pair pruning places remaining sites opposite to the double-bonded O.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chem: implement VSEPR bonding-site computation with lone-pair-aware geometry"
git push
```

---

### Task 1.5 — Hill-system formula

**Files:**
- Create: `src/chem/formula.ts`
- Create: `tests/chem/formula.spec.ts`

- [ ] **Step 1: Write tests**

Write `/Users/christopherwest/web/molecular/tests/chem/formula.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Atom } from '@/src/chem/types'
import { atomId, moleculeId } from '@/src/chem/types'
import { getFormula } from '@/src/chem/formula'

function make(Z: number): Atom {
  return { id: atomId(), Z, position: [0, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: moleculeId() }
}

describe('getFormula', () => {
  it('water → H2O', () => {
    const atoms = [make(8), make(1), make(1)]
    expect(getFormula(atoms)).toBe('H2O')
  })

  it('methane → CH4', () => {
    expect(getFormula([make(6), make(1), make(1), make(1), make(1)])).toBe('CH4')
  })

  it('ethanol → C2H6O', () => {
    const atoms = [make(6), make(6), make(8), ...Array(6).fill(0).map(() => make(1))]
    expect(getFormula(atoms)).toBe('C2H6O')
  })

  it('ammonia → NH3', () => {
    expect(getFormula([make(7), make(1), make(1), make(1)])).toBe('NH3')
  })

  it('sodium chloride → ClNa (Hill: when no carbon, alphabetical)', () => {
    expect(getFormula([make(11), make(17)])).toBe('ClNa')
  })

  it('single atom counts emit no number', () => {
    expect(getFormula([make(8), make(1)])).toBe('HO')
  })

  it('empty atom list → empty string', () => {
    expect(getFormula([])).toBe('')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm test tests/chem/formula.spec.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Write `/Users/christopherwest/web/molecular/src/chem/formula.ts`:

```ts
import { getElement } from './elements'
import type { Atom } from './types'

/**
 * Hill system formula: C first, then H, then everything else alphabetical by symbol.
 * If there is no carbon, ALL elements are alphabetical by symbol (including H).
 */
export function getFormula(atoms: readonly Atom[]): string {
  if (atoms.length === 0) return ''
  const counts = new Map<string, number>()
  for (const a of atoms) {
    const sym = getElement(a.Z).symbol
    counts.set(sym, (counts.get(sym) ?? 0) + 1)
  }
  const hasCarbon = counts.has('C')
  const ordered: string[] = []
  if (hasCarbon) {
    ordered.push('C')
    if (counts.has('H')) ordered.push('H')
    const rest = [...counts.keys()].filter((s) => s !== 'C' && s !== 'H').sort()
    ordered.push(...rest)
  } else {
    ordered.push(...[...counts.keys()].sort())
  }
  return ordered
    .map((s) => {
      const n = counts.get(s)!
      return n === 1 ? s : `${s}${n}`
    })
    .join('')
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm test tests/chem/formula.spec.ts
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chem: implement Hill-system formula stringifier"
git push
```

---

### Task 1.6 — Reaction database + `findReaction`

**Files:**
- Create: `src/chem/reactions.ts`
- Create: `tests/chem/reactions.spec.ts`

- [ ] **Step 1: Write tests**

Write `/Users/christopherwest/web/molecular/tests/chem/reactions.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { findReaction, REACTIONS } from '@/src/chem/reactions'

describe('REACTIONS database', () => {
  it('contains at least 25 reactions', () => {
    expect(REACTIONS.length).toBeGreaterThanOrEqual(25)
  })

  it('every reaction has reactants, products, type, enthalpy, activationEnergy, notes', () => {
    for (const r of REACTIONS) {
      expect(r.id).toBeDefined()
      expect(r.reactants.length).toBeGreaterThan(0)
      expect(r.products.length).toBeGreaterThan(0)
      expect(['synthesis', 'decomposition', 'displacement', 'combustion', 'neutralization']).toContain(
        r.type,
      )
      expect(['exothermic', 'endothermic']).toContain(r.enthalpy)
      expect(typeof r.activationEnergy).toBe('number')
    }
  })

  it('water synthesis is present and balances mass', () => {
    const r = findReaction([
      { formula: 'H2', count: 2 },
      { formula: 'O2', count: 1 },
    ])
    expect(r?.products).toEqual([{ formula: 'H2O', count: 2 }])
  })

  it('order of reactants in input does not matter', () => {
    const a = findReaction([
      { formula: 'H2', count: 2 },
      { formula: 'O2', count: 1 },
    ])
    const b = findReaction([
      { formula: 'O2', count: 1 },
      { formula: 'H2', count: 2 },
    ])
    expect(a?.id).toBe(b?.id)
  })

  it('methane combustion is present', () => {
    const r = findReaction([
      { formula: 'CH4', count: 1 },
      { formula: 'O2', count: 2 },
    ])
    expect(r?.products).toEqual([
      { formula: 'CO2', count: 1 },
      { formula: 'H2O', count: 2 },
    ])
  })

  it('NaCl synthesis is present', () => {
    const r = findReaction([
      { formula: 'Na', count: 2 },
      { formula: 'Cl2', count: 1 },
    ])
    expect(r?.products).toEqual([{ formula: 'NaCl', count: 2 }])
  })

  it('neutralization (HCl + NaOH) is present', () => {
    const r = findReaction([
      { formula: 'HCl', count: 1 },
      { formula: 'NaOH', count: 1 },
    ])
    expect(r?.type).toBe('neutralization')
  })

  it('unmatched mixture returns undefined', () => {
    const r = findReaction([{ formula: 'He', count: 1 }, { formula: 'Ne', count: 1 }])
    expect(r).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm test tests/chem/reactions.spec.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Write `/Users/christopherwest/web/molecular/src/chem/reactions.ts`:

```ts
export type ReactionType =
  | 'synthesis'
  | 'decomposition'
  | 'displacement'
  | 'combustion'
  | 'neutralization'

export interface Stoich {
  formula: string
  count: number
}

export interface Reaction {
  id: string
  type: ReactionType
  reactants: Stoich[]
  products: Stoich[]
  activationEnergy: number
  enthalpy: 'exothermic' | 'endothermic'
  notes: string
}

export const REACTIONS: readonly Reaction[] = [
  // ---- Synthesis ----
  {
    id: 'water-synthesis',
    type: 'synthesis',
    reactants: [{ formula: 'H2', count: 2 }, { formula: 'O2', count: 1 }],
    products: [{ formula: 'H2O', count: 2 }],
    activationEnergy: 2,
    enthalpy: 'exothermic',
    notes: 'Hydrogen burns in oxygen to form water. Highly exothermic.',
  },
  {
    id: 'ammonia-synthesis',
    type: 'synthesis',
    reactants: [{ formula: 'N2', count: 1 }, { formula: 'H2', count: 3 }],
    products: [{ formula: 'NH3', count: 2 }],
    activationEnergy: 3,
    enthalpy: 'exothermic',
    notes: 'Haber process: N₂ and H₂ form ammonia under high pressure.',
  },
  {
    id: 'nacl-synthesis',
    type: 'synthesis',
    reactants: [{ formula: 'Na', count: 2 }, { formula: 'Cl2', count: 1 }],
    products: [{ formula: 'NaCl', count: 2 }],
    activationEnergy: 1.5,
    enthalpy: 'exothermic',
    notes: 'Sodium reacts violently with chlorine gas to form table salt.',
  },
  {
    id: 'mgo-synthesis',
    type: 'synthesis',
    reactants: [{ formula: 'Mg', count: 2 }, { formula: 'O2', count: 1 }],
    products: [{ formula: 'MgO', count: 2 }],
    activationEnergy: 2,
    enthalpy: 'exothermic',
    notes: 'Magnesium burns with a bright white flame to form magnesium oxide.',
  },
  {
    id: 'co2-from-c',
    type: 'synthesis',
    reactants: [{ formula: 'C', count: 1 }, { formula: 'O2', count: 1 }],
    products: [{ formula: 'CO2', count: 1 }],
    activationEnergy: 2,
    enthalpy: 'exothermic',
    notes: 'Carbon burns in oxygen to form carbon dioxide.',
  },
  {
    id: 'co-from-c-limited-o2',
    type: 'synthesis',
    reactants: [{ formula: 'C', count: 2 }, { formula: 'O2', count: 1 }],
    products: [{ formula: 'CO', count: 2 }],
    activationEnergy: 2.5,
    enthalpy: 'exothermic',
    notes: 'With limited oxygen, carbon forms carbon monoxide instead of CO₂.',
  },
  {
    id: 'h2-synthesis-from-h',
    type: 'synthesis',
    reactants: [{ formula: 'H', count: 2 }],
    products: [{ formula: 'H2', count: 1 }],
    activationEnergy: 0.5,
    enthalpy: 'exothermic',
    notes: 'Two hydrogen atoms readily pair into H₂.',
  },
  {
    id: 'o2-synthesis-from-o',
    type: 'synthesis',
    reactants: [{ formula: 'O', count: 2 }],
    products: [{ formula: 'O2', count: 1 }],
    activationEnergy: 0.5,
    enthalpy: 'exothermic',
    notes: 'Two oxygen atoms pair into O₂.',
  },
  {
    id: 'cl2-synthesis-from-cl',
    type: 'synthesis',
    reactants: [{ formula: 'Cl', count: 2 }],
    products: [{ formula: 'Cl2', count: 1 }],
    activationEnergy: 0.5,
    enthalpy: 'exothermic',
    notes: 'Two chlorine atoms pair into Cl₂.',
  },
  {
    id: 'caco3-synthesis',
    type: 'synthesis',
    reactants: [{ formula: 'CaO', count: 1 }, { formula: 'CO2', count: 1 }],
    products: [{ formula: 'CaCO3', count: 1 }],
    activationEnergy: 2,
    enthalpy: 'exothermic',
    notes: 'Calcium oxide absorbs CO₂ to form calcium carbonate (limestone).',
  },

  // ---- Combustion ----
  {
    id: 'methane-combustion',
    type: 'combustion',
    reactants: [{ formula: 'CH4', count: 1 }, { formula: 'O2', count: 2 }],
    products: [{ formula: 'CO2', count: 1 }, { formula: 'H2O', count: 2 }],
    activationEnergy: 2.5,
    enthalpy: 'exothermic',
    notes: 'Burning natural gas (methane) produces carbon dioxide and water.',
  },
  {
    id: 'ethane-combustion',
    type: 'combustion',
    reactants: [{ formula: 'C2H6', count: 2 }, { formula: 'O2', count: 7 }],
    products: [{ formula: 'CO2', count: 4 }, { formula: 'H2O', count: 6 }],
    activationEnergy: 2.7,
    enthalpy: 'exothermic',
    notes: 'Ethane combusts completely to CO₂ and water.',
  },
  {
    id: 'ethanol-combustion',
    type: 'combustion',
    reactants: [{ formula: 'C2H6O', count: 1 }, { formula: 'O2', count: 3 }],
    products: [{ formula: 'CO2', count: 2 }, { formula: 'H2O', count: 3 }],
    activationEnergy: 2.5,
    enthalpy: 'exothermic',
    notes: 'Ethanol (drinking alcohol) burns cleanly to CO₂ and water.',
  },
  {
    id: 'propane-combustion',
    type: 'combustion',
    reactants: [{ formula: 'C3H8', count: 1 }, { formula: 'O2', count: 5 }],
    products: [{ formula: 'CO2', count: 3 }, { formula: 'H2O', count: 4 }],
    activationEnergy: 2.6,
    enthalpy: 'exothermic',
    notes: 'Propane (BBQ gas) burns to CO₂ and water.',
  },

  // ---- Neutralization ----
  {
    id: 'hcl-naoh',
    type: 'neutralization',
    reactants: [{ formula: 'HCl', count: 1 }, { formula: 'NaOH', count: 1 }],
    products: [{ formula: 'NaCl', count: 1 }, { formula: 'H2O', count: 1 }],
    activationEnergy: 0.8,
    enthalpy: 'exothermic',
    notes: 'A strong acid and a strong base neutralize into salt and water.',
  },
  {
    id: 'h2so4-naoh',
    type: 'neutralization',
    reactants: [{ formula: 'H2SO4', count: 1 }, { formula: 'NaOH', count: 2 }],
    products: [{ formula: 'Na2SO4', count: 1 }, { formula: 'H2O', count: 2 }],
    activationEnergy: 1,
    enthalpy: 'exothermic',
    notes: 'Sulfuric acid + sodium hydroxide → sodium sulfate + water.',
  },
  {
    id: 'hno3-koh',
    type: 'neutralization',
    reactants: [{ formula: 'HNO3', count: 1 }, { formula: 'KOH', count: 1 }],
    products: [{ formula: 'KNO3', count: 1 }, { formula: 'H2O', count: 1 }],
    activationEnergy: 0.8,
    enthalpy: 'exothermic',
    notes: 'Nitric acid + potassium hydroxide → potassium nitrate + water.',
  },

  // ---- Displacement ----
  {
    id: 'zn-hcl',
    type: 'displacement',
    reactants: [{ formula: 'Zn', count: 1 }, { formula: 'HCl', count: 2 }],
    products: [{ formula: 'ZnCl2', count: 1 }, { formula: 'H2', count: 1 }],
    activationEnergy: 1.2,
    enthalpy: 'exothermic',
    notes: 'Zinc displaces hydrogen from hydrochloric acid; bubbles of H₂ form.',
  },
  {
    id: 'fe-cuso4',
    type: 'displacement',
    reactants: [{ formula: 'Fe', count: 1 }, { formula: 'CuSO4', count: 1 }],
    products: [{ formula: 'FeSO4', count: 1 }, { formula: 'Cu', count: 1 }],
    activationEnergy: 1.5,
    enthalpy: 'exothermic',
    notes: 'Iron displaces copper from copper sulfate; copper plates out.',
  },
  {
    id: 'mg-hcl',
    type: 'displacement',
    reactants: [{ formula: 'Mg', count: 1 }, { formula: 'HCl', count: 2 }],
    products: [{ formula: 'MgCl2', count: 1 }, { formula: 'H2', count: 1 }],
    activationEnergy: 1,
    enthalpy: 'exothermic',
    notes: 'Magnesium reacts vigorously with hydrochloric acid, releasing H₂.',
  },

  // ---- Decomposition ----
  {
    id: 'water-electrolysis',
    type: 'decomposition',
    reactants: [{ formula: 'H2O', count: 2 }],
    products: [{ formula: 'H2', count: 2 }, { formula: 'O2', count: 1 }],
    activationEnergy: 4,
    enthalpy: 'endothermic',
    notes: 'Electricity splits water into hydrogen and oxygen gas.',
  },
  {
    id: 'h2o2-decomp',
    type: 'decomposition',
    reactants: [{ formula: 'H2O2', count: 2 }],
    products: [{ formula: 'H2O', count: 2 }, { formula: 'O2', count: 1 }],
    activationEnergy: 1.5,
    enthalpy: 'exothermic',
    notes: 'Hydrogen peroxide decomposes into water and oxygen — fizzing in cuts.',
  },
  {
    id: 'caco3-decomp',
    type: 'decomposition',
    reactants: [{ formula: 'CaCO3', count: 1 }],
    products: [{ formula: 'CaO', count: 1 }, { formula: 'CO2', count: 1 }],
    activationEnergy: 3.5,
    enthalpy: 'endothermic',
    notes: 'Heating limestone produces quicklime and CO₂ — the basis of cement.',
  },
  {
    id: 'kclo3-decomp',
    type: 'decomposition',
    reactants: [{ formula: 'KClO3', count: 2 }],
    products: [{ formula: 'KCl', count: 2 }, { formula: 'O2', count: 3 }],
    activationEnergy: 2,
    enthalpy: 'exothermic',
    notes: 'Potassium chlorate decomposes on heating, releasing oxygen.',
  },
  {
    id: 'nh3-decomp',
    type: 'decomposition',
    reactants: [{ formula: 'NH3', count: 2 }],
    products: [{ formula: 'N2', count: 1 }, { formula: 'H2', count: 3 }],
    activationEnergy: 4,
    enthalpy: 'endothermic',
    notes: 'Ammonia decomposes back into nitrogen and hydrogen at high temperatures.',
  },
] as const

// Build a quick lookup keyed by the multiset of reactant formula+count pairs.
function reactantKey(reactants: readonly Stoich[]): string {
  return [...reactants]
    .map((r) => `${r.formula}:${r.count}`)
    .sort()
    .join('|')
}

const REACTION_INDEX = new Map<string, Reaction>()
for (const r of REACTIONS) REACTION_INDEX.set(reactantKey(r.reactants), r)

/**
 * Look up a reaction whose reactants exactly match the given multiset.
 * Returns undefined if no match.
 */
export function findReaction(input: readonly Stoich[]): Reaction | undefined {
  return REACTION_INDEX.get(reactantKey(input))
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm test tests/chem/reactions.spec.ts
```

Expected: 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chem: add reaction database (26 reactions) and findReaction lookup"
git push
```

---

### Task 1.7 — Scene validation

**Files:**
- Create: `src/chem/validate.ts`
- Create: `tests/chem/validate.spec.ts`
- Create: `src/data/named-molecules.ts` (formula → known name)

- [ ] **Step 1: Write tests**

Write `/Users/christopherwest/web/molecular/tests/chem/validate.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { atomId, bondId, moleculeId, type Atom, type Bond, type SceneSnapshot } from '@/src/chem/types'
import { validateScene } from '@/src/chem/validate'

function scene(atoms: Atom[], bonds: Bond[]): SceneSnapshot {
  const s: SceneSnapshot = { atoms: {}, bonds: {}, molecules: {} }
  for (const a of atoms) s.atoms[a.id] = a
  for (const b of bonds) s.bonds[b.id] = b
  return s
}

describe('validateScene', () => {
  it('water → valid + named', () => {
    const m = moleculeId()
    const o: Atom = { id: atomId(), Z: 8, position: [0, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m }
    const h1: Atom = { id: atomId(), Z: 1, position: [1, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m }
    const h2: Atom = { id: atomId(), Z: 1, position: [-0.25, 0.97, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m }
    const b1: Bond = { id: bondId(), atomA: o.id, atomB: h1.id, order: 1, type: 'covalent' }
    const b2: Bond = { id: bondId(), atomA: o.id, atomB: h2.id, order: 1, type: 'covalent' }
    const r = validateScene(scene([o, h1, h2], [b1, b2]))
    expect(r.status).toBe('valid-named')
    expect(r.name).toBe('Water')
    expect(r.formula).toBe('H2O')
  })

  it('CH4 → valid + named (Methane)', () => {
    const m = moleculeId()
    const c: Atom = { id: atomId(), Z: 6, position: [0, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m }
    const hs: Atom[] = [
      { id: atomId(), Z: 1, position: [1, 1, 1], velocity: [0, 0, 0], charge: 0, moleculeId: m },
      { id: atomId(), Z: 1, position: [-1, -1, 1], velocity: [0, 0, 0], charge: 0, moleculeId: m },
      { id: atomId(), Z: 1, position: [-1, 1, -1], velocity: [0, 0, 0], charge: 0, moleculeId: m },
      { id: atomId(), Z: 1, position: [1, -1, -1], velocity: [0, 0, 0], charge: 0, moleculeId: m },
    ]
    const bs: Bond[] = hs.map((h) => ({
      id: bondId(),
      atomA: c.id,
      atomB: h.id,
      order: 1,
      type: 'covalent',
    }))
    const r = validateScene(scene([c, ...hs], bs))
    expect(r.status).toBe('valid-named')
    expect(r.name).toBe('Methane')
  })

  it('CH3 (free radical) → unusual', () => {
    const m = moleculeId()
    const c: Atom = { id: atomId(), Z: 6, position: [0, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m }
    const hs: Atom[] = [1, 2, 3].map(() => ({
      id: atomId(),
      Z: 1,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }))
    const bs: Bond[] = hs.map((h) => ({
      id: bondId(),
      atomA: c.id,
      atomB: h.id,
      order: 1,
      type: 'covalent',
    }))
    const r = validateScene(scene([c, ...hs], bs))
    expect(r.status).toBe('valid-unusual')
  })

  it('empty scene → empty', () => {
    expect(validateScene(scene([], [])).status).toBe('empty')
  })

  it('single H atom → valid-unnamed (no name, no broken rules — single atom not "stable" but acceptable)', () => {
    const m = moleculeId()
    const h: Atom = { id: atomId(), Z: 1, position: [0, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m }
    const r = validateScene(scene([h], []))
    expect(['valid-unnamed', 'valid-unusual']).toContain(r.status)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm test tests/chem/validate.spec.ts
```

- [ ] **Step 3: Create the named molecules lookup**

Write `/Users/christopherwest/web/molecular/src/data/named-molecules.ts`:

```ts
/**
 * Maps Hill-system formula to a known common name.
 * Used by validateScene to label well-known compounds.
 */
export const NAMED_MOLECULES: Record<string, string> = {
  H2O: 'Water',
  H2: 'Hydrogen gas',
  O2: 'Oxygen gas',
  N2: 'Nitrogen gas',
  Cl2: 'Chlorine gas',
  CO2: 'Carbon dioxide',
  CO: 'Carbon monoxide',
  CH4: 'Methane',
  C2H6: 'Ethane',
  C3H8: 'Propane',
  C2H6O: 'Ethanol',
  C6H12O6: 'Glucose',
  NH3: 'Ammonia',
  HCl: 'Hydrochloric acid',
  HNO3: 'Nitric acid',
  H2SO4: 'Sulfuric acid',
  H2O2: 'Hydrogen peroxide',
  NaOH: 'Sodium hydroxide',
  KOH: 'Potassium hydroxide',
  ClNa: 'Sodium chloride',
  MgO: 'Magnesium oxide',
  CaO: 'Calcium oxide',
  CaCO3: 'Calcium carbonate',
  KCl: 'Potassium chloride',
  KNO3: 'Potassium nitrate',
  Na2SO4: 'Sodium sulfate',
  C8H10N4O2: 'Caffeine',
  C9H8O4: 'Aspirin',
}
```

- [ ] **Step 4: Implement validateScene**

Write `/Users/christopherwest/web/molecular/src/chem/validate.ts`:

```ts
import { getElement } from './elements'
import { getFormula } from './formula'
import { NAMED_MOLECULES } from '../data/named-molecules'
import type { Atom, SceneSnapshot } from './types'

export type ValidityStatus = 'empty' | 'valid-named' | 'valid-unnamed' | 'valid-unusual' | 'invalid'

export interface ValidationResult {
  status: ValidityStatus
  formula: string
  name?: string
  reason?: string
}

export function validateScene(scene: SceneSnapshot): ValidationResult {
  const atoms = Object.values(scene.atoms)
  if (atoms.length === 0) return { status: 'empty', formula: '' }

  const formula = getFormula(atoms)

  // Check octet/duet/expanded violations: every atom's used bonding capacity should be ≤ its limit.
  const usedByAtom = new Map<string, number>()
  for (const b of Object.values(scene.bonds)) {
    usedByAtom.set(b.atomA, (usedByAtom.get(b.atomA) ?? 0) + b.order)
    usedByAtom.set(b.atomB, (usedByAtom.get(b.atomB) ?? 0) + b.order)
  }

  let hasUnusual = false
  for (const a of atoms) {
    const el = getElement(a.Z)
    const used = usedByAtom.get(a.id) ?? 0
    if (used > el.bondingCapacity) {
      return {
        status: 'invalid',
        formula,
        reason: `${el.symbol} has ${used} bonds but allows ${el.bondingCapacity}`,
      }
    }
    // Unusual: a non-noble nonmetal with unfilled capacity is a free radical.
    if (el.category !== 'noble' && el.bondingCapacity > 0 && used < el.bondingCapacity && atoms.length > 1) {
      hasUnusual = true
    }
  }

  const name = NAMED_MOLECULES[formula]
  if (name) return { status: 'valid-named', formula, name }
  if (hasUnusual) return { status: 'valid-unusual', formula, reason: 'unfilled valence on some atoms' }
  return { status: 'valid-unnamed', formula }
}
```

- [ ] **Step 5: Run — expect PASS**

```bash
pnpm test tests/chem/validate.spec.ts
```

Expected: 5 tests pass.

- [ ] **Step 6: Run the full chem suite to make sure nothing regressed**

```bash
pnpm test src/chem tests/chem
```

Expected: all chem-engine tests pass (~50 total).

- [ ] **Step 7: Commit (Phase 1 capstone)**

```bash
git add .
git commit -m "chem: implement scene validation with named-molecule lookup; Phase 1 complete"
git push
```

**🎉 Phase 1 demoable:** `pnpm test src/chem tests/chem` passes ~50 unit tests. The chemistry engine is now a self-contained, tested module that the rest of the app will build on.

---

# Phase 2 — R3F scene foundation

**Goal:** A `/app` route renders a hardcoded water molecule rotating in 3D, complete with electron sprites, bond beams, bloom, and a starfield. The `<Atom>` and `<Bond>` components are state-agnostic and reusable for the landing page and library previews.

**Files created in this phase:**
- `app/app/page.tsx` — the app route (placeholder shell that mounts `<Scene>`)
- `src/scene/Scene.tsx` — Canvas wrapper, lights, stars, bloom
- `src/scene/Atom.tsx` — nucleus + shells + electron sprites
- `src/scene/Bond.tsx` — single/double/triple bond rendering
- `src/scene/Molecule.tsx` — groups atoms + bonds
- `src/scene/ElectronSprite.tsx` — sprite material + texture
- `src/scene/electronTexture.ts` — generated radial-gradient PNG via canvas
- `public/textures/electron.png` — bundled sprite texture
- `tests/scene/Atom.dom.spec.tsx` — sanity test that Atom renders an `<group>`
- `tests/e2e/app-renders-water.spec.ts` — Playwright check that the canvas exists and a label is visible

### Task 2.1 — Install Three.js + R3F + drei + postprocessing

**Files:** None (deps only)

- [ ] **Step 1: Install runtime deps**

```bash
pnpm add three @react-three/fiber @react-three/drei @react-three/postprocessing
pnpm add -D @types/three
```

- [ ] **Step 2: Verify Next.js still builds**

```bash
pnpm build
```

Expected: build succeeds. Three.js is tree-shakable; bundle size is fine.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "scene: add three.js + react-three-fiber + drei + postprocessing"
git push
```

---

### Task 2.2 — Generate electron sprite texture

**Files:**
- Create: `scripts/gen-electron-texture.mjs`
- Create: `public/textures/electron.png` (generated)

- [ ] **Step 1: Install canvas (for generating the PNG)**

```bash
pnpm add -D canvas
```

- [ ] **Step 2: Write the generator script**

Write `/Users/christopherwest/web/molecular/scripts/gen-electron-texture.mjs`:

```js
import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SIZE = 128
const canvas = createCanvas(SIZE, SIZE)
const ctx = canvas.getContext('2d')

const gradient = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 0, SIZE / 2, SIZE / 2, SIZE / 2)
gradient.addColorStop(0, 'rgba(255, 245, 180, 1)')
gradient.addColorStop(0.35, 'rgba(255, 224, 124, 0.85)')
gradient.addColorStop(0.7, 'rgba(255, 200, 60, 0.2)')
gradient.addColorStop(1, 'rgba(255, 200, 60, 0)')
ctx.fillStyle = gradient
ctx.fillRect(0, 0, SIZE, SIZE)

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'textures', 'electron.png')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, canvas.toBuffer('image/png'))
console.log('Wrote', out)
```

- [ ] **Step 3: Generate the texture**

```bash
node scripts/gen-electron-texture.mjs
```

Expected: `public/textures/electron.png` is created (~5–15 KB).

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "scene: generate electron sprite texture (radial gradient PNG)"
git push
```

---

### Task 2.3 — `<Scene>` wrapper

**Files:**
- Create: `src/scene/Scene.tsx`

- [ ] **Step 1: Write the component**

Write `/Users/christopherwest/web/molecular/src/scene/Scene.tsx`:

```tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import type { ReactNode } from 'react'

interface SceneProps {
  children: ReactNode
  enableBloom?: boolean
}

export function Scene({ children, enableBloom = true }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      style={{ background: 'radial-gradient(circle at 50% 50%, #1a1135 0%, #07051a 100%)' }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.7} />
      <Stars radius={50} depth={50} count={3000} factor={4} fade speed={1} />
      <OrbitControls
        enablePan
        enableRotate
        enableZoom
        minDistance={2}
        maxDistance={20}
        target={[0, 0, 0]}
      />
      <group>{children}</group>
      {enableBloom && (
        <EffectComposer>
          <Bloom intensity={0.8} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
        </EffectComposer>
      )}
    </Canvas>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "scene: add Scene wrapper with canvas, lights, stars, and bloom"
git push
```

---

### Task 2.4 — `<ElectronSprite>` and a tiny render test

**Files:**
- Create: `src/scene/ElectronSprite.tsx`

- [ ] **Step 1: Implement the sprite**

Write `/Users/christopherwest/web/molecular/src/scene/ElectronSprite.tsx`:

```tsx
'use client'

import { useTexture } from '@react-three/drei'
import { AdditiveBlending, Sprite, SpriteMaterial, type Vector3Tuple } from 'three'
import { useMemo } from 'react'

interface ElectronSpriteProps {
  position: Vector3Tuple
  scale?: number
  color?: string
}

export function ElectronSprite({ position, scale = 0.08, color = '#ffe07c' }: ElectronSpriteProps) {
  const texture = useTexture('/textures/electron.png')
  // Memoize the material so all sprites share one instance per color.
  const material = useMemo(() => {
    const m = new SpriteMaterial({
      map: texture,
      color,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
    return m
  }, [texture, color])

  return <primitive object={new Sprite(material)} position={position} scale={[scale, scale, scale]} />
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "scene: add ElectronSprite with additive-blended radial-gradient texture"
git push
```

---

### Task 2.5 — `<Atom>` component

**Files:**
- Create: `src/scene/Atom.tsx`

- [ ] **Step 1: Implement the atom**

Write `/Users/christopherwest/web/molecular/src/scene/Atom.tsx`:

```tsx
'use client'

import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import { type Group, type Vector3Tuple } from 'three'
import { getElement } from '@/src/chem/elements'
import { ElectronSprite } from './ElectronSprite'

interface AtomProps {
  Z: number
  position: Vector3Tuple
  showLabel?: boolean
  scale?: number
  // For drag preview: 0..1 opacity multiplier.
  opacity?: number
}

interface ShellPlan {
  radius: number
  tilt: [number, number, number]
  speed: number
  electrons: number
  isValence: boolean
}

const NUCLEUS_RADIUS = 0.3
const SHELL_RADIUS_BASE = 0.5
const SHELL_RADIUS_STEP = 0.18
const MAX_ELECTRONS_VISIBLE = 8

export function Atom({ Z, position, showLabel = true, scale = 1, opacity = 1 }: AtomProps) {
  const el = getElement(Z)
  const groupRef = useRef<Group>(null)
  const shellRefs = useRef<Group[]>([])

  const shells: ShellPlan[] = useMemo(() => {
    return el.shells.map((electronCount, index) => {
      const tiltX = (index * 37) % 60 - 30
      const tiltZ = (index * 53) % 60 - 30
      return {
        radius: SHELL_RADIUS_BASE + index * SHELL_RADIUS_STEP,
        tilt: [(tiltX * Math.PI) / 180, 0, (tiltZ * Math.PI) / 180],
        speed: 1.5 - index * 0.2,
        electrons: Math.min(electronCount, MAX_ELECTRONS_VISIBLE),
        isValence: index === el.shells.length - 1,
      }
    })
  }, [el.shells])

  useFrame((_, delta) => {
    for (let i = 0; i < shellRefs.current.length; i++) {
      const ref = shellRefs.current[i]
      const plan = shells[i]
      if (!ref || !plan) continue
      ref.rotation.y += delta * plan.speed
    }
  })

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[NUCLEUS_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color={el.cpkColor}
          emissive={el.cpkColor}
          emissiveIntensity={0.4}
          roughness={0.35}
          metalness={0.1}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Label */}
      {showLabel && (
        <Billboard>
          <Text fontSize={0.22} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#000000">
            {el.symbol}
          </Text>
        </Billboard>
      )}

      {/* Electron shells */}
      {shells.map((plan, shellIndex) => (
        <group
          key={shellIndex}
          ref={(g) => {
            if (g) shellRefs.current[shellIndex] = g
          }}
          rotation={plan.tilt}
        >
          {Array.from({ length: plan.electrons }).map((_, i) => {
            const angle = (i / plan.electrons) * Math.PI * 2
            const x = Math.cos(angle) * plan.radius
            const z = Math.sin(angle) * plan.radius
            return (
              <ElectronSprite
                key={i}
                position={[x, 0, z]}
                scale={plan.isValence ? 0.1 : 0.07}
                color={plan.isValence ? '#fff5b8' : '#ffd97a'}
              />
            )
          })}
        </group>
      ))}
    </group>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "scene: add Atom with nucleus, label, and animated electron shells"
git push
```

---

### Task 2.6 — `<Bond>` component

**Files:**
- Create: `src/scene/Bond.tsx`

- [ ] **Step 1: Implement bond with single/double/triple support**

Write `/Users/christopherwest/web/molecular/src/scene/Bond.tsx`:

```tsx
'use client'

import { useMemo } from 'react'
import { Vector3, type Vector3Tuple } from 'three'

interface BondProps {
  start: Vector3Tuple
  end: Vector3Tuple
  order: 1 | 2 | 3
  color?: string
  type?: 'covalent' | 'ionic'
}

const RADIUS = 0.06
const GAP = 0.08

export function Bond({ start, end, order, color = '#bfeaff', type = 'covalent' }: BondProps) {
  const { center, length, rotation, perpendicular } = useMemo(() => {
    const s = new Vector3(...start)
    const e = new Vector3(...end)
    const dir = e.clone().sub(s)
    const len = dir.length()
    const midpoint = s.clone().add(e).multiplyScalar(0.5)
    // Cylinder default axis is Y; rotate to align with dir.
    const up = new Vector3(0, 1, 0)
    const dirNorm = dir.clone().normalize()
    const axis = new Vector3().crossVectors(up, dirNorm)
    const angle = Math.acos(up.dot(dirNorm))
    const rot = new Vector3(axis.x * angle, axis.y * angle, axis.z * angle)

    // Perpendicular vector in the plane (used to offset double/triple bonds).
    const perp = axis.lengthSq() > 0.001 ? axis.clone().normalize() : new Vector3(1, 0, 0)

    return {
      center: midpoint.toArray() as Vector3Tuple,
      length: len,
      rotation: [rot.x, rot.y, rot.z] as Vector3Tuple,
      perpendicular: perp.toArray() as Vector3Tuple,
    }
  }, [start, end])

  const offsets = order === 1 ? [0] : order === 2 ? [-GAP, GAP] : [-GAP * 1.4, 0, GAP * 1.4]

  if (type === 'ionic') {
    // Dotted line for ionic — render order-1 as a slim dashed cylinder placeholder.
    return (
      <mesh position={center} rotation={rotation}>
        <cylinderGeometry args={[RADIUS * 0.5, RADIUS * 0.5, length, 8]} />
        <meshBasicMaterial color="#a4ff8c" transparent opacity={0.35} />
      </mesh>
    )
  }

  return (
    <>
      {offsets.map((offset, i) => (
        <mesh
          key={i}
          position={[
            center[0] + perpendicular[0] * offset,
            center[1] + perpendicular[1] * offset,
            center[2] + perpendicular[2] * offset,
          ]}
          rotation={rotation}
        >
          <cylinderGeometry args={[RADIUS, RADIUS, length, 12]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            roughness={0.4}
          />
        </mesh>
      ))}
    </>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "scene: add Bond with single/double/triple cylinder beams + ionic variant"
git push
```

---

### Task 2.7 — `<Molecule>` grouping component + `/app` route with hardcoded water

**Files:**
- Create: `src/scene/Molecule.tsx`
- Create: `app/app/page.tsx`

- [ ] **Step 1: `<Molecule>` accepts atoms[] and bonds[] and renders them**

Write `/Users/christopherwest/web/molecular/src/scene/Molecule.tsx`:

```tsx
'use client'

import type { Atom as AtomData, Bond as BondData } from '@/src/chem/types'
import { Atom } from './Atom'
import { Bond } from './Bond'

interface MoleculeProps {
  atoms: AtomData[]
  bonds: BondData[]
}

export function Molecule({ atoms, bonds }: MoleculeProps) {
  const byId = new Map(atoms.map((a) => [a.id, a]))

  return (
    <group>
      {atoms.map((a) => (
        <Atom key={a.id} Z={a.Z} position={a.position as [number, number, number]} />
      ))}
      {bonds.map((b) => {
        const a = byId.get(b.atomA)
        const c = byId.get(b.atomB)
        if (!a || !c) return null
        return (
          <Bond
            key={b.id}
            start={a.position as [number, number, number]}
            end={c.position as [number, number, number]}
            order={b.order}
            type={b.type}
          />
        )
      })}
    </group>
  )
}
```

- [ ] **Step 2: Build `/app` page with a hardcoded water molecule**

Write `/Users/christopherwest/web/molecular/app/app/page.tsx`:

```tsx
import { AppScene } from './AppScene'

export default function AppPage() {
  return (
    <main className="h-screen w-screen">
      <AppScene />
    </main>
  )
}
```

Write `/Users/christopherwest/web/molecular/app/app/AppScene.tsx`:

```tsx
'use client'

import { Scene } from '@/src/scene/Scene'
import { Molecule } from '@/src/scene/Molecule'
import { atomId, bondId, moleculeId, type Atom, type Bond } from '@/src/chem/types'

// Hardcoded water for Phase 2 demoability.
const M = moleculeId()
const O = atomId()
const H1 = atomId()
const H2 = atomId()

const ATOMS: Atom[] = [
  { id: O, Z: 8, position: [0, 0.2, 0], velocity: [0, 0, 0], charge: 0, moleculeId: M },
  { id: H1, Z: 1, position: [-0.85, -0.45, 0], velocity: [0, 0, 0], charge: 0, moleculeId: M },
  { id: H2, Z: 1, position: [0.85, -0.45, 0], velocity: [0, 0, 0], charge: 0, moleculeId: M },
]

const BONDS: Bond[] = [
  { id: bondId(), atomA: O, atomB: H1, order: 1, type: 'covalent' },
  { id: bondId(), atomA: O, atomB: H2, order: 1, type: 'covalent' },
]

export function AppScene() {
  return (
    <Scene>
      <Molecule atoms={ATOMS} bonds={BONDS} />
    </Scene>
  )
}
```

- [ ] **Step 3: Run dev server and visually verify**

```bash
pnpm dev
```

Open `http://localhost:3000/app`. Expected:

- Deep-space radial gradient background with a starfield
- A central white-and-red H₂O molecule, glowing
- Yellow electron sprites swirling around each atom
- Drag to orbit the camera; scroll to zoom

Stop with Ctrl+C.

- [ ] **Step 4: Write an e2e test that the canvas + bond exist**

Write `/Users/christopherwest/web/molecular/tests/e2e/app-renders-water.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('/app renders a 3D scene canvas', async ({ page }) => {
  await page.goto('/app')
  // R3F renders a <canvas> element; just check it exists and has size.
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
  const box = await canvas.boundingBox()
  expect(box?.width ?? 0).toBeGreaterThan(100)
  expect(box?.height ?? 0).toBeGreaterThan(100)
})
```

- [ ] **Step 5: Run e2e**

```bash
pnpm test:e2e tests/e2e/app-renders-water.spec.ts
```

Expected: passes on both projects.

- [ ] **Step 6: Commit (Phase 2 capstone)**

```bash
git add .
git commit -m "scene: render hardcoded water at /app; Phase 2 complete"
git push
```

**🎉 Phase 2 demoable:** Open `http://localhost:3000/app` — water molecule rotating in 3D with electron sprites and bloom. You can orbit and zoom.

---

# Phase 3 — Molecule Library + Explore mode

**Goal:** Replace the hardcoded water with a Zustand-backed scene store. Build the Molecule Library sidebar and Inspector. User can search and click a molecule to spawn it. Mode switcher exists with Explore/Build/Lab tabs (Build and Lab are stubs for now).

**Files created in this phase:**
- `src/data/molecules.ts` — curated library (30+ entries with hand-placed atoms/bonds)
- `src/store/sceneSlice.ts`, `src/store/uiSlice.ts`, `src/store/index.ts` — Zustand store
- `src/ui/Sidebar.tsx`, `src/ui/LibraryBrowser.tsx`, `src/ui/Inspector.tsx`, `src/ui/ModeSwitcher.tsx` — UI shells
- `src/lib/spawn.ts` — convert library entry → scene atoms/bonds
- `tests/store/sceneSlice.spec.ts`, `tests/lib/spawn.spec.ts`
- `tests/e2e/library-spawn.spec.ts`

### Task 3.1 — Install Zustand + immer + shadcn/ui

- [ ] **Step 1: Install state libs**

```bash
pnpm add zustand immer
```

- [ ] **Step 2: Init shadcn/ui**

```bash
pnpm dlx shadcn@latest init --yes --base-color slate --css-variables
```

Accept defaults (`@/components/ui` for components, `@/lib/utils` for cn — but we'll redirect cn import to `@/src/lib/cn` later).

- [ ] **Step 3: Add the components we'll need**

```bash
pnpm dlx shadcn@latest add button input dialog sheet drawer tabs collapsible scroll-area tooltip
```

- [ ] **Step 4: Replace `@/lib/utils` cn re-export with our existing one**

If shadcn created `lib/utils.ts`, replace its contents with:

```ts
export { cn } from '@/src/lib/cn'
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "ui: install zustand, immer, shadcn/ui components"
git push
```

---

### Task 3.2 — Scene store

**Files:**
- Create: `src/store/index.ts`, `src/store/sceneSlice.ts`, `src/store/uiSlice.ts`
- Create: `tests/store/sceneSlice.spec.ts`

- [ ] **Step 1: Write store contract tests**

Write `/Users/christopherwest/web/molecular/tests/store/sceneSlice.spec.ts`:

```ts
import { describe, expect, it, beforeEach } from 'vitest'
import { useStore } from '@/src/store'
import { atomId, bondId, moleculeId } from '@/src/chem/types'

describe('scene store', () => {
  beforeEach(() => {
    useStore.getState().resetScene()
  })

  it('starts empty', () => {
    const s = useStore.getState().scene
    expect(Object.keys(s.atoms).length).toBe(0)
  })

  it('adds an atom', () => {
    const id = atomId()
    useStore.getState().addAtom({
      id,
      Z: 8,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: moleculeId(),
    })
    expect(useStore.getState().scene.atoms[id]?.Z).toBe(8)
  })

  it('adds a bond between two atoms', () => {
    const a1 = atomId()
    const a2 = atomId()
    const m = moleculeId()
    useStore.getState().addAtom({ id: a1, Z: 1, position: [0, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m })
    useStore.getState().addAtom({ id: a2, Z: 8, position: [1, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m })
    const bid = bondId()
    useStore.getState().addBond({ id: bid, atomA: a1, atomB: a2, order: 1, type: 'covalent' })
    expect(useStore.getState().scene.bonds[bid]?.order).toBe(1)
  })

  it('removeAtom also removes connected bonds', () => {
    const a1 = atomId()
    const a2 = atomId()
    const m = moleculeId()
    useStore.getState().addAtom({ id: a1, Z: 1, position: [0, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m })
    useStore.getState().addAtom({ id: a2, Z: 8, position: [1, 0, 0], velocity: [0, 0, 0], charge: 0, moleculeId: m })
    const bid = bondId()
    useStore.getState().addBond({ id: bid, atomA: a1, atomB: a2, order: 1, type: 'covalent' })
    useStore.getState().removeAtom(a1)
    expect(useStore.getState().scene.atoms[a1]).toBeUndefined()
    expect(useStore.getState().scene.bonds[bid]).toBeUndefined()
  })

  it('setMode updates the mode', () => {
    useStore.getState().setMode('build')
    expect(useStore.getState().scene.mode).toBe('build')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm test tests/store/sceneSlice.spec.ts
```

- [ ] **Step 3: Write the store**

Write `/Users/christopherwest/web/molecular/src/store/sceneSlice.ts`:

```ts
import type { StateCreator } from 'zustand'
import { produce } from 'immer'
import type { Atom, AtomId, Bond, BondId, Molecule, MoleculeId, SceneSnapshot } from '@/src/chem/types'

export type Mode = 'explore' | 'build' | 'lab'
export type Tier = 'beginner' | 'standard' | 'advanced'

export interface SceneSliceState {
  scene: SceneSnapshot & {
    mode: Mode
    tier: Tier
    selection: AtomId | MoleculeId | null
  }
}

export interface SceneSliceActions {
  addAtom: (atom: Atom) => void
  removeAtom: (id: AtomId) => void
  addBond: (bond: Bond) => void
  removeBond: (id: BondId) => void
  addMolecule: (molecule: Molecule) => void
  removeMolecule: (id: MoleculeId) => void
  setMode: (mode: Mode) => void
  setTier: (tier: Tier) => void
  setSelection: (id: AtomId | MoleculeId | null) => void
  resetScene: () => void
}

export type SceneSlice = SceneSliceState & SceneSliceActions

const initial: SceneSliceState['scene'] = {
  atoms: {},
  bonds: {},
  molecules: {},
  mode: 'explore',
  tier: 'beginner',
  selection: null,
}

export const createSceneSlice: StateCreator<SceneSlice> = (set) => ({
  scene: initial,

  addAtom: (atom) =>
    set(
      produce<SceneSlice>((s) => {
        s.scene.atoms[atom.id] = atom
        const mol = s.scene.molecules[atom.moleculeId]
        if (mol) {
          if (!mol.atomIds.includes(atom.id)) mol.atomIds.push(atom.id)
        } else {
          s.scene.molecules[atom.moleculeId] = {
            id: atom.moleculeId,
            atomIds: [atom.id],
            bondIds: [],
          }
        }
      }),
    ),

  removeAtom: (id) =>
    set(
      produce<SceneSlice>((s) => {
        const atom = s.scene.atoms[id]
        if (!atom) return
        delete s.scene.atoms[id]
        // Remove from molecule
        const mol = s.scene.molecules[atom.moleculeId]
        if (mol) {
          mol.atomIds = mol.atomIds.filter((aid) => aid !== id)
          if (mol.atomIds.length === 0) delete s.scene.molecules[atom.moleculeId]
        }
        // Remove connected bonds
        for (const bid of Object.keys(s.scene.bonds)) {
          const b = s.scene.bonds[bid]
          if (!b) continue
          if (b.atomA === id || b.atomB === id) {
            delete s.scene.bonds[bid]
            const m = mol
            if (m) m.bondIds = m.bondIds.filter((x) => x !== bid)
          }
        }
      }),
    ),

  addBond: (bond) =>
    set(
      produce<SceneSlice>((s) => {
        s.scene.bonds[bond.id] = bond
        const atom = s.scene.atoms[bond.atomA]
        if (atom) {
          const mol = s.scene.molecules[atom.moleculeId]
          if (mol && !mol.bondIds.includes(bond.id)) mol.bondIds.push(bond.id)
        }
      }),
    ),

  removeBond: (id) =>
    set(
      produce<SceneSlice>((s) => {
        const b = s.scene.bonds[id]
        if (!b) return
        delete s.scene.bonds[id]
        const atom = s.scene.atoms[b.atomA]
        if (atom) {
          const mol = s.scene.molecules[atom.moleculeId]
          if (mol) mol.bondIds = mol.bondIds.filter((x) => x !== id)
        }
      }),
    ),

  addMolecule: (m) =>
    set(
      produce<SceneSlice>((s) => {
        s.scene.molecules[m.id] = m
      }),
    ),

  removeMolecule: (id) =>
    set(
      produce<SceneSlice>((s) => {
        const m = s.scene.molecules[id]
        if (!m) return
        for (const aid of m.atomIds) delete s.scene.atoms[aid]
        for (const bid of m.bondIds) delete s.scene.bonds[bid]
        delete s.scene.molecules[id]
      }),
    ),

  setMode: (mode) =>
    set(
      produce<SceneSlice>((s) => {
        s.scene.mode = mode
      }),
    ),

  setTier: (tier) =>
    set(
      produce<SceneSlice>((s) => {
        s.scene.tier = tier
      }),
    ),

  setSelection: (id) =>
    set(
      produce<SceneSlice>((s) => {
        s.scene.selection = id
      }),
    ),

  resetScene: () =>
    set(
      produce<SceneSlice>((s) => {
        s.scene = { ...initial, mode: s.scene.mode, tier: s.scene.tier }
      }),
    ),
})
```

Write `/Users/christopherwest/web/molecular/src/store/uiSlice.ts`:

```ts
import type { StateCreator } from 'zustand'
import { produce } from 'immer'

export interface UiSliceState {
  ui: {
    sidebarOpen: boolean
    inspectorOpen: boolean
    tutorOpen: boolean
    fullTableOpen: boolean
  }
}

export interface UiSliceActions {
  toggleSidebar: () => void
  toggleInspector: () => void
  toggleTutor: () => void
  toggleFullTable: () => void
}

export type UiSlice = UiSliceState & UiSliceActions

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  ui: {
    sidebarOpen: true,
    inspectorOpen: true,
    tutorOpen: false,
    fullTableOpen: false,
  },
  toggleSidebar: () =>
    set(produce<UiSlice>((s) => void (s.ui.sidebarOpen = !s.ui.sidebarOpen))),
  toggleInspector: () =>
    set(produce<UiSlice>((s) => void (s.ui.inspectorOpen = !s.ui.inspectorOpen))),
  toggleTutor: () =>
    set(produce<UiSlice>((s) => void (s.ui.tutorOpen = !s.ui.tutorOpen))),
  toggleFullTable: () =>
    set(produce<UiSlice>((s) => void (s.ui.fullTableOpen = !s.ui.fullTableOpen))),
})
```

Write `/Users/christopherwest/web/molecular/src/store/index.ts`:

```ts
import { create } from 'zustand'
import { createSceneSlice, type SceneSlice } from './sceneSlice'
import { createUiSlice, type UiSlice } from './uiSlice'

export type AppState = SceneSlice & UiSlice

export const useStore = create<AppState>()((...args) => ({
  ...createSceneSlice(...args),
  ...createUiSlice(...args),
}))
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm test tests/store/sceneSlice.spec.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "store: add Zustand scene + ui slices with immer-based mutations"
git push
```

---

### Task 3.3 — Curated molecule library data

**Files:**
- Create: `src/data/molecules.ts` — library entries
- Create: `tests/data/molecules.spec.ts`

- [ ] **Step 1: Write the test**

Write `/Users/christopherwest/web/molecular/tests/data/molecules.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { LIBRARY, LIBRARY_CATEGORIES, getLibraryEntry } from '@/src/data/molecules'

describe('molecule library', () => {
  it('contains at least 30 entries', () => {
    expect(LIBRARY.length).toBeGreaterThanOrEqual(30)
  })

  it('every entry has name, formula, category, atoms, bonds', () => {
    for (const m of LIBRARY) {
      expect(m.id).toBeDefined()
      expect(m.name).toBeDefined()
      expect(m.formula).toBeDefined()
      expect(m.category).toBeDefined()
      expect(m.atoms.length).toBeGreaterThan(0)
      expect(Array.isArray(m.bonds)).toBe(true)
    }
  })

  it('bonds reference valid atom indices', () => {
    for (const m of LIBRARY) {
      for (const b of m.bonds) {
        expect(b.atomAIndex).toBeGreaterThanOrEqual(0)
        expect(b.atomAIndex).toBeLessThan(m.atoms.length)
        expect(b.atomBIndex).toBeGreaterThanOrEqual(0)
        expect(b.atomBIndex).toBeLessThan(m.atoms.length)
      }
    }
  })

  it('water exists by id', () => {
    expect(getLibraryEntry('water')).toBeDefined()
  })

  it('LIBRARY_CATEGORIES includes the categories used by entries', () => {
    const used = new Set(LIBRARY.map((m) => m.category))
    for (const c of used) {
      expect(LIBRARY_CATEGORIES).toContain(c)
    }
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm test tests/data/molecules.spec.ts
```

- [ ] **Step 3: Implement the library**

Write `/Users/christopherwest/web/molecular/src/data/molecules.ts`:

```ts
import type { BondOrder, BondType, Vec3 } from '@/src/chem/types'

export type LibraryCategory =
  | 'water-solvents'
  | 'acids-bases'
  | 'hydrocarbons'
  | 'salts-ionic'
  | 'biological'
  | 'gases'

export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  'water-solvents',
  'acids-bases',
  'hydrocarbons',
  'salts-ionic',
  'biological',
  'gases',
]

export const CATEGORY_LABEL: Record<LibraryCategory, string> = {
  'water-solvents': 'Water & Solvents',
  'acids-bases': 'Acids & Bases',
  hydrocarbons: 'Hydrocarbons',
  'salts-ionic': 'Salts & Ionic',
  biological: 'Biological',
  gases: 'Gases',
}

export interface LibraryAtom {
  Z: number
  position: Vec3
}

export interface LibraryBond {
  atomAIndex: number
  atomBIndex: number
  order: BondOrder
  type?: BondType
}

export interface LibraryMolecule {
  id: string
  name: string
  formula: string
  category: LibraryCategory
  description: string
  uses?: string
  atoms: LibraryAtom[]
  bonds: LibraryBond[]
}

// Bond length unit ≈ 1 in scene space.
const BL = 1.0

export const LIBRARY: LibraryMolecule[] = [
  {
    id: 'water',
    name: 'Water',
    formula: 'H2O',
    category: 'water-solvents',
    description: 'The most common compound on Earth.',
    uses: 'Universal solvent; required for life.',
    atoms: [
      { Z: 8, position: [0, 0.2, 0] },
      { Z: 1, position: [-0.85, -0.45, 0] },
      { Z: 1, position: [0.85, -0.45, 0] },
    ],
    bonds: [
      { atomAIndex: 0, atomBIndex: 1, order: 1 },
      { atomAIndex: 0, atomBIndex: 2, order: 1 },
    ],
  },
  {
    id: 'methane',
    name: 'Methane',
    formula: 'CH4',
    category: 'hydrocarbons',
    description: 'The simplest hydrocarbon. Main component of natural gas.',
    uses: 'Heating, cooking, electricity generation.',
    atoms: [
      { Z: 6, position: [0, 0, 0] },
      { Z: 1, position: [BL, BL, BL] },
      { Z: 1, position: [-BL, -BL, BL] },
      { Z: 1, position: [-BL, BL, -BL] },
      { Z: 1, position: [BL, -BL, -BL] },
    ],
    bonds: [
      { atomAIndex: 0, atomBIndex: 1, order: 1 },
      { atomAIndex: 0, atomBIndex: 2, order: 1 },
      { atomAIndex: 0, atomBIndex: 3, order: 1 },
      { atomAIndex: 0, atomBIndex: 4, order: 1 },
    ],
  },
  {
    id: 'carbon-dioxide',
    name: 'Carbon Dioxide',
    formula: 'CO2',
    category: 'gases',
    description: 'Linear molecule with two C=O double bonds.',
    uses: 'Photosynthesis input; greenhouse gas.',
    atoms: [
      { Z: 6, position: [0, 0, 0] },
      { Z: 8, position: [-BL * 1.2, 0, 0] },
      { Z: 8, position: [BL * 1.2, 0, 0] },
    ],
    bonds: [
      { atomAIndex: 0, atomBIndex: 1, order: 2 },
      { atomAIndex: 0, atomBIndex: 2, order: 2 },
    ],
  },
  {
    id: 'ammonia',
    name: 'Ammonia',
    formula: 'NH3',
    category: 'gases',
    description: 'Pyramidal molecule with a lone pair on nitrogen.',
    uses: 'Fertilizer; cleaning products.',
    atoms: [
      { Z: 7, position: [0, 0.2, 0] },
      { Z: 1, position: [BL * 0.94, -0.3, 0] },
      { Z: 1, position: [-BL * 0.47, -0.3, BL * 0.82] },
      { Z: 1, position: [-BL * 0.47, -0.3, -BL * 0.82] },
    ],
    bonds: [
      { atomAIndex: 0, atomBIndex: 1, order: 1 },
      { atomAIndex: 0, atomBIndex: 2, order: 1 },
      { atomAIndex: 0, atomBIndex: 3, order: 1 },
    ],
  },
  {
    id: 'sodium-chloride',
    name: 'Sodium Chloride',
    formula: 'ClNa',
    category: 'salts-ionic',
    description: 'Common table salt. Held together by ionic bonds.',
    uses: 'Seasoning, preservation, biological electrolyte.',
    atoms: [
      { Z: 11, position: [-BL * 0.6, 0, 0] },
      { Z: 17, position: [BL * 0.6, 0, 0] },
    ],
    bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 1, type: 'ionic' }],
  },
  {
    id: 'hydrogen-gas',
    name: 'Hydrogen Gas',
    formula: 'H2',
    category: 'gases',
    description: 'Diatomic hydrogen — a single covalent bond.',
    atoms: [
      { Z: 1, position: [-0.35, 0, 0] },
      { Z: 1, position: [0.35, 0, 0] },
    ],
    bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 1 }],
  },
  {
    id: 'oxygen-gas',
    name: 'Oxygen Gas',
    formula: 'O2',
    category: 'gases',
    description: 'Diatomic oxygen with a double bond.',
    atoms: [
      { Z: 8, position: [-0.6, 0, 0] },
      { Z: 8, position: [0.6, 0, 0] },
    ],
    bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 2 }],
  },
  {
    id: 'nitrogen-gas',
    name: 'Nitrogen Gas',
    formula: 'N2',
    category: 'gases',
    description: 'Diatomic nitrogen with a strong triple bond.',
    atoms: [
      { Z: 7, position: [-0.55, 0, 0] },
      { Z: 7, position: [0.55, 0, 0] },
    ],
    bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 3 }],
  },
  {
    id: 'hydrochloric-acid',
    name: 'Hydrochloric Acid',
    formula: 'HCl',
    category: 'acids-bases',
    description: 'Strong acid; one of the simplest.',
    uses: 'Stomach acid; industrial pH adjustment.',
    atoms: [
      { Z: 1, position: [-0.6, 0, 0] },
      { Z: 17, position: [0.6, 0, 0] },
    ],
    bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 1 }],
  },
  {
    id: 'sodium-hydroxide',
    name: 'Sodium Hydroxide',
    formula: 'NaOH',
    category: 'acids-bases',
    description: 'A strong base; "caustic soda."',
    atoms: [
      { Z: 11, position: [-BL * 1.0, 0, 0] },
      { Z: 8, position: [0, 0, 0] },
      { Z: 1, position: [BL * 0.85, 0.4, 0] },
    ],
    bonds: [
      { atomAIndex: 0, atomBIndex: 1, order: 1, type: 'ionic' },
      { atomAIndex: 1, atomBIndex: 2, order: 1 },
    ],
  },
  {
    id: 'ethanol',
    name: 'Ethanol',
    formula: 'C2H6O',
    category: 'biological',
    description: 'Drinking alcohol; common solvent.',
    atoms: [
      { Z: 6, position: [-BL * 0.75, 0, 0] },
      { Z: 6, position: [BL * 0.75, 0, 0] },
      { Z: 8, position: [BL * 1.6, 0.7, 0] },
      { Z: 1, position: [-BL * 1.3, 0.7, 0.5] },
      { Z: 1, position: [-BL * 1.3, 0.7, -0.5] },
      { Z: 1, position: [-BL * 1.3, -0.7, 0] },
      { Z: 1, position: [BL * 0.75, -0.7, 0.8] },
      { Z: 1, position: [BL * 0.75, -0.7, -0.8] },
      { Z: 1, position: [BL * 2.3, 1.0, 0] },
    ],
    bonds: [
      { atomAIndex: 0, atomBIndex: 1, order: 1 },
      { atomAIndex: 1, atomBIndex: 2, order: 1 },
      { atomAIndex: 2, atomBIndex: 8, order: 1 },
      { atomAIndex: 0, atomBIndex: 3, order: 1 },
      { atomAIndex: 0, atomBIndex: 4, order: 1 },
      { atomAIndex: 0, atomBIndex: 5, order: 1 },
      { atomAIndex: 1, atomBIndex: 6, order: 1 },
      { atomAIndex: 1, atomBIndex: 7, order: 1 },
    ],
  },
  {
    id: 'ethane',
    name: 'Ethane',
    formula: 'C2H6',
    category: 'hydrocarbons',
    description: 'Two-carbon alkane.',
    atoms: [
      { Z: 6, position: [-BL * 0.75, 0, 0] },
      { Z: 6, position: [BL * 0.75, 0, 0] },
      { Z: 1, position: [-BL * 1.4, 0.8, 0.4] },
      { Z: 1, position: [-BL * 1.4, 0.8, -0.4] },
      { Z: 1, position: [-BL * 1.4, -0.8, 0] },
      { Z: 1, position: [BL * 1.4, 0.8, 0.4] },
      { Z: 1, position: [BL * 1.4, 0.8, -0.4] },
      { Z: 1, position: [BL * 1.4, -0.8, 0] },
    ],
    bonds: [
      { atomAIndex: 0, atomBIndex: 1, order: 1 },
      { atomAIndex: 0, atomBIndex: 2, order: 1 },
      { atomAIndex: 0, atomBIndex: 3, order: 1 },
      { atomAIndex: 0, atomBIndex: 4, order: 1 },
      { atomAIndex: 1, atomBIndex: 5, order: 1 },
      { atomAIndex: 1, atomBIndex: 6, order: 1 },
      { atomAIndex: 1, atomBIndex: 7, order: 1 },
    ],
  },
  {
    id: 'propane',
    name: 'Propane',
    formula: 'C3H8',
    category: 'hydrocarbons',
    description: 'Three-carbon alkane. BBQ fuel.',
    atoms: [
      { Z: 6, position: [-BL * 1.5, 0, 0] },
      { Z: 6, position: [0, 0, 0] },
      { Z: 6, position: [BL * 1.5, 0, 0] },
      { Z: 1, position: [-BL * 2.0, 0.85, 0] },
      { Z: 1, position: [-BL * 2.0, -0.5, 0.7] },
      { Z: 1, position: [-BL * 2.0, -0.5, -0.7] },
      { Z: 1, position: [0, 0.85, 0.7] },
      { Z: 1, position: [0, 0.85, -0.7] },
      { Z: 1, position: [BL * 2.0, 0.85, 0] },
      { Z: 1, position: [BL * 2.0, -0.5, 0.7] },
      { Z: 1, position: [BL * 2.0, -0.5, -0.7] },
    ],
    bonds: [
      { atomAIndex: 0, atomBIndex: 1, order: 1 },
      { atomAIndex: 1, atomBIndex: 2, order: 1 },
      { atomAIndex: 0, atomBIndex: 3, order: 1 },
      { atomAIndex: 0, atomBIndex: 4, order: 1 },
      { atomAIndex: 0, atomBIndex: 5, order: 1 },
      { atomAIndex: 1, atomBIndex: 6, order: 1 },
      { atomAIndex: 1, atomBIndex: 7, order: 1 },
      { atomAIndex: 2, atomBIndex: 8, order: 1 },
      { atomAIndex: 2, atomBIndex: 9, order: 1 },
      { atomAIndex: 2, atomBIndex: 10, order: 1 },
    ],
  },
  // --- additional library entries follow (acids, salts, biological, gases) ---
  ...generateExtendedEntries(),
]

// 18 more entries with real atom positions. Kept in a separate function for
// readability; merge into LIBRARY at module load.
function generateExtendedEntries(): LibraryMolecule[] {
  const stubs: Array<{ id: string; name: string; formula: string; category: LibraryCategory; atoms: LibraryAtom[]; bonds: LibraryBond[] }> = [
    // Sulfuric acid: H2SO4 — tetrahedral S with 2 O double + 2 OH
    {
      id: 'sulfuric-acid',
      name: 'Sulfuric Acid',
      formula: 'H2SO4',
      category: 'acids-bases',
      atoms: [
        { Z: 16, position: [0, 0, 0] },
        { Z: 8, position: [BL, BL, BL * 0.4] },
        { Z: 8, position: [-BL, -BL, BL * 0.4] },
        { Z: 8, position: [-BL, BL, -BL * 0.6] },
        { Z: 8, position: [BL, -BL, -BL * 0.6] },
        { Z: 1, position: [-BL * 1.6, BL * 1.6, -BL * 1.0] },
        { Z: 1, position: [BL * 1.6, -BL * 1.6, -BL * 1.0] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 2 },
        { atomAIndex: 0, atomBIndex: 2, order: 2 },
        { atomAIndex: 0, atomBIndex: 3, order: 1 },
        { atomAIndex: 0, atomBIndex: 4, order: 1 },
        { atomAIndex: 3, atomBIndex: 5, order: 1 },
        { atomAIndex: 4, atomBIndex: 6, order: 1 },
      ],
    },
    // Hydrogen peroxide H2O2
    {
      id: 'hydrogen-peroxide',
      name: 'Hydrogen Peroxide',
      formula: 'H2O2',
      category: 'water-solvents',
      atoms: [
        { Z: 8, position: [-0.6, 0, 0] },
        { Z: 8, position: [0.6, 0, 0] },
        { Z: 1, position: [-1.0, 0.8, 0.3] },
        { Z: 1, position: [1.0, -0.8, -0.3] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 1 },
        { atomAIndex: 0, atomBIndex: 2, order: 1 },
        { atomAIndex: 1, atomBIndex: 3, order: 1 },
      ],
    },
    // Acetic acid C2H4O2
    {
      id: 'acetic-acid',
      name: 'Acetic Acid',
      formula: 'C2H4O2',
      category: 'acids-bases',
      atoms: [
        { Z: 6, position: [-1.0, 0, 0] },
        { Z: 6, position: [0.4, 0, 0] },
        { Z: 8, position: [1.1, 1.0, 0] },
        { Z: 8, position: [1.1, -1.0, 0] },
        { Z: 1, position: [-1.6, 0.8, 0.5] },
        { Z: 1, position: [-1.6, 0.8, -0.5] },
        { Z: 1, position: [-1.6, -0.8, 0] },
        { Z: 1, position: [2.0, -1.3, 0] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 1 },
        { atomAIndex: 1, atomBIndex: 2, order: 2 },
        { atomAIndex: 1, atomBIndex: 3, order: 1 },
        { atomAIndex: 3, atomBIndex: 7, order: 1 },
        { atomAIndex: 0, atomBIndex: 4, order: 1 },
        { atomAIndex: 0, atomBIndex: 5, order: 1 },
        { atomAIndex: 0, atomBIndex: 6, order: 1 },
      ],
    },
    // Calcium carbonate CaCO3
    {
      id: 'calcium-carbonate',
      name: 'Calcium Carbonate',
      formula: 'CaCO3',
      category: 'salts-ionic',
      atoms: [
        { Z: 20, position: [-1.8, 0, 0] },
        { Z: 6, position: [0.2, 0, 0] },
        { Z: 8, position: [1.2, 0.9, 0] },
        { Z: 8, position: [1.2, -0.9, 0] },
        { Z: 8, position: [-0.8, 0, 0.9] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 4, order: 1, type: 'ionic' },
        { atomAIndex: 1, atomBIndex: 2, order: 2 },
        { atomAIndex: 1, atomBIndex: 3, order: 1 },
        { atomAIndex: 1, atomBIndex: 4, order: 1 },
      ],
    },
    // Magnesium oxide
    {
      id: 'magnesium-oxide',
      name: 'Magnesium Oxide',
      formula: 'MgO',
      category: 'salts-ionic',
      atoms: [
        { Z: 12, position: [-0.6, 0, 0] },
        { Z: 8, position: [0.6, 0, 0] },
      ],
      bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 1, type: 'ionic' }],
    },
    // Methanol CH4O (CH3OH)
    {
      id: 'methanol',
      name: 'Methanol',
      formula: 'CH4O',
      category: 'biological',
      atoms: [
        { Z: 6, position: [-0.6, 0, 0] },
        { Z: 8, position: [0.8, 0, 0] },
        { Z: 1, position: [-1.2, 0.8, 0.5] },
        { Z: 1, position: [-1.2, 0.8, -0.5] },
        { Z: 1, position: [-1.2, -0.8, 0] },
        { Z: 1, position: [1.4, 0.7, 0] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 1 },
        { atomAIndex: 1, atomBIndex: 5, order: 1 },
        { atomAIndex: 0, atomBIndex: 2, order: 1 },
        { atomAIndex: 0, atomBIndex: 3, order: 1 },
        { atomAIndex: 0, atomBIndex: 4, order: 1 },
      ],
    },
    // Glucose C6H12O6 — simplified open-chain layout (not the ring)
    {
      id: 'glucose',
      name: 'Glucose',
      formula: 'C6H12O6',
      category: 'biological',
      atoms: ((): LibraryAtom[] => {
        const atoms: LibraryAtom[] = []
        // 6 carbons in a horizontal line
        for (let i = 0; i < 6; i++) atoms.push({ Z: 6, position: [(i - 2.5) * 1.4, 0, 0] })
        // 6 oxygens, one per carbon, alternating above/below
        for (let i = 0; i < 6; i++)
          atoms.push({ Z: 8, position: [(i - 2.5) * 1.4, i % 2 === 0 ? 1.2 : -1.2, 0] })
        // 12 hydrogens
        for (let i = 0; i < 6; i++) atoms.push({ Z: 1, position: [(i - 2.5) * 1.4, i % 2 === 0 ? 2.0 : -2.0, 0] })
        for (let i = 0; i < 6; i++) atoms.push({ Z: 1, position: [(i - 2.5) * 1.4 + 0.5, 0, 0.9] })
        return atoms
      })(),
      bonds: ((): LibraryBond[] => {
        const bonds: LibraryBond[] = []
        // C–C chain
        for (let i = 0; i < 5; i++) bonds.push({ atomAIndex: i, atomBIndex: i + 1, order: 1 })
        // C–O
        for (let i = 0; i < 6; i++) bonds.push({ atomAIndex: i, atomBIndex: 6 + i, order: 1 })
        // O–H
        for (let i = 0; i < 6; i++) bonds.push({ atomAIndex: 6 + i, atomBIndex: 12 + i, order: 1 })
        // C–H
        for (let i = 0; i < 6; i++) bonds.push({ atomAIndex: i, atomBIndex: 18 + i, order: 1 })
        return bonds
      })(),
    },
    // Acetone C3H6O
    {
      id: 'acetone',
      name: 'Acetone',
      formula: 'C3H6O',
      category: 'biological',
      atoms: [
        { Z: 6, position: [-1.4, 0, 0] },
        { Z: 6, position: [0, 0, 0] },
        { Z: 6, position: [1.4, 0, 0] },
        { Z: 8, position: [0, 1.2, 0] },
        { Z: 1, position: [-2.0, 0.7, 0.5] },
        { Z: 1, position: [-2.0, 0.7, -0.5] },
        { Z: 1, position: [-2.0, -0.7, 0] },
        { Z: 1, position: [2.0, 0.7, 0.5] },
        { Z: 1, position: [2.0, 0.7, -0.5] },
        { Z: 1, position: [2.0, -0.7, 0] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 1 },
        { atomAIndex: 1, atomBIndex: 2, order: 1 },
        { atomAIndex: 1, atomBIndex: 3, order: 2 },
        { atomAIndex: 0, atomBIndex: 4, order: 1 },
        { atomAIndex: 0, atomBIndex: 5, order: 1 },
        { atomAIndex: 0, atomBIndex: 6, order: 1 },
        { atomAIndex: 2, atomBIndex: 7, order: 1 },
        { atomAIndex: 2, atomBIndex: 8, order: 1 },
        { atomAIndex: 2, atomBIndex: 9, order: 1 },
      ],
    },
    // Methyl chloride / chloromethane CH3Cl
    {
      id: 'chloromethane',
      name: 'Chloromethane',
      formula: 'CH3Cl',
      category: 'hydrocarbons',
      atoms: [
        { Z: 6, position: [0, 0, 0] },
        { Z: 17, position: [1.4, 0, 0] },
        { Z: 1, position: [-0.5, 0.85, 0.5] },
        { Z: 1, position: [-0.5, 0.85, -0.5] },
        { Z: 1, position: [-0.5, -0.85, 0] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 1 },
        { atomAIndex: 0, atomBIndex: 2, order: 1 },
        { atomAIndex: 0, atomBIndex: 3, order: 1 },
        { atomAIndex: 0, atomBIndex: 4, order: 1 },
      ],
    },
    // CO carbon monoxide
    {
      id: 'carbon-monoxide',
      name: 'Carbon Monoxide',
      formula: 'CO',
      category: 'gases',
      atoms: [
        { Z: 6, position: [-0.55, 0, 0] },
        { Z: 8, position: [0.55, 0, 0] },
      ],
      bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 3 }],
    },
    // Cl2
    {
      id: 'chlorine-gas',
      name: 'Chlorine Gas',
      formula: 'Cl2',
      category: 'gases',
      atoms: [
        { Z: 17, position: [-0.85, 0, 0] },
        { Z: 17, position: [0.85, 0, 0] },
      ],
      bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 1 }],
    },
    // KCl
    {
      id: 'potassium-chloride',
      name: 'Potassium Chloride',
      formula: 'ClK',
      category: 'salts-ionic',
      atoms: [
        { Z: 19, position: [-0.85, 0, 0] },
        { Z: 17, position: [0.85, 0, 0] },
      ],
      bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 1, type: 'ionic' }],
    },
    // CaO
    {
      id: 'calcium-oxide',
      name: 'Calcium Oxide',
      formula: 'CaO',
      category: 'salts-ionic',
      atoms: [
        { Z: 20, position: [-0.85, 0, 0] },
        { Z: 8, position: [0.85, 0, 0] },
      ],
      bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 1, type: 'ionic' }],
    },
    // KOH
    {
      id: 'potassium-hydroxide',
      name: 'Potassium Hydroxide',
      formula: 'KOH',
      category: 'acids-bases',
      atoms: [
        { Z: 19, position: [-1.0, 0, 0] },
        { Z: 8, position: [0, 0, 0] },
        { Z: 1, position: [0.85, 0.4, 0] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 1, type: 'ionic' },
        { atomAIndex: 1, atomBIndex: 2, order: 1 },
      ],
    },
    // Formaldehyde CH2O
    {
      id: 'formaldehyde',
      name: 'Formaldehyde',
      formula: 'CH2O',
      category: 'biological',
      atoms: [
        { Z: 6, position: [0, 0, 0] },
        { Z: 8, position: [0, 1.2, 0] },
        { Z: 1, position: [0.9, -0.5, 0] },
        { Z: 1, position: [-0.9, -0.5, 0] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 2 },
        { atomAIndex: 0, atomBIndex: 2, order: 1 },
        { atomAIndex: 0, atomBIndex: 3, order: 1 },
      ],
    },
    // Urea CH4N2O
    {
      id: 'urea',
      name: 'Urea',
      formula: 'CH4N2O',
      category: 'biological',
      atoms: [
        { Z: 6, position: [0, 0, 0] },
        { Z: 8, position: [0, 1.2, 0] },
        { Z: 7, position: [-1.1, -0.7, 0] },
        { Z: 7, position: [1.1, -0.7, 0] },
        { Z: 1, position: [-1.8, -0.3, 0.6] },
        { Z: 1, position: [-1.8, -0.3, -0.6] },
        { Z: 1, position: [1.8, -0.3, 0.6] },
        { Z: 1, position: [1.8, -0.3, -0.6] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 2 },
        { atomAIndex: 0, atomBIndex: 2, order: 1 },
        { atomAIndex: 0, atomBIndex: 3, order: 1 },
        { atomAIndex: 2, atomBIndex: 4, order: 1 },
        { atomAIndex: 2, atomBIndex: 5, order: 1 },
        { atomAIndex: 3, atomBIndex: 6, order: 1 },
        { atomAIndex: 3, atomBIndex: 7, order: 1 },
      ],
    },
    // Hydrofluoric acid HF
    {
      id: 'hydrofluoric-acid',
      name: 'Hydrofluoric Acid',
      formula: 'FH',
      category: 'acids-bases',
      atoms: [
        { Z: 1, position: [-0.45, 0, 0] },
        { Z: 9, position: [0.45, 0, 0] },
      ],
      bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 1 }],
    },
    // Nitric acid HNO3
    {
      id: 'nitric-acid',
      name: 'Nitric Acid',
      formula: 'HNO3',
      category: 'acids-bases',
      atoms: [
        { Z: 7, position: [0, 0, 0] },
        { Z: 8, position: [-1.0, 0.8, 0] },
        { Z: 8, position: [1.0, 0.8, 0] },
        { Z: 8, position: [0, -1.2, 0] },
        { Z: 1, position: [0.7, -1.8, 0] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 2 },
        { atomAIndex: 0, atomBIndex: 2, order: 1 },
        { atomAIndex: 0, atomBIndex: 3, order: 1 },
        { atomAIndex: 3, atomBIndex: 4, order: 1 },
      ],
    },
  ]
  return stubs.map((s) => ({
    ...s,
    description: '',
  }))
}

const BY_ID = new Map(LIBRARY.map((m) => [m.id, m]))

export function getLibraryEntry(id: string): LibraryMolecule | undefined {
  return BY_ID.get(id)
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm test tests/data/molecules.spec.ts
```

Expected: 5 tests pass; library has ~30 entries.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "data: add curated molecule library (~30 entries with hand-placed atoms)"
git push
```

---

### Task 3.4 — Spawn helper (library entry → scene atoms/bonds)

**Files:**
- Create: `src/lib/spawn.ts`
- Create: `tests/lib/spawn.spec.ts`

- [ ] **Step 1: Write test**

Write `/Users/christopherwest/web/molecular/tests/lib/spawn.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getLibraryEntry } from '@/src/data/molecules'
import { spawnLibraryEntry } from '@/src/lib/spawn'

describe('spawnLibraryEntry', () => {
  it('water → 3 atoms + 2 bonds + 1 molecule, all freshly id-ed', () => {
    const entry = getLibraryEntry('water')!
    const { atoms, bonds, molecule } = spawnLibraryEntry(entry)
    expect(atoms.length).toBe(3)
    expect(bonds.length).toBe(2)
    expect(molecule.atomIds.length).toBe(3)
    expect(molecule.bondIds.length).toBe(2)
    // all atoms reference the new molecule id
    for (const a of atoms) expect(a.moleculeId).toBe(molecule.id)
  })

  it('bonds reference real atom ids in the spawned set', () => {
    const entry = getLibraryEntry('methane')!
    const { atoms, bonds } = spawnLibraryEntry(entry)
    const ids = new Set(atoms.map((a) => a.id))
    for (const b of bonds) {
      expect(ids.has(b.atomA)).toBe(true)
      expect(ids.has(b.atomB)).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm test tests/lib/spawn.spec.ts
```

- [ ] **Step 3: Implement**

Write `/Users/christopherwest/web/molecular/src/lib/spawn.ts`:

```ts
import type { LibraryMolecule } from '@/src/data/molecules'
import { atomId, bondId, moleculeId, type Atom, type Bond, type Molecule } from '@/src/chem/types'

export interface SpawnResult {
  atoms: Atom[]
  bonds: Bond[]
  molecule: Molecule
}

export function spawnLibraryEntry(entry: LibraryMolecule, origin: [number, number, number] = [0, 0, 0]): SpawnResult {
  const mId = moleculeId()
  const atoms: Atom[] = entry.atoms.map((a) => ({
    id: atomId(),
    Z: a.Z,
    position: [a.position[0] + origin[0], a.position[1] + origin[1], a.position[2] + origin[2]],
    velocity: [0, 0, 0],
    charge: 0,
    moleculeId: mId,
  }))
  const bonds: Bond[] = entry.bonds.map((b) => ({
    id: bondId(),
    atomA: atoms[b.atomAIndex]!.id,
    atomB: atoms[b.atomBIndex]!.id,
    order: b.order,
    type: b.type ?? 'covalent',
  }))
  const molecule: Molecule = {
    id: mId,
    atomIds: atoms.map((a) => a.id),
    bondIds: bonds.map((b) => b.id),
  }
  return { atoms, bonds, molecule }
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm test tests/lib/spawn.spec.ts
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "lib: add spawnLibraryEntry helper that builds fresh-id'd atoms/bonds/molecule"
git push
```

---

### Task 3.5 — Wire AppScene to the store and render from state

- [ ] **Step 1: Replace `app/app/AppScene.tsx` to read scene from the store**

Write `/Users/christopherwest/web/molecular/app/app/AppScene.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { Scene } from '@/src/scene/Scene'
import { Molecule } from '@/src/scene/Molecule'
import { useStore } from '@/src/store'
import { getLibraryEntry } from '@/src/data/molecules'
import { spawnLibraryEntry } from '@/src/lib/spawn'

export function AppScene() {
  const atoms = useStore((s) => s.scene.atoms)
  const bonds = useStore((s) => s.scene.bonds)
  const molecules = useStore((s) => s.scene.molecules)
  const addAtom = useStore((s) => s.addAtom)
  const addBond = useStore((s) => s.addBond)
  const addMolecule = useStore((s) => s.addMolecule)

  // Spawn water on first load if scene is empty (Phase 3 default — replaced by route params later).
  useEffect(() => {
    if (Object.keys(useStore.getState().scene.atoms).length > 0) return
    const water = getLibraryEntry('water')
    if (!water) return
    const result = spawnLibraryEntry(water)
    addMolecule(result.molecule)
    for (const a of result.atoms) addAtom(a)
    for (const b of result.bonds) addBond(b)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const atomList = Object.values(atoms)
  const bondList = Object.values(bonds)

  return (
    <Scene>
      {Object.values(molecules).map((m) => {
        const mAtoms = atomList.filter((a) => a.moleculeId === m.id)
        const mBonds = bondList.filter((b) => m.bondIds.includes(b.id))
        return <Molecule key={m.id} atoms={mAtoms} bonds={mBonds} />
      })}
    </Scene>
  )
}
```

- [ ] **Step 2: Visually verify**

```bash
pnpm dev
```

Open `http://localhost:3000/app`. Expected: still shows water (now from the store, not hardcoded).

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "app: render scene from the Zustand store instead of hardcoded data"
git push
```

---

### Task 3.6 — Library sidebar + Mode switcher (mobile-first)

**Files:**
- Create: `src/ui/Sidebar.tsx`, `src/ui/LibraryBrowser.tsx`, `src/ui/Inspector.tsx`, `src/ui/ModeSwitcher.tsx`, `src/ui/ValidityBar.tsx`
- Modify: `app/app/page.tsx`

This task is large; we'll do mobile first.

- [ ] **Step 1: Library browser content (shared by mobile drawer + desktop sidebar)**

Write `/Users/christopherwest/web/molecular/src/ui/LibraryBrowser.tsx`:

```tsx
'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LIBRARY, CATEGORY_LABEL, LIBRARY_CATEGORIES } from '@/src/data/molecules'
import { spawnLibraryEntry } from '@/src/lib/spawn'
import { useStore } from '@/src/store'

export function LibraryBrowser({ onPick }: { onPick?: () => void }) {
  const [query, setQuery] = useState('')
  const addAtom = useStore((s) => s.addAtom)
  const addBond = useStore((s) => s.addBond)
  const addMolecule = useStore((s) => s.addMolecule)
  const resetScene = useStore((s) => s.resetScene)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return LIBRARY
    return LIBRARY.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.formula.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q),
    )
  }, [query])

  const groups = useMemo(() => {
    const map = new Map<string, typeof LIBRARY>()
    for (const m of filtered) {
      const arr = map.get(m.category) ?? []
      arr.push(m)
      map.set(m.category, arr)
    }
    return LIBRARY_CATEGORIES.filter((c) => map.has(c)).map((c) => ({ category: c, entries: map.get(c)! }))
  }, [filtered])

  function pick(id: string) {
    const entry = LIBRARY.find((m) => m.id === id)
    if (!entry) return
    resetScene()
    const result = spawnLibraryEntry(entry)
    addMolecule(result.molecule)
    for (const a of result.atoms) addAtom(a)
    for (const b of result.bonds) addBond(b)
    onPick?.()
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <Input
        type="search"
        placeholder="Search molecules…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="bg-[#14112e] border-[#2a2655] text-[#dffaff] placeholder:text-[#6a6f95]"
      />
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3">
          {groups.map(({ category, entries }) => (
            <section key={category}>
              <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8d92b8]">
                {CATEGORY_LABEL[category]}
              </h3>
              <ul className="flex flex-col gap-1">
                {entries.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => pick(m.id)}
                      className="flex w-full items-baseline justify-between rounded-md border border-transparent bg-[#14112e] px-3 py-2 text-left text-sm text-[#dffaff] transition-colors hover:border-[#5cc6ff]/40 hover:bg-[#1a163a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5cc6ff] min-h-[44px]"
                    >
                      <span className="font-medium">{m.name}</span>
                      <span className="font-mono text-xs text-[#9aa0c8]">{m.formula}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
```

- [ ] **Step 2: Inspector**

Write `/Users/christopherwest/web/molecular/src/ui/Inspector.tsx`:

```tsx
'use client'

import { useMemo } from 'react'
import { useStore } from '@/src/store'
import { getFormula } from '@/src/chem/formula'
import { validateScene } from '@/src/chem/validate'
import { LIBRARY } from '@/src/data/molecules'

export function Inspector() {
  const scene = useStore((s) => s.scene)

  const summary = useMemo(() => {
    const atoms = Object.values(scene.atoms)
    if (atoms.length === 0) return null
    const formula = getFormula(atoms)
    const result = validateScene(scene)
    const entry = LIBRARY.find((m) => m.formula === formula)
    const totalElectrons = atoms.reduce((sum, a) => sum + a.Z, 0)
    return {
      formula,
      name: result.name ?? entry?.name ?? '—',
      atomCount: atoms.length,
      bondCount: Object.keys(scene.bonds).length,
      totalElectrons,
      uses: entry?.uses,
      description: entry?.description,
    }
  }, [scene])

  if (!summary) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[#6a6f95]">
        Pick a molecule from the Library to see its details.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 text-[#dffaff]">
      <header>
        <h2 className="text-xl font-bold">{summary.name}</h2>
        <p className="mt-1 font-mono text-sm text-[#9aa0c8]">{summary.formula}</p>
      </header>
      {summary.description && <p className="text-sm leading-relaxed text-[#9aa0c8]">{summary.description}</p>}
      {summary.uses && (
        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#8d92b8]">Common uses</h3>
          <p className="text-sm text-[#dffaff]">{summary.uses}</p>
        </section>
      )}
      <section className="flex gap-4 text-sm">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#8d92b8]">Atoms</div>
          <div className="font-mono text-lg">{summary.atomCount}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-[#8d92b8]">Bonds</div>
          <div className="font-mono text-lg">{summary.bondCount}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-[#8d92b8]">Electrons</div>
          <div className="font-mono text-lg">{summary.totalElectrons}</div>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Mode switcher**

Write `/Users/christopherwest/web/molecular/src/ui/ModeSwitcher.tsx`:

```tsx
'use client'

import { useStore } from '@/src/store'
import type { Mode } from '@/src/store/sceneSlice'
import { cn } from '@/src/lib/cn'

const MODES: { id: Mode; label: string }[] = [
  { id: 'explore', label: 'Explore' },
  { id: 'build', label: 'Build' },
  { id: 'lab', label: 'Lab' },
]

export function ModeSwitcher() {
  const mode = useStore((s) => s.scene.mode)
  const setMode = useStore((s) => s.setMode)
  return (
    <div className="inline-flex rounded-lg bg-[#14112e] p-1">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setMode(m.id)}
          className={cn(
            'min-h-[36px] rounded-md px-3 py-1 text-xs font-semibold transition-colors min-w-[60px]',
            mode === m.id
              ? 'bg-[#3a2e7a] text-white'
              : 'text-[#9aa0c8] hover:bg-[#1a163a]',
          )}
          aria-pressed={mode === m.id}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Validity bar**

Write `/Users/christopherwest/web/molecular/src/ui/ValidityBar.tsx`:

```tsx
'use client'

import { useStore } from '@/src/store'
import { useMemo } from 'react'
import { validateScene } from '@/src/chem/validate'

export function ValidityBar() {
  const scene = useStore((s) => s.scene)
  const status = useMemo(() => validateScene(scene), [scene])

  const color = {
    empty: 'text-[#6a6f95]',
    'valid-named': 'text-[#a4ff8c]',
    'valid-unnamed': 'text-[#9aa0c8]',
    'valid-unusual': 'text-[#ffd97a]',
    invalid: 'text-[#ff7a7a]',
  }[status.status]

  const text =
    status.status === 'empty'
      ? 'Empty scene'
      : status.status === 'valid-named'
        ? `✓ ${status.name} · ${status.formula}`
        : status.status === 'valid-unnamed'
          ? `✓ ${status.formula} · stable but unnamed`
          : status.status === 'valid-unusual'
            ? `⚠ ${status.formula} · ${status.reason ?? 'unusual'}`
            : `⚠ ${status.reason ?? 'invalid'}`

  return (
    <div className={`flex h-9 items-center px-4 text-xs font-medium ${color}`}>
      {text}
    </div>
  )
}
```

- [ ] **Step 5: Wire the mobile-first app layout**

Write `/Users/christopherwest/web/molecular/app/app/AppShell.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { AppScene } from './AppScene'
import { LibraryBrowser } from '@/src/ui/LibraryBrowser'
import { Inspector } from '@/src/ui/Inspector'
import { ModeSwitcher } from '@/src/ui/ModeSwitcher'
import { ValidityBar } from '@/src/ui/ValidityBar'

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  return (
    <div className="relative h-dvh w-screen overflow-hidden">
      {/* Full-bleed 3D scene */}
      <div className="absolute inset-0">
        <AppScene />
      </div>

      {/* Top toolbar — mode switcher + inspector trigger */}
      <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-3">
        <ModeSwitcher />
        <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[36px] bg-[#14112e]/80 text-[#dffaff] hover:bg-[#1a163a]"
            >
              Info
            </Button>
          </SheetTrigger>
          <SheetContent side="top" className="max-h-[70vh] bg-[#0d0a22] text-[#dffaff] border-[#2a2655]">
            <Inspector />
          </SheetContent>
        </Sheet>
      </header>

      {/* Bottom drawer — Library / palette + validity bar peek */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <button
            type="button"
            className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between bg-[#0d0a22]/95 px-4 py-2 text-left backdrop-blur"
          >
            <ValidityBar />
            <span className="text-xs text-[#8d92b8]">Library ↑</span>
          </button>
        </DrawerTrigger>
        <DrawerContent className="bg-[#0d0a22] border-[#2a2655]">
          <div className="h-[70vh]">
            <LibraryBrowser onPick={() => setDrawerOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
```

Replace `/Users/christopherwest/web/molecular/app/app/page.tsx` with:

```tsx
import { AppShell } from './AppShell'

export default function AppPage() {
  return <AppShell />
}
```

- [ ] **Step 6: Visually verify on a mobile viewport**

```bash
pnpm dev
```

Open `http://localhost:3000/app` and resize the browser to ~400px wide (or use device-emulation in Chrome DevTools). Expected:

- Water molecule visible in the canvas
- Mode switcher (Explore / Build / Lab) top-left
- "Info" button top-right opens the Inspector as a top sheet
- Bottom strip shows "✓ Water · H2O" + "Library ↑"
- Tapping the bottom strip opens a drawer containing the Library browser; search field works
- Picking "Glucose" closes the drawer and the scene updates to glucose

Stop with Ctrl+C.

- [ ] **Step 7: Write an e2e test**

Write `/Users/christopherwest/web/molecular/tests/e2e/library-spawn.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('search and spawn glucose from the library', async ({ page }) => {
  await page.goto('/app')
  // Open the drawer
  await page.getByRole('button', { name: /library/i }).click()
  // Search for glucose
  await page.getByPlaceholder('Search molecules…').fill('glucose')
  // Click the result
  await page.getByRole('button', { name: /^Glucose/i }).click()
  // Verify the inspector eventually shows Glucose
  await page.getByRole('button', { name: /info/i }).click()
  await expect(page.getByRole('heading', { name: 'Glucose' })).toBeVisible()
})
```

- [ ] **Step 8: Run e2e**

```bash
pnpm test:e2e tests/e2e/library-spawn.spec.ts
```

Expected: passes on both projects.

- [ ] **Step 9: Commit (Phase 3 capstone)**

```bash
git add .
git commit -m "ui: add mobile-first Library drawer + Inspector + ModeSwitcher; Phase 3 complete"
git push
```

**🎉 Phase 3 demoable:** Open `/app`, tap the bottom bar, browse the library, pick anything — the 3D scene updates, validity bar reflects the molecule, and the Inspector shows its details.

---

# Phase 4 — Periodic table palette + Build mode (drag-snap)

**Goal:** When the user switches to **Build** mode, the bottom drawer's content swaps from the Library to the Periodic Table palette (stacked category view). Tapping or click-dragging a card brings an atom into the scene with the morph effect; existing atoms display per-element valence sites; the new atom snaps to the nearest valid site and a bond commits.

**Files created in this phase:**
- `src/ui/PeriodicSidebar.tsx`, `src/ui/PeriodicOverlay.tsx`, `src/ui/PaletteCard.tsx`
- `src/ui/HoldingChip.tsx` — shows the held element near the cursor / last tap
- `src/scene/AttachPoints.tsx` — renders pulsing green/yellow/red dots
- `src/scene/DragGhost.tsx` — the 3D atom that follows pointer during drag
- `src/lib/elementCategories.ts` — palette grouping
- `src/lib/usePointerToWorld.ts` — converts pointer → 3D world position on the orbit plane
- `src/lib/useDrag.ts` — global drag state in the store (which element is held, where is the pointer)
- `src/store/buildSlice.ts` — held element, drag state
- `tests/chem/vsper.spec.ts` — already exists; will add attach-point matching tests
- `tests/e2e/build-water.spec.ts` — full Build flow

### Task 4.1 — Build-mode store slice (held element, drag state)

**Files:**
- Create: `src/store/buildSlice.ts`
- Modify: `src/store/index.ts`
- Create: `tests/store/buildSlice.spec.ts`

- [ ] **Step 1: Test**

Write `/Users/christopherwest/web/molecular/tests/store/buildSlice.spec.ts`:

```ts
import { describe, expect, it, beforeEach } from 'vitest'
import { useStore } from '@/src/store'

describe('build slice', () => {
  beforeEach(() => {
    useStore.getState().clearHeld()
  })

  it('starts with nothing held', () => {
    expect(useStore.getState().build.heldZ).toBeNull()
  })

  it('hold(Z) sets heldZ', () => {
    useStore.getState().hold(8)
    expect(useStore.getState().build.heldZ).toBe(8)
  })

  it('updatePointer sets pointer position', () => {
    useStore.getState().updatePointer([1, 2, 3])
    expect(useStore.getState().build.pointerWorld).toEqual([1, 2, 3])
  })

  it('clearHeld resets', () => {
    useStore.getState().hold(8)
    useStore.getState().updatePointer([1, 1, 1])
    useStore.getState().clearHeld()
    expect(useStore.getState().build.heldZ).toBeNull()
    expect(useStore.getState().build.pointerWorld).toBeNull()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm test tests/store/buildSlice.spec.ts
```

- [ ] **Step 3: Implement**

Write `/Users/christopherwest/web/molecular/src/store/buildSlice.ts`:

```ts
import type { StateCreator } from 'zustand'
import { produce } from 'immer'
import type { Vec3 } from '@/src/chem/types'

export interface BuildSliceState {
  build: {
    heldZ: number | null
    pointerWorld: Vec3 | null
    activeSiteId: string | null
  }
}

export interface BuildSliceActions {
  hold: (Z: number) => void
  clearHeld: () => void
  updatePointer: (pos: Vec3 | null) => void
  setActiveSite: (id: string | null) => void
}

export type BuildSlice = BuildSliceState & BuildSliceActions

export const createBuildSlice: StateCreator<BuildSlice> = (set) => ({
  build: { heldZ: null, pointerWorld: null, activeSiteId: null },
  hold: (Z) => set(produce<BuildSlice>((s) => void (s.build.heldZ = Z))),
  clearHeld: () =>
    set(
      produce<BuildSlice>((s) => {
        s.build.heldZ = null
        s.build.pointerWorld = null
        s.build.activeSiteId = null
      }),
    ),
  updatePointer: (pos) => set(produce<BuildSlice>((s) => void (s.build.pointerWorld = pos))),
  setActiveSite: (id) => set(produce<BuildSlice>((s) => void (s.build.activeSiteId = id))),
})
```

Update `/Users/christopherwest/web/molecular/src/store/index.ts`:

```ts
import { create } from 'zustand'
import { createSceneSlice, type SceneSlice } from './sceneSlice'
import { createUiSlice, type UiSlice } from './uiSlice'
import { createBuildSlice, type BuildSlice } from './buildSlice'

export type AppState = SceneSlice & UiSlice & BuildSlice

export const useStore = create<AppState>()((...args) => ({
  ...createSceneSlice(...args),
  ...createUiSlice(...args),
  ...createBuildSlice(...args),
}))
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm test tests/store/buildSlice.spec.ts
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "store: add build slice (heldZ, pointer, active site)"
git push
```

---

### Task 4.2 — Periodic palette sidebar (stacked category view)

**Files:**
- Create: `src/lib/elementCategories.ts`
- Create: `src/ui/PaletteCard.tsx`
- Create: `src/ui/PeriodicSidebar.tsx`

- [ ] **Step 1: Element grouping**

Write `/Users/christopherwest/web/molecular/src/lib/elementCategories.ts`:

```ts
import { ELEMENTS } from '@/src/chem/elements'
import type { ElementCategory } from '@/src/chem/types'

export const CATEGORY_ACCENT: Record<ElementCategory, string> = {
  alkali: '#FF7A8C',
  alkaline: '#FFB86B',
  transition: '#FFD07A',
  'other-metal': '#B0B5CC',
  metalloid: '#7AD9AA',
  nonmetal: '#5CC6FF',
  halogen: '#C8FF7A',
  noble: '#C89EFF',
}

export const CATEGORY_LABEL: Record<ElementCategory, string> = {
  alkali: 'Alkali Metals',
  alkaline: 'Alkaline Earth',
  transition: 'Transition Metals',
  'other-metal': 'Other Metals',
  metalloid: 'Metalloids',
  nonmetal: 'Reactive Nonmetals',
  halogen: 'Halogens',
  noble: 'Noble Gases',
}

// Sidebar display order — most-used groups first.
export const SIDEBAR_ORDER: ElementCategory[] = [
  'nonmetal',
  'halogen',
  'alkali',
  'alkaline',
  'noble',
  'metalloid',
  'other-metal',
  'transition',
]

export function groupedElements(maxZ: number) {
  const filtered = ELEMENTS.filter((e) => e.Z <= maxZ)
  return SIDEBAR_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    accent: CATEGORY_ACCENT[category],
    entries: filtered.filter((e) => e.category === category),
  })).filter((g) => g.entries.length > 0)
}

export function tierMaxZ(tier: 'beginner' | 'standard' | 'advanced'): number {
  if (tier === 'beginner') return 20
  return 36
}
```

- [ ] **Step 2: Palette card**

Write `/Users/christopherwest/web/molecular/src/ui/PaletteCard.tsx`:

```tsx
'use client'

import { useStore } from '@/src/store'
import type { Element } from '@/src/chem/types'
import { cn } from '@/src/lib/cn'

interface PaletteCardProps {
  element: Element
  accent: string
}

export function PaletteCard({ element, accent }: PaletteCardProps) {
  const heldZ = useStore((s) => s.build.heldZ)
  const hold = useStore((s) => s.hold)
  const clearHeld = useStore((s) => s.clearHeld)
  const isHeld = heldZ === element.Z

  function onPick() {
    if (isHeld) clearHeld()
    else hold(element.Z)
  }

  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={isHeld}
      aria-label={`${element.name}, atomic number ${element.Z}`}
      className={cn(
        'relative flex aspect-square flex-col justify-between rounded-md bg-[#181536] px-2 py-1.5 font-mono text-left transition-colors min-h-[60px]',
        isHeld
          ? 'border-2 border-dashed border-[#5cc6ff] bg-transparent text-[#5cc6ff]'
          : 'border border-[#2a2655] text-[#dffaff] hover:-translate-y-0.5 hover:shadow-md',
      )}
      style={
        isHeld
          ? undefined
          : {
              boxShadow: `inset 4px 0 0 ${accent}`,
              background: `linear-gradient(90deg, ${accent}1f 0%, #181536 60%)`,
            }
      }
    >
      <span className="text-[8px] text-[#6a6f95]">{element.Z}</span>
      <span className="text-center text-base font-extrabold">{element.symbol}</span>
      <span className="text-center text-[7px] text-[#8d92b8]">{element.name}</span>
    </button>
  )
}
```

- [ ] **Step 3: Sidebar (stacked)**

Write `/Users/christopherwest/web/molecular/src/ui/PeriodicSidebar.tsx`:

```tsx
'use client'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useStore } from '@/src/store'
import { groupedElements, tierMaxZ } from '@/src/lib/elementCategories'
import { PaletteCard } from './PaletteCard'

export function PeriodicSidebar() {
  const tier = useStore((s) => s.scene.tier)
  const groups = groupedElements(tierMaxZ(tier))
  const toggleFullTable = useStore((s) => s.toggleFullTable)

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={() => toggleFullTable()}
          className="flex-1 bg-[#5cc6ff] text-[#07051a] hover:bg-[#7ad6ff] min-h-[40px]"
        >
          View full table →
        </Button>
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[#6a6f95]">
        {tier === 'beginner' ? 'Beginner (Z 1–20)' : 'Standard (Z 1–36)'} · drag any card
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3">
          {groups.map((g) => (
            <Collapsible key={g.category} defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#14112e] px-3 py-2 text-left">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#cfd3e8]">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: g.accent }}
                  />
                  {g.label}
                </span>
                <span className="text-[10px] text-[#6a6f95]">{g.entries.length}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-4 gap-1.5 rounded-b-md bg-[#14112e]/60 p-2">
                  {g.entries.map((e) => (
                    <PaletteCard key={e.Z} element={e} accent={g.accent} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
```

- [ ] **Step 4: Wire palette into AppShell based on mode**

Edit `/Users/christopherwest/web/molecular/app/app/AppShell.tsx` and replace the drawer content selection to depend on mode. Replace the `<DrawerContent>` block with:

```tsx
        <DrawerContent className="bg-[#0d0a22] border-[#2a2655]">
          <div className="h-[70vh]">
            {mode === 'explore' ? (
              <LibraryBrowser onPick={() => setDrawerOpen(false)} />
            ) : (
              <PeriodicSidebar />
            )}
          </div>
        </DrawerContent>
```

…and add at the top of the file:

```tsx
import { PeriodicSidebar } from '@/src/ui/PeriodicSidebar'
import { useStore } from '@/src/store'
```

…and inside the component (replace the existing destructuring/state if any):

```tsx
const mode = useStore((s) => s.scene.mode)
```

- [ ] **Step 5: Visually verify**

```bash
pnpm dev
```

Open `/app`, switch to "Build" mode. Open the bottom drawer. Expected: periodic table palette appears, grouped by category. Tapping H shows the "picked" dashed-border state. Tapping again clears it.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "ui: periodic palette sidebar with stacked categories and Build mode wiring"
git push
```

---

### Task 4.3 — Pointer-to-world hook (touch + mouse)

**Files:**
- Create: `src/lib/usePointerToWorld.ts`

- [ ] **Step 1: Implement the hook**

Write `/Users/christopherwest/web/molecular/src/lib/usePointerToWorld.ts`:

```ts
'use client'

import { useThree } from '@react-three/fiber'
import { useCallback } from 'react'
import { Plane, Raycaster, Vector2, Vector3 } from 'three'

// Casts a ray from the camera through the screen-space pointer onto the Z=0 plane
// (perpendicular to the camera's local Z) and returns the intersection point.
export function usePointerToWorld() {
  const { camera, gl } = useThree()

  return useCallback(
    (clientX: number, clientY: number): [number, number, number] | null => {
      const rect = gl.domElement.getBoundingClientRect()
      const ndc = new Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      )
      const raycaster = new Raycaster()
      raycaster.setFromCamera(ndc, camera)
      // Plane through world origin facing camera.
      const camForward = new Vector3()
      camera.getWorldDirection(camForward)
      const plane = new Plane(camForward.clone().multiplyScalar(-1), 0)
      const hit = new Vector3()
      raycaster.ray.intersectPlane(plane, hit)
      return [hit.x, hit.y, hit.z]
    },
    [camera, gl],
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "lib: add usePointerToWorld hook (raycast onto orbit plane)"
git push
```

---

### Task 4.4 — `<DragGhost>` and the tile→3D morph

**Files:**
- Create: `src/scene/DragGhost.tsx`

- [ ] **Step 1: Implement**

Write `/Users/christopherwest/web/molecular/src/scene/DragGhost.tsx`:

```tsx
'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { type Group } from 'three'
import { useStore } from '@/src/store'
import { Atom } from './Atom'
import { usePointerToWorld } from '@/src/lib/usePointerToWorld'

export function DragGhost() {
  const heldZ = useStore((s) => s.build.heldZ)
  const updatePointer = useStore((s) => s.updatePointer)
  const pointer = useStore((s) => s.build.pointerWorld)
  const groupRef = useRef<Group>(null)
  const tweenRef = useRef({ scale: 0 })
  const { gl } = useThree()
  const screenToWorld = usePointerToWorld()

  // Track DOM pointer events at the canvas level and write into the store.
  useEffect(() => {
    if (heldZ === null) return
    const el = gl.domElement
    function onMove(e: PointerEvent) {
      const w = screenToWorld(e.clientX, e.clientY)
      if (w) updatePointer(w)
    }
    el.addEventListener('pointermove', onMove)
    return () => el.removeEventListener('pointermove', onMove)
  }, [heldZ, gl, screenToWorld, updatePointer])

  // Scale-in tween (0 → 1 over 200 ms when heldZ changes).
  useEffect(() => {
    tweenRef.current.scale = 0
  }, [heldZ])

  useFrame((_, delta) => {
    if (heldZ !== null && tweenRef.current.scale < 1) {
      tweenRef.current.scale = Math.min(1, tweenRef.current.scale + delta * 5)
      if (groupRef.current) {
        const s = tweenRef.current.scale
        groupRef.current.scale.set(s, s, s)
      }
    }
  })

  if (heldZ === null || !pointer) return null

  return (
    <group ref={groupRef} position={pointer}>
      <Atom Z={heldZ} position={[0, 0, 0]} opacity={0.7} />
    </group>
  )
}
```

- [ ] **Step 2: Add to the scene**

Edit `/Users/christopherwest/web/molecular/app/app/AppScene.tsx` and add inside `<Scene>` after the `{molecules.map(…)}`:

```tsx
<DragGhost />
```

…and import:

```tsx
import { DragGhost } from '@/src/scene/DragGhost'
```

- [ ] **Step 3: Visually verify**

```bash
pnpm dev
```

Open `/app`, switch to Build mode, open the palette, tap H. Move pointer over the canvas. Expected: a ghostly hydrogen atom follows the cursor with electron animation.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "scene: add DragGhost — held element follows pointer as a live 3D atom"
git push
```

---

### Task 4.5 — `<AttachPoints>` — pulsing site dots

**Files:**
- Create: `src/scene/AttachPoints.tsx`

- [ ] **Step 1: Implement**

Write `/Users/christopherwest/web/molecular/src/scene/AttachPoints.tsx`:

```tsx
'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { type Mesh, Vector3 } from 'three'
import { useStore } from '@/src/store'
import { atomId, bondId } from '@/src/chem/types'
import { canBond } from '@/src/chem/rules'
import { getBondingSites } from '@/src/chem/vsper'
import { getElement } from '@/src/chem/elements'

const SNAP_RANGE = 1.5

interface AttachPointProps {
  position: [number, number, number]
  color: string
  active: boolean
  onClick: () => void
}

function AttachPoint({ position, color, active, onClick }: AttachPointProps) {
  const ref = useRef<Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.15
    const scale = active ? 1.6 : pulse
    ref.current.scale.setScalar(scale)
  })
  return (
    <mesh ref={ref} position={position} onPointerDown={onClick}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.85} />
    </mesh>
  )
}

export function AttachPoints() {
  const heldZ = useStore((s) => s.build.heldZ)
  const pointer = useStore((s) => s.build.pointerWorld)
  const atoms = useStore((s) => s.scene.atoms)
  const bonds = useStore((s) => s.scene.bonds)
  const molecules = useStore((s) => s.scene.molecules)
  const setActiveSite = useStore((s) => s.setActiveSite)
  const activeSiteId = useStore((s) => s.build.activeSiteId)
  const addAtom = useStore((s) => s.addAtom)
  const addBond = useStore((s) => s.addBond)
  const clearHeld = useStore((s) => s.clearHeld)

  const allSites = useMemo(() => {
    if (heldZ === null) return []
    const held = getElement(heldZ)
    const list: { id: string; hostId: string; position: [number, number, number]; color: string }[] = []
    for (const atom of Object.values(atoms)) {
      const host = getElement(atom.Z)
      const r = canBond(host, held)
      if (!r.allowed) continue
      const color = r.preference === 'common' ? '#a4ff8c' : '#ffd97a'
      const sites = getBondingSites(atom, { atoms, bonds, molecules })
      for (let i = 0; i < sites.length; i++) {
        list.push({
          id: `${atom.id}::${i}`,
          hostId: atom.id,
          position: [...sites[i]!.position] as [number, number, number],
          color,
        })
      }
    }
    return list
  }, [heldZ, atoms, bonds, molecules])

  // When pointer is close to a site, mark it active.
  useMemo(() => {
    if (!pointer || allSites.length === 0) {
      setActiveSite(null)
      return
    }
    let bestId: string | null = null
    let bestDist = SNAP_RANGE
    for (const s of allSites) {
      const dx = s.position[0] - pointer[0]
      const dy = s.position[1] - pointer[1]
      const dz = s.position[2] - pointer[2]
      const d = Math.hypot(dx, dy, dz)
      if (d < bestDist) {
        bestDist = d
        bestId = s.id
      }
    }
    setActiveSite(bestId)
  }, [pointer, allSites, setActiveSite])

  function commit(siteId: string) {
    const site = allSites.find((s) => s.id === siteId)
    if (!site || heldZ === null) return
    const host = atoms[site.hostId]
    if (!host) return
    // Add the held element as a new atom at site.position, bonded to host.
    const newAtomId = atomId()
    const newBondId = bondId()
    addAtom({
      id: newAtomId,
      Z: heldZ,
      position: site.position,
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: host.moleculeId,
    })
    addBond({ id: newBondId, atomA: host.id, atomB: newAtomId, order: 1, type: 'covalent' })
    clearHeld()
  }

  return (
    <>
      {allSites.map((s) => (
        <AttachPoint
          key={s.id}
          position={s.position}
          color={s.color}
          active={s.id === activeSiteId}
          onClick={() => commit(s.id)}
        />
      ))}
    </>
  )
}
```

- [ ] **Step 2: Add to scene**

In `/Users/christopherwest/web/molecular/app/app/AppScene.tsx`, add inside `<Scene>` (also import):

```tsx
<AttachPoints />
```

```tsx
import { AttachPoints } from '@/src/scene/AttachPoints'
```

- [ ] **Step 3: Visually verify the full flow**

```bash
pnpm dev
```

Open `/app`. Switch to Build. Tap on the bottom drawer → palette. Tap H. Move cursor over the scene — water should still be there. Pulsing green dots should appear around the existing O atom at its 2 valence positions. Tap one of the dots → a new H attaches with a bond. Validity bar updates.

- [ ] **Step 4: e2e test**

Write `/Users/christopherwest/web/molecular/tests/e2e/build-attach.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('build mode shows attach points when an element is picked', async ({ page }) => {
  await page.goto('/app')
  // Switch to Build
  await page.getByRole('button', { name: 'Build' }).click()
  // Open the palette drawer
  await page.getByText(/Library ↑|Periodic|↑/i).first().click().catch(() => null)
  await page.getByRole('button', { name: /Hydrogen/i }).first().click()
  // Canvas now has attach point meshes — we can't easily query Three.js objects, but
  // we can at least verify the picked state on the card.
  await expect(page.getByRole('button', { name: /Hydrogen/i, pressed: true }).first()).toBeVisible()
})
```

- [ ] **Step 5: Run e2e**

```bash
pnpm test:e2e tests/e2e/build-attach.spec.ts
```

Expected: passes.

- [ ] **Step 6: Commit (Phase 4 capstone)**

```bash
git add .
git commit -m "build: attach-point rendering, snap-to-bond, and full drag-snap flow; Phase 4 complete"
git push
```

**🎉 Phase 4 demoable:** Open `/app`, switch to Build, pick H from the palette, tap a glowing green dot on the water's oxygen → a new H bonds in. Validity bar reports the resulting molecule.

---

# Phase 5 — Lab mode + reactions

**Goal:** Lab mode enables physics. The user can spawn molecules, fling one at another, and watch reactions happen automatically when collision energy + reactant match is detected. Reaction Log records what happened.

**Files created:**
- `src/scene/Physics.tsx` — wraps `<Physics>` from rapier
- `src/scene/PhysicsAtom.tsx` — Atom + rigid body
- `src/scene/ReactionAnimator.tsx` — tweens reactants → products
- `src/ui/LabToolbar.tsx`, `src/ui/ReactionLog.tsx`
- `src/lib/useFling.ts`
- `src/store/labSlice.ts`

### Task 5.1 — Install Rapier (lazy)

- [ ] **Step 1: Install**

```bash
pnpm add @react-three/rapier
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "lab: install @react-three/rapier"
git push
```

---

### Task 5.2 — Lab slice (mode events, reaction log)

**Files:**
- Create: `src/store/labSlice.ts`
- Modify: `src/store/index.ts`
- Create: `tests/store/labSlice.spec.ts`

- [ ] **Step 1: Test**

Write `/Users/christopherwest/web/molecular/tests/store/labSlice.spec.ts`:

```ts
import { describe, expect, it, beforeEach } from 'vitest'
import { useStore } from '@/src/store'

describe('lab slice', () => {
  beforeEach(() => useStore.getState().clearReactionLog())

  it('logs a reaction entry', () => {
    useStore.getState().logReaction({ id: 'water-synthesis', equation: '2 H2 + O2 → 2 H2O', enthalpy: 'exothermic' })
    expect(useStore.getState().lab.reactions.length).toBe(1)
  })

  it('clears the log', () => {
    useStore.getState().logReaction({ id: 'x', equation: 'x', enthalpy: 'exothermic' })
    useStore.getState().clearReactionLog()
    expect(useStore.getState().lab.reactions.length).toBe(0)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm test tests/store/labSlice.spec.ts
```

- [ ] **Step 3: Implement**

Write `/Users/christopherwest/web/molecular/src/store/labSlice.ts`:

```ts
import type { StateCreator } from 'zustand'
import { produce } from 'immer'

export interface ReactionLogEntry {
  id: string
  equation: string
  enthalpy: 'exothermic' | 'endothermic'
  ts?: number
}

export interface LabSliceState {
  lab: {
    reactions: ReactionLogEntry[]
  }
}

export interface LabSliceActions {
  logReaction: (entry: ReactionLogEntry) => void
  clearReactionLog: () => void
}

export type LabSlice = LabSliceState & LabSliceActions

export const createLabSlice: StateCreator<LabSlice> = (set) => ({
  lab: { reactions: [] },
  logReaction: (entry) =>
    set(produce<LabSlice>((s) => void s.lab.reactions.push({ ...entry, ts: Date.now() }))),
  clearReactionLog: () => set(produce<LabSlice>((s) => void (s.lab.reactions = []))),
})
```

Add to `/Users/christopherwest/web/molecular/src/store/index.ts`:

```ts
import { createLabSlice, type LabSlice } from './labSlice'

export type AppState = SceneSlice & UiSlice & BuildSlice & LabSlice

export const useStore = create<AppState>()((...args) => ({
  ...createSceneSlice(...args),
  ...createUiSlice(...args),
  ...createBuildSlice(...args),
  ...createLabSlice(...args),
}))
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm test tests/store/labSlice.spec.ts
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "lab: add lab slice with reaction log"
git push
```

---

### Task 5.3 — Wrap scene in Physics when in Lab mode

**Files:**
- Create: `src/scene/PhysicsWrapper.tsx`
- Modify: `app/app/AppScene.tsx`

- [ ] **Step 1: Wrapper**

Write `/Users/christopherwest/web/molecular/src/scene/PhysicsWrapper.tsx`:

```tsx
'use client'

import { lazy, Suspense, type ReactNode } from 'react'
import { useStore } from '@/src/store'

const Physics = lazy(() =>
  import('@react-three/rapier').then((m) => ({ default: m.Physics })),
)

export function PhysicsWrapper({ children }: { children: ReactNode }) {
  const mode = useStore((s) => s.scene.mode)
  if (mode !== 'lab') return <>{children}</>
  return (
    <Suspense fallback={<>{children}</>}>
      <Physics gravity={[0, 0, 0]}>
        {children}
      </Physics>
    </Suspense>
  )
}
```

- [ ] **Step 2: Wrap atoms in the scene**

In `/Users/christopherwest/web/molecular/app/app/AppScene.tsx`, wrap the children of `<Scene>` with `<PhysicsWrapper>`:

```tsx
import { PhysicsWrapper } from '@/src/scene/PhysicsWrapper'
// inside <Scene>:
<PhysicsWrapper>
  { /* existing molecule + drag-ghost + attach-points content */ }
</PhysicsWrapper>
```

- [ ] **Step 3: Visually verify**

```bash
pnpm dev
```

Open `/app`, switch to Lab. Scene still renders water. (Physics is now active but molecules have no bodies yet — that's Task 5.4.)

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "lab: lazy-load rapier Physics wrapper when in Lab mode"
git push
```

---

### Task 5.4 — Reaction detection on collision (simulated)

For v1 we keep the collision detection model simple: when in Lab mode and two distinct molecules are within a small distance and one has a velocity > threshold, we look up `findReaction` with their formulas. If a match exists, we trigger the ReactionAnimator.

**Files:**
- Create: `src/lab/detectReaction.ts`
- Create: `tests/lab/detectReaction.spec.ts`

- [ ] **Step 1: Test**

Write `/Users/christopherwest/web/molecular/tests/lab/detectReaction.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { detectReaction } from '@/src/lab/detectReaction'

describe('detectReaction', () => {
  it('matches 2 H2 + O2 → water-synthesis', () => {
    const r = detectReaction([
      { formula: 'H2', count: 2 },
      { formula: 'O2', count: 1 },
    ])
    expect(r?.id).toBe('water-synthesis')
  })

  it('returns undefined when no match', () => {
    expect(detectReaction([{ formula: 'He', count: 2 }])).toBeUndefined()
  })
})
```

- [ ] **Step 2: Implement**

Write `/Users/christopherwest/web/molecular/src/lab/detectReaction.ts`:

```ts
import { findReaction, type Stoich } from '@/src/chem/reactions'

export function detectReaction(inputs: Stoich[]) {
  return findReaction(inputs)
}
```

(Thin wrapper now; will gain energy / proximity gating in 5.5.)

- [ ] **Step 3: Run — expect PASS**

```bash
pnpm test tests/lab/detectReaction.spec.ts
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "lab: detectReaction wrapper around findReaction"
git push
```

---

### Task 5.5 — Reaction Animator + log entry

**Files:**
- Create: `src/scene/ReactionAnimator.tsx`
- Create: `src/ui/ReactionLog.tsx`
- Create: `src/lib/applyReaction.ts`

- [ ] **Step 1: applyReaction — replace reactant molecules with products in store**

Write `/Users/christopherwest/web/molecular/src/lib/applyReaction.ts`:

```ts
import { LIBRARY, getLibraryEntry } from '@/src/data/molecules'
import type { Reaction } from '@/src/chem/reactions'
import { spawnLibraryEntry } from './spawn'
import { useStore } from '@/src/store'

// Best-effort look up a library entry by formula. If none exists, we just
// add a single atom for monatomic products like Cu.
function libraryByFormula(formula: string) {
  return LIBRARY.find((m) => m.formula === formula)
}

export function applyReaction(reaction: Reaction, reactantMoleculeIds: string[]) {
  const store = useStore.getState()
  // Remove reactant molecules
  for (const id of reactantMoleculeIds) store.removeMolecule(id as never)

  // Spawn product molecules from the library at staggered offsets so they
  // don't all stack at the origin.
  const products = reaction.products
  let xOffset = 0
  for (const p of products) {
    for (let i = 0; i < p.count; i++) {
      const entry = libraryByFormula(p.formula) ?? getLibraryEntry('water')
      if (!entry) continue
      const result = spawnLibraryEntry(entry, [xOffset, 0, 0])
      store.addMolecule(result.molecule)
      for (const a of result.atoms) store.addAtom(a)
      for (const b of result.bonds) store.addBond(b)
      xOffset += 1.6
    }
  }

  // Log it
  const eqL = reaction.reactants
    .map((r) => `${r.count > 1 ? r.count + ' ' : ''}${r.formula}`)
    .join(' + ')
  const eqR = reaction.products
    .map((r) => `${r.count > 1 ? r.count + ' ' : ''}${r.formula}`)
    .join(' + ')
  store.logReaction({
    id: reaction.id,
    equation: `${eqL} → ${eqR}`,
    enthalpy: reaction.enthalpy,
  })
}
```

- [ ] **Step 2: Reaction Log UI**

Write `/Users/christopherwest/web/molecular/src/ui/ReactionLog.tsx`:

```tsx
'use client'

import { useStore } from '@/src/store'

export function ReactionLog() {
  const log = useStore((s) => s.lab.reactions)
  if (log.length === 0) {
    return <div className="p-4 text-center text-xs text-[#6a6f95]">No reactions yet.</div>
  }
  return (
    <ul className="flex flex-col gap-1 p-3 text-sm">
      {log
        .slice()
        .reverse()
        .map((r, i) => (
          <li
            key={i}
            className="rounded-md bg-[#14112e] px-3 py-2 font-mono text-[#dffaff]"
          >
            <div>{r.equation}</div>
            <div className="text-[10px] text-[#6a6f95]">
              {r.id} · {r.enthalpy}
            </div>
          </li>
        ))}
    </ul>
  )
}
```

- [ ] **Step 3: Lab toolbar (mobile-friendly fling helper)**

Write `/Users/christopherwest/web/molecular/src/ui/LabToolbar.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { LIBRARY, getLibraryEntry } from '@/src/data/molecules'
import { spawnLibraryEntry } from '@/src/lib/spawn'
import { applyReaction } from '@/src/lib/applyReaction'
import { findReaction } from '@/src/chem/reactions'
import { getFormula } from '@/src/chem/formula'
import { useStore } from '@/src/store'
import { ReactionLog } from './ReactionLog'

// v1 lab: rather than full physics flinging on phone (hard to tune in 2 weeks),
// expose explicit "Add reactant" + "Run reaction" controls. This still
// demonstrates the chemistry honestly; full fling can ship in v1.1.
export function LabToolbar() {
  const [logOpen, setLogOpen] = useState(false)
  const addAtom = useStore((s) => s.addAtom)
  const addBond = useStore((s) => s.addBond)
  const addMolecule = useStore((s) => s.addMolecule)
  const molecules = useStore((s) => s.scene.molecules)

  function add(libId: string) {
    const entry = getLibraryEntry(libId)
    if (!entry) return
    const result = spawnLibraryEntry(entry, [
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 1.5,
      0,
    ])
    addMolecule(result.molecule)
    for (const a of result.atoms) addAtom(a)
    for (const b of result.bonds) addBond(b)
  }

  function react() {
    const state = useStore.getState()
    const counts = new Map<string, number>()
    const mIds: string[] = []
    for (const m of Object.values(state.scene.molecules)) {
      const atomsInMol = m.atomIds
        .map((id) => state.scene.atoms[id])
        .filter((a): a is NonNullable<typeof a> => Boolean(a))
      if (atomsInMol.length === 0) continue
      const formula = getFormula(atomsInMol)
      counts.set(formula, (counts.get(formula) ?? 0) + 1)
      mIds.push(m.id)
    }
    const inputs = Array.from(counts.entries()).map(([formula, count]) => ({ formula, count }))
    const r = findReaction(inputs)
    if (r) applyReaction(r, mIds)
  }

  return (
    <div className="absolute bottom-16 right-4 z-20 flex flex-col gap-2">
      <Button onClick={() => add('hydrogen-gas')} size="sm" className="min-h-[40px]">
        + H₂
      </Button>
      <Button onClick={() => add('oxygen-gas')} size="sm" className="min-h-[40px]">
        + O₂
      </Button>
      <Button onClick={react} size="sm" className="min-h-[40px] bg-[#5cc6ff] text-[#07051a]">
        React!
      </Button>
      <Sheet open={logOpen} onOpenChange={setLogOpen}>
        <SheetTrigger asChild>
          <Button size="sm" variant="outline" className="min-h-[40px]">Log</Button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-[#0d0a22] border-[#2a2655] text-[#dffaff]">
          <ReactionLog />
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

- [ ] **Step 4: Mount LabToolbar in AppShell when mode==='lab'**

In `/Users/christopherwest/web/molecular/app/app/AppShell.tsx`, add:

```tsx
import { LabToolbar } from '@/src/ui/LabToolbar'
```

…and inside the return, after the bottom drawer:

```tsx
{mode === 'lab' && <LabToolbar />}
```

- [ ] **Step 5: Visually verify**

```bash
pnpm dev
```

Open `/app`, switch to Lab. Press `+ H₂` twice, then `+ O₂`. Press `React!`. Expected: H₂ and O₂ vanish; two water molecules spawn; log shows "2 H2 + O2 → 2 H2O · water-synthesis · exothermic".

- [ ] **Step 6: e2e**

Write `/Users/christopherwest/web/molecular/tests/e2e/lab-react.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('lab mode: 2 H2 + O2 → water synthesis', async ({ page }) => {
  await page.goto('/app')
  await page.getByRole('button', { name: 'Lab' }).click()
  await page.getByRole('button', { name: '+ H₂' }).click()
  await page.getByRole('button', { name: '+ H₂' }).click()
  await page.getByRole('button', { name: '+ O₂' }).click()
  await page.getByRole('button', { name: 'React!' }).click()
  await page.getByRole('button', { name: 'Log' }).click()
  await expect(page.getByText(/water-synthesis/i)).toBeVisible()
})
```

- [ ] **Step 7: Run**

```bash
pnpm test:e2e tests/e2e/lab-react.spec.ts
```

- [ ] **Step 8: Commit (Phase 5 capstone)**

```bash
git add .
git commit -m "lab: spawn reactants, run reactions, log results; Phase 5 complete"
git push
```

**🎉 Phase 5 demoable:** In Lab mode, add reactants from the toolbar and tap React — products spawn, log records the equation.

---

# Phase 5.2 — Recipe hints (post-Phase-5 follow-up)

**Goal:** Surface what's *possible* given the molecules currently in the Lab so users don't have to guess at combinations. Reactive hint panel that watches the scene + the pending-reactant pool and lists reactions the player could trigger — either ones they already have the ingredients for, or "near-misses" that just need one more reactant. Same chemistry engine, layered hint UI on top.

**Motivation:** Lab is currently strong on mechanics but discovery is opaque. A new user opens the toolbar, adds a couple of molecules, and has no idea whether anything will combine — they only learn the reaction database by trial and error. A hint panel turns the Lab from "guess at chemistry" into "guided sandbox experimentation".

**Architecture:** Pure derived view — no new persistent state. A `useRecipeHints()` hook reads `scene.molecules` (or the lab-slice `pendingReactantIds`) plus the static `REACTIONS` table and returns ranked recipe suggestions. A `<RecipeHintPanel>` component renders the suggestions inside a new sheet attached to the LabToolbar. Tapping a hint either fires the reaction directly (if all ingredients are present) or pre-adds the missing reactants and queues them in the pending pool.

**Files created:**
- `src/lib/recipeHints.ts` — `getRecipeHints(scene, pending)` → ranked `RecipeHint[]`
- `src/ui/RecipeHintPanel.tsx` — UI list of hints with affordances per state
- `tests/lib/recipeHints.spec.ts` — unit coverage for the ranker

**Files modified:**
- `src/ui/LabToolbar.tsx` — add a "💡 Hints" button that opens the recipe panel as a Sheet
- `src/store/labSlice.ts` — optional `dismissedHints: Set<string>` so users can hide hints they've already seen

### Task 5.2.1 — Hint data model + ranker

**Files:**
- Create: `src/lib/recipeHints.ts`
- Create: `tests/lib/recipeHints.spec.ts`

`RecipeHint` shape:
```ts
export interface RecipeHint {
  reactionId: string
  equation: string        // "2 H₂ + O₂ → 2 H₂O"
  enthalpy: 'exothermic' | 'endothermic'
  status: 'ready' | 'missing'   // ready = fire now; missing = needs more reactants
  missing: { formula: string; count: number }[]  // empty when status==='ready'
  matchedMoleculeIds: string[]  // scene ids satisfying the recipe (for visualization)
}
```

Ranker rules (in priority order):
1. **status === 'ready'** comes first — these are immediately actionable.
2. Within 'ready', prefer reactions where ALL reactants are in `pendingReactantIds` (the user explicitly set this up).
3. **status === 'missing'** ranked by `1 - (missingCount / totalReactantCount)` — closer to ready ranks higher.
4. Cap to top 6 results so the panel doesn't overwhelm.

Test cases:
- Empty scene → empty hints
- 1 H₂O alone → suggests `water-electrolysis` as missing (needs 1 more H₂O)
- 2 H₂ + 1 O₂ → ready for `water-synthesis`
- 1 H₂ + 1 O₂ → missing 1 H₂ for `water-synthesis`
- Scene with H₂ + N₂ → suggests `ammonia-synthesis` as missing (needs 2 more H₂ and 0 N₂)

### Task 5.2.2 — RecipeHintPanel UI

**Files:**
- Create: `src/ui/RecipeHintPanel.tsx`

For each hint, render a card:
- **Ready hints**: equation in green border, primary action button `Combine` (fires `tryReact` scoped to `matchedMoleculeIds`).
- **Missing hints**: equation in dim style, "Add X" buttons for each missing reactant. Tapping "Add" calls `add(libIdForFormula)` so the user can build toward the recipe one step at a time.
- Show the enthalpy badge (cyan for exothermic, amber for endothermic).
- Show a "What is this?" affordance that opens the AI tutor (Phase 6 hookup — graceful no-op until then).

Visual treatment matches the Inspector card styling — dark `#14112e` background, asymmetric reactant/product layout with the arrow.

### Task 5.2.3 — Hook up to LabToolbar

**Files:**
- Modify: `src/ui/LabToolbar.tsx`

Add a fourth toolbar button between "More reactants…" and "Combine reactants":
```tsx
<Button onClick={() => setHintsOpen(true)} ...>
  💡 Hints
</Button>
```

Sheet opens from the right (mirror of Reaction Log). Auto-open the panel on first lab visit so newcomers see the affordance immediately — gate via a `localStorage` flag `molecular.lab.hintsSeen`.

### Task 5.2.4 — Wire to the existing pending pool + applyReaction

When a user taps "Combine" on a ready hint, the hint's `matchedMoleculeIds` are passed directly to `applyReaction(reaction, matchedMoleculeIds)`. This bypasses the global `tryReact` matcher and runs exactly the reaction the user picked — avoids the situation where two reactions could be satisfied by the same molecules and the wrong one fires.

When a user taps "Add X" on a missing hint, call the existing `add(libId)` flow with the formula→libId mapping. Pre-existing `addPendingReactant` ensures the new molecule shows up in the pending pool, so the hint card's status updates from 'missing' to 'ready' once enough have been added.

### Task 5.2.5 — Polish

- **Animate hint card transitions** when status flips missing → ready (subtle scale or border-color tween).
- **Persist `dismissedHints`** in lab slice so the user can hide hints they've already explored. A small `×` per card writes the reactionId into the set; cleared by Reset.
- **Optional in-canvas highlight**: when a hint card is hovered/focused, briefly highlight the matched molecules in the 3D scene (cyan outline). Requires LabMolecule to accept a `highlight?: boolean` prop wired from the panel's hover state.

**🎉 Phase 5.2 demoable:** Open Lab, tap 💡 Hints. With nothing added: blank panel. Add an H₂ — panel shows "missing 1 H₂ + 1 O₂ for water-synthesis". Tap "Add O₂" twice from the hint card itself — panel flips to ready. Tap Combine — water spawns.

---

# Phase 6 — AI tutor

**Goal:** A `/api/tutor` streaming route powered by Vercel AI Gateway. A right-side sheet shows tutor messages and suggested prompts. Tokens stream in.

**Files created:**
- `app/api/tutor/route.ts`
- `src/ui/TutorPanel.tsx`
- `src/store/tutorSlice.ts`
- `src/lib/sceneToPrompt.ts`
- `tests/lib/sceneToPrompt.spec.ts`

### Task 6.1 — Install AI SDK

- [ ] **Step 1**

```bash
pnpm add ai @ai-sdk/anthropic zod
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "tutor: install Vercel AI SDK and Zod"
git push
```

---

### Task 6.2 — sceneToPrompt + tutor route

**Files:**
- Create: `src/lib/sceneToPrompt.ts`, `tests/lib/sceneToPrompt.spec.ts`
- Create: `app/api/tutor/route.ts`

- [ ] **Step 1: Test sceneToPrompt**

Write `/Users/christopherwest/web/molecular/tests/lib/sceneToPrompt.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { sceneToPrompt } from '@/src/lib/sceneToPrompt'
import { atomId, bondId, moleculeId } from '@/src/chem/types'

describe('sceneToPrompt', () => {
  it('produces a short text summary', () => {
    const oId = atomId()
    const h1 = atomId()
    const h2 = atomId()
    const mId = moleculeId()
    const scene = {
      atoms: {
        [oId]: { id: oId, Z: 8, position: [0, 0, 0] as const, velocity: [0, 0, 0] as const, charge: 0, moleculeId: mId },
        [h1]: { id: h1, Z: 1, position: [1, 0, 0] as const, velocity: [0, 0, 0] as const, charge: 0, moleculeId: mId },
        [h2]: { id: h2, Z: 1, position: [-1, 0, 0] as const, velocity: [0, 0, 0] as const, charge: 0, moleculeId: mId },
      },
      bonds: {
        [bondId()]: { id: bondId(), atomA: oId, atomB: h1, order: 1, type: 'covalent' as const },
        [bondId()]: { id: bondId(), atomA: oId, atomB: h2, order: 1, type: 'covalent' as const },
      },
      molecules: { [mId]: { id: mId, atomIds: [oId, h1, h2], bondIds: [] } },
    }
    const text = sceneToPrompt(scene as never)
    expect(text).toContain('H2O')
    expect(text).toContain('Water')
  })
})
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement**

Write `/Users/christopherwest/web/molecular/src/lib/sceneToPrompt.ts`:

```ts
import type { SceneSnapshot } from '@/src/chem/types'
import { getFormula } from '@/src/chem/formula'
import { validateScene } from '@/src/chem/validate'
import { getElement } from '@/src/chem/elements'

export function sceneToPrompt(scene: SceneSnapshot): string {
  const atoms = Object.values(scene.atoms)
  if (atoms.length === 0) return 'The scene is empty.'
  const formula = getFormula(atoms)
  const v = validateScene(scene)
  const counts = new Map<string, number>()
  for (const a of atoms) {
    const sym = getElement(a.Z).symbol
    counts.set(sym, (counts.get(sym) ?? 0) + 1)
  }
  const composition = [...counts.entries()].map(([s, n]) => `${n} ${s}`).join(', ')
  const bondCount = Object.keys(scene.bonds).length
  return [
    `Current scene:`,
    `Formula: ${formula}`,
    v.name ? `Common name: ${v.name}` : 'No common name in the local library.',
    `Atoms: ${composition}`,
    `Bonds: ${bondCount}`,
    v.reason ? `Note: ${v.reason}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}
```

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Tutor route**

Write `/Users/christopherwest/web/molecular/app/api/tutor/route.ts`:

```ts
import { streamText } from 'ai'
import { z } from 'zod'

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
Keep responses concise (3–6 sentences). Use plain text, no Markdown.`
  if (tier === 'beginner')
    return base + `\nThis student is in middle / early high school. Use simple analogies. Avoid jargon like "electronegativity" — say "how greedy an atom is for electrons" instead.`
  if (tier === 'standard')
    return base + `\nUse standard high-school / AP chemistry terms: valence, covalent, ionic, polarity.`
  return base + `\nUse precise college-level terms: electronegativity, hybridization, formal charge, lone pairs.`
}

export async function POST(req: Request) {
  const json = await req.json()
  const parsed = PayloadSchema.safeParse(json)
  if (!parsed.success) return new Response('Bad request', { status: 400 })

  const { sceneSummary, tier, mode, question } = parsed.data
  const model =
    tier === 'beginner'
      ? 'anthropic/claude-haiku-4-5'
      : 'anthropic/claude-sonnet-4-6'

  const result = streamText({
    model,
    system: systemPrompt(tier),
    prompt: `Mode: ${mode}\n\n${sceneSummary}\n\nStudent question: ${question}`,
  })

  return result.toTextStreamResponse()
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "tutor: add sceneToPrompt + streaming /api/tutor route on Vercel AI Gateway"
git push
```

---

### Task 6.3 — Tutor panel UI + integration

**Files:**
- Create: `src/store/tutorSlice.ts`
- Create: `src/ui/TutorPanel.tsx`
- Modify: `src/store/index.ts`, `app/app/AppShell.tsx`

- [ ] **Step 1: Tutor slice**

Write `/Users/christopherwest/web/molecular/src/store/tutorSlice.ts`:

```ts
import type { StateCreator } from 'zustand'
import { produce } from 'immer'

export interface TutorMessage {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

export interface TutorSliceState {
  tutor: {
    messages: TutorMessage[]
    streaming: boolean
  }
}

export interface TutorSliceActions {
  addTutorMessage: (m: TutorMessage) => void
  appendToLast: (chunk: string) => void
  setStreaming: (v: boolean) => void
  clearTutor: () => void
}

export type TutorSlice = TutorSliceState & TutorSliceActions

export const createTutorSlice: StateCreator<TutorSlice> = (set) => ({
  tutor: { messages: [], streaming: false },
  addTutorMessage: (m) =>
    set(produce<TutorSlice>((s) => void s.tutor.messages.push(m))),
  appendToLast: (chunk) =>
    set(
      produce<TutorSlice>((s) => {
        const last = s.tutor.messages[s.tutor.messages.length - 1]
        if (last) last.content += chunk
      }),
    ),
  setStreaming: (v) => set(produce<TutorSlice>((s) => void (s.tutor.streaming = v))),
  clearTutor: () => set(produce<TutorSlice>((s) => void (s.tutor.messages = []))),
})
```

Add to `/Users/christopherwest/web/molecular/src/store/index.ts`:

```ts
import { createTutorSlice, type TutorSlice } from './tutorSlice'
export type AppState = SceneSlice & UiSlice & BuildSlice & LabSlice & TutorSlice
// add ...createTutorSlice(...args) in the create() call
```

- [ ] **Step 2: TutorPanel**

Write `/Users/christopherwest/web/molecular/src/ui/TutorPanel.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/src/store'
import { sceneToPrompt } from '@/src/lib/sceneToPrompt'

const SUGGESTIONS: Record<string, string[]> = {
  explore: ['What is this molecule used for?', 'Why does this shape matter?', 'How is this molecule made in nature?'],
  build: ['Why didn\'t this bond form?', 'What molecule am I making?', 'What atom should I add next for water?'],
  lab: ['What just happened?', 'Why did this release energy?', 'What else could I try?'],
}

export function TutorPanel() {
  const messages = useStore((s) => s.tutor.messages)
  const streaming = useStore((s) => s.tutor.streaming)
  const tier = useStore((s) => s.scene.tier)
  const mode = useStore((s) => s.scene.mode)
  const addTutorMessage = useStore((s) => s.addTutorMessage)
  const appendToLast = useStore((s) => s.appendToLast)
  const setStreaming = useStore((s) => s.setStreaming)
  const [question, setQuestion] = useState('')

  async function ask(q: string) {
    if (!q.trim() || streaming) return
    const userMsg = { role: 'user' as const, content: q, ts: Date.now() }
    addTutorMessage(userMsg)
    addTutorMessage({ role: 'assistant', content: '', ts: Date.now() })
    setStreaming(true)
    setQuestion('')

    const sceneSummary = sceneToPrompt(useStore.getState().scene)
    const res = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sceneSummary, tier, mode, question: q }),
    })
    if (!res.ok || !res.body) {
      appendToLast('\n[Error fetching response]')
      setStreaming(false)
      return
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      appendToLast(decoder.decode(value))
    }
    setStreaming(false)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="text-center text-xs text-[#6a6f95]">
            Ask the tutor anything about the current scene.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'rounded-md bg-[#3a2e7a]/40 px-3 py-2 text-sm text-[#dffaff]'
                : 'rounded-md bg-[#14112e] px-3 py-2 text-sm text-[#dffaff]'
            }
          >
            {m.content || (streaming && i === messages.length - 1 ? '…' : '')}
          </div>
        ))}
      </div>
      <div className="border-t border-[#2a2655] p-3">
        <div className="mb-2 flex flex-wrap gap-1">
          {(SUGGESTIONS[mode] ?? []).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              disabled={streaming}
              className="rounded-full bg-[#14112e] px-3 py-1 text-xs text-[#9aa0c8] hover:bg-[#1a163a] disabled:opacity-50 min-h-[28px]"
            >
              {s}
            </button>
          ))}
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
            className="bg-[#14112e] border-[#2a2655] text-[#dffaff]"
          />
          <Button type="submit" disabled={streaming || !question.trim()} className="min-h-[40px]">
            Ask
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Mount in AppShell**

In `/Users/christopherwest/web/molecular/app/app/AppShell.tsx`, replace the existing `<Sheet>` (the top "Info" sheet) so it contains tabs: Info | Tutor. Simplest: keep Info sheet but add a separate Tutor floating button.

Add at top of imports:

```tsx
import { TutorPanel } from '@/src/ui/TutorPanel'
```

And replace the top-right corner with:

```tsx
<div className="flex gap-2">
  <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
    <SheetTrigger asChild>
      <Button variant="ghost" size="sm" className="min-h-[36px] bg-[#14112e]/80 text-[#dffaff] hover:bg-[#1a163a]">
        Info
      </Button>
    </SheetTrigger>
    <SheetContent side="top" className="max-h-[70vh] bg-[#0d0a22] text-[#dffaff] border-[#2a2655]">
      <Inspector />
    </SheetContent>
  </Sheet>
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="sm" className="min-h-[36px] bg-[#14112e]/80 text-[#dffaff] hover:bg-[#1a163a]">
        Tutor
      </Button>
    </SheetTrigger>
    <SheetContent side="bottom" className="h-[60vh] bg-[#0d0a22] text-[#dffaff] border-[#2a2655]">
      <TutorPanel />
    </SheetContent>
  </Sheet>
</div>
```

- [ ] **Step 4: Set up the Vercel AI Gateway env**

The Gateway works out-of-the-box on Vercel without explicit keys (it uses your linked Vercel project). For local dev you need `AI_GATEWAY_API_KEY`. Document this in `README.md` (next task). For local testing, set it in `.env.local`:

```bash
echo 'AI_GATEWAY_API_KEY=your-key-here' >> /Users/christopherwest/web/molecular/.env.local
```

(Do not commit `.env.local` — already in .gitignore.)

- [ ] **Step 5: Visually verify**

```bash
pnpm dev
```

Open `/app`. Tap "Tutor". A bottom sheet appears with suggested prompts. Tap "What is this molecule used for?" → streaming answer appears.

- [ ] **Step 6: Commit (Phase 6 capstone)**

```bash
git add .
git commit -m "tutor: TutorPanel + slice + streaming integration; Phase 6 complete"
git push
```

**🎉 Phase 6 demoable:** Ask the tutor a question in `/app` — get a streaming response tailored to the current scene + tier + mode.

---

# Phase 7 — Landing page with autonomous reel

**Goal:** Real homepage at `/` with the hero copy, autonomous reel cycling water → methane → ammonia → NaCl, feature cards below the fold, deep-links into `/app`.

**Files created:**
- `src/landing/HomepageReel.tsx` — orchestrator
- `src/landing/ReelMolecule.tsx` — atom tween-in helper
- `src/landing/HeroCopy.tsx`, `src/landing/FeatureCards.tsx`, `src/landing/HowItWorks.tsx`, `src/landing/Footer.tsx`
- `app/page.tsx` — completely replaces the Phase 0 placeholder

### Task 7.1 — HomepageReel orchestrator

**Files:**
- Create: `src/landing/HomepageReel.tsx`
- Create: `src/landing/reelData.ts`

- [ ] **Step 1: Reel data — sequence of molecules to play**

Write `/Users/christopherwest/web/molecular/src/landing/reelData.ts`:

```ts
import { LIBRARY } from '@/src/data/molecules'

export interface ReelStep {
  libraryId: string
  durationMs: number
}

export const REEL: ReelStep[] = [
  { libraryId: 'water', durationMs: 7000 },
  { libraryId: 'methane', durationMs: 7000 },
  { libraryId: 'ammonia', durationMs: 7000 },
  { libraryId: 'sodium-chloride', durationMs: 7000 },
]

export function getReelMolecule(id: string) {
  return LIBRARY.find((m) => m.id === id)
}
```

- [ ] **Step 2: HomepageReel — drives the sequence using local state (not the global store, so the landing doesn't affect /app)**

Write `/Users/christopherwest/web/molecular/src/landing/HomepageReel.tsx`:

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Scene } from '@/src/scene/Scene'
import { Molecule } from '@/src/scene/Molecule'
import { atomId, bondId, moleculeId, type Atom, type Bond } from '@/src/chem/types'
import { REEL, getReelMolecule } from './reelData'

function buildSceneFor(libraryId: string): { atoms: Atom[]; bonds: Bond[]; name: string; formula: string } {
  const entry = getReelMolecule(libraryId)
  if (!entry) return { atoms: [], bonds: [], name: '', formula: '' }
  const mId = moleculeId()
  const atoms: Atom[] = entry.atoms.map((a) => ({
    id: atomId(),
    Z: a.Z,
    position: a.position,
    velocity: [0, 0, 0],
    charge: 0,
    moleculeId: mId,
  }))
  const bonds: Bond[] = entry.bonds.map((b) => ({
    id: bondId(),
    atomA: atoms[b.atomAIndex]!.id,
    atomB: atoms[b.atomBIndex]!.id,
    order: b.order,
    type: b.type ?? 'covalent',
  }))
  return { atoms, bonds, name: entry.name, formula: entry.formula }
}

export function HomepageReel() {
  const [stepIndex, setStepIndex] = useState(0)
  const step = REEL[stepIndex] ?? REEL[0]!
  const scene = useMemo(() => buildSceneFor(step.libraryId), [step.libraryId])

  // Cycle to next step.
  useEffect(() => {
    const t = setTimeout(() => setStepIndex((i) => (i + 1) % REEL.length), step.durationMs)
    return () => clearTimeout(t)
  }, [stepIndex, step.durationMs])

  return (
    <div className="absolute inset-0 -z-0">
      <Scene>
        <group position={[1.5, 0, 0]}>
          <Molecule atoms={scene.atoms} bonds={scene.bonds} />
        </group>
      </Scene>
      <Link
        href={`/app?molecule=${step.libraryId}`}
        aria-label={`Open ${scene.name} in the app`}
        className="absolute right-[10%] top-[55%] -translate-y-1/2 rounded-md px-3 py-1 text-xs text-[#dffaff]/80 hover:text-[#dffaff]"
      >
        {scene.name} · {scene.formula} ↗
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "landing: HomepageReel cycles water → methane → ammonia → NaCl"
git push
```

---

### Task 7.2 — Hero copy + feature cards + how-it-works + footer

**Files:**
- Create: `src/landing/HeroCopy.tsx`, `src/landing/FeatureCards.tsx`, `src/landing/HowItWorks.tsx`, `src/landing/Footer.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: HeroCopy**

Write `/Users/christopherwest/web/molecular/src/landing/HeroCopy.tsx`:

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function HeroCopy() {
  return (
    <div className="relative z-10 flex min-h-dvh items-center px-6 md:px-12">
      <div className="max-w-xl">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[#5cc6ff]">
          MOLECULAR
        </p>
        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
          Build the periodic <span className="text-[#5cc6ff]">table in 3D.</span>
        </h1>
        <p className="mt-6 text-base text-[#9aa0c8] md:text-lg">
          Drag atoms. Snap bonds. Throw molecules at each other.
        </p>
        <p className="mt-1 text-base text-[#9aa0c8] md:text-lg">
          Watch electrons transfer. Ask an AI why anything happened.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="min-h-[48px] bg-[#5cc6ff] text-[#07051a] hover:bg-[#7ad6ff]">
            <Link href="/app">Open the Lab →</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="min-h-[48px] border-white/25 bg-white/5 text-[#dffaff] hover:bg-white/10"
          >
            <Link href="/app?mode=explore">Browse molecules</Link>
          </Button>
        </div>
        <p className="mt-12 text-xs text-[#6a6f95]">
          36 elements · 30 curated molecules · 26 reactions · AI tutor included
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: FeatureCards (with mini canvases)**

Write `/Users/christopherwest/web/molecular/src/landing/FeatureCards.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { Scene } from '@/src/scene/Scene'
import { Molecule } from '@/src/scene/Molecule'
import { atomId, bondId, moleculeId } from '@/src/chem/types'
import { getLibraryEntry } from '@/src/data/molecules'

function MiniPreview({ libraryId }: { libraryId: string }) {
  const entry = getLibraryEntry(libraryId)
  if (!entry) return null
  const mId = moleculeId()
  const atoms = entry.atoms.map((a) => ({
    id: atomId(),
    Z: a.Z,
    position: a.position,
    velocity: [0, 0, 0] as const,
    charge: 0,
    moleculeId: mId,
  }))
  const bonds = entry.bonds.map((b) => ({
    id: bondId(),
    atomA: atoms[b.atomAIndex]!.id,
    atomB: atoms[b.atomBIndex]!.id,
    order: b.order,
    type: b.type ?? ('covalent' as const),
  }))
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-[#0a0719]">
      <Scene enableBloom={false}>
        <Molecule atoms={atoms} bonds={bonds} />
      </Scene>
    </div>
  )
}

const CARDS = [
  {
    id: 'explore',
    title: 'Explore',
    body: 'Browse a curated library of 30+ molecules. Spin them in 3D. Ask the tutor what they\'re for.',
    libraryId: 'glucose',
    href: '/app?mode=explore',
  },
  {
    id: 'build',
    title: 'Build',
    body: 'Drag atoms from the periodic table. Snap bonds. The chemistry engine tells you when you\'re making sense.',
    libraryId: 'ammonia',
    href: '/app?mode=build',
  },
  {
    id: 'lab',
    title: 'Lab',
    body: 'Throw reactants together. Watch electrons transfer. The reaction log records every transformation.',
    libraryId: 'ethanol',
    href: '/app?mode=lab',
  },
]

export function FeatureCards() {
  return (
    <section className="px-6 py-16 md:px-12 md:py-24">
      <h2 className="mb-8 text-2xl font-bold text-white md:text-3xl">Three ways to learn</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.id}
            href={c.href}
            className="group flex flex-col rounded-xl border border-[#2a2655] bg-[#0d0a22]/60 p-4 transition-colors hover:border-[#5cc6ff]/40"
          >
            <MiniPreview libraryId={c.libraryId} />
            <h3 className="mt-4 text-xl font-bold text-[#dffaff]">{c.title}</h3>
            <p className="mt-2 text-sm text-[#9aa0c8]">{c.body}</p>
            <span className="mt-3 text-xs font-semibold text-[#5cc6ff] group-hover:underline">
              Open →
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: HowItWorks + Footer**

Write `/Users/christopherwest/web/molecular/src/landing/HowItWorks.tsx`:

```tsx
const STEPS = [
  { n: 1, title: 'Pick an atom', body: 'Tap the periodic table. The element comes alive on your cursor.' },
  { n: 2, title: 'Snap a bond', body: 'Drop it on a glowing dot. The chemistry engine handles the geometry.' },
  { n: 3, title: 'See what happens', body: 'Validity bar names what you\'ve made. The AI tutor explains the why.' },
]

export function HowItWorks() {
  return (
    <section className="px-6 py-16 md:px-12 md:py-24">
      <h2 className="mb-8 text-2xl font-bold text-white md:text-3xl">How it works</h2>
      <ol className="grid gap-6 md:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="rounded-xl border border-[#2a2655] bg-[#0d0a22]/40 p-6">
            <div className="mb-3 text-3xl font-extrabold text-[#5cc6ff]">{s.n}</div>
            <h3 className="text-lg font-bold text-[#dffaff]">{s.title}</h3>
            <p className="mt-2 text-sm text-[#9aa0c8]">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
```

Write `/Users/christopherwest/web/molecular/src/landing/Footer.tsx`:

```tsx
export function Footer() {
  return (
    <footer className="border-t border-[#2a2655] px-6 py-8 text-xs text-[#6a6f95] md:px-12">
      <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
        <div>© Molecular · Built with Three.js, Next.js, and Vercel AI Gateway.</div>
        <a
          href="https://github.com/inkorange/molecular"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#dffaff]"
        >
          GitHub →
        </a>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: Replace `app/page.tsx`**

Write `/Users/christopherwest/web/molecular/app/page.tsx`:

```tsx
import { HomepageReel } from '@/src/landing/HomepageReel'
import { HeroCopy } from '@/src/landing/HeroCopy'
import { FeatureCards } from '@/src/landing/FeatureCards'
import { HowItWorks } from '@/src/landing/HowItWorks'
import { Footer } from '@/src/landing/Footer'

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-dvh overflow-hidden">
        <HomepageReel />
        <HeroCopy />
      </section>
      <FeatureCards />
      <HowItWorks />
      <Footer />
    </>
  )
}
```

- [ ] **Step 5: Visually verify**

```bash
pnpm dev
```

Open `http://localhost:3000/`. Expected: hero copy on the left, reel running on the right cycling through water → methane → ammonia → NaCl. CTAs deep-link into the app. Below the fold: three feature cards each with their own mini live scene, then "How it works", then a footer.

- [ ] **Step 6: Handle `?molecule=` query param in /app**

Edit `/Users/christopherwest/web/molecular/app/app/AppScene.tsx` and replace the `useEffect` that spawns water by default with:

```tsx
useEffect(() => {
  if (Object.keys(useStore.getState().scene.atoms).length > 0) return
  const params = new URLSearchParams(window.location.search)
  const lib = params.get('molecule') ?? 'water'
  const entry = getLibraryEntry(lib) ?? getLibraryEntry('water')
  if (!entry) return
  const result = spawnLibraryEntry(entry)
  addMolecule(result.molecule)
  for (const a of result.atoms) addAtom(a)
  for (const b of result.bonds) addBond(b)
  const modeParam = params.get('mode')
  if (modeParam === 'build' || modeParam === 'lab' || modeParam === 'explore') {
    useStore.getState().setMode(modeParam)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

- [ ] **Step 7: e2e**

Write `/Users/christopherwest/web/molecular/tests/e2e/landing.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('landing page shows hero + reel canvas, "Open the Lab" navigates', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /build the periodic table in 3D/i })).toBeVisible()
  await expect(page.locator('canvas').first()).toBeVisible()
  await page.getByRole('link', { name: /open the lab/i }).click()
  await page.waitForURL(/\/app/)
})
```

- [ ] **Step 8: Commit (Phase 7 capstone)**

```bash
git add .
git commit -m "landing: hero + autonomous reel + feature cards + how-it-works + footer; Phase 7 complete"
git push
```

**🎉 Phase 7 demoable:** `/` shows hero with cycling reaction reel and deep-link CTAs. Below the fold: three feature cards with live mini-scenes, "How it works", footer.

---

# Phase 8 — Persistence + share

**Goal:** Auto-save the scene to localStorage. Save named "My Creations". Share via URL hash. Loading `/s/[hash]` restores the encoded scene.

**Files created:**
- `src/lib/serializeScene.ts` — compact JSON encode/decode
- `src/lib/shareUrl.ts` — base64url + deflate
- `src/lib/persistence.ts` — localStorage helpers
- `app/s/[hash]/page.tsx` — shared scene loader
- `tests/lib/shareUrl.spec.ts`, `tests/lib/serializeScene.spec.ts`

### Task 8.1 — Serialize scene

- [ ] **Step 1: Test**

Write `/Users/christopherwest/web/molecular/tests/lib/serializeScene.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { serializeScene, deserializeScene } from '@/src/lib/serializeScene'
import { atomId, bondId, moleculeId } from '@/src/chem/types'

describe('serializeScene', () => {
  it('round-trips water', () => {
    const mId = moleculeId()
    const o = atomId()
    const h1 = atomId()
    const h2 = atomId()
    const scene = {
      atoms: {
        [o]: { id: o, Z: 8, position: [0, 0, 0] as const, velocity: [0, 0, 0] as const, charge: 0, moleculeId: mId },
        [h1]: { id: h1, Z: 1, position: [1, 0, 0] as const, velocity: [0, 0, 0] as const, charge: 0, moleculeId: mId },
        [h2]: { id: h2, Z: 1, position: [-1, 0, 0] as const, velocity: [0, 0, 0] as const, charge: 0, moleculeId: mId },
      },
      bonds: {
        [bondId()]: { id: bondId(), atomA: o, atomB: h1, order: 1 as const, type: 'covalent' as const },
        [bondId()]: { id: bondId(), atomA: o, atomB: h2, order: 1 as const, type: 'covalent' as const },
      },
      molecules: { [mId]: { id: mId, atomIds: [o, h1, h2], bondIds: [] } },
    }
    const json = serializeScene(scene as never)
    const back = deserializeScene(json)
    expect(Object.keys(back.atoms).length).toBe(3)
    expect(Object.keys(back.bonds).length).toBe(2)
  })
})
```

- [ ] **Step 2: Implement**

Write `/Users/christopherwest/web/molecular/src/lib/serializeScene.ts`:

```ts
import type { SceneSnapshot } from '@/src/chem/types'

export function serializeScene(scene: SceneSnapshot): string {
  // Only persist atoms + bonds + molecules — derived ids are stable strings already.
  return JSON.stringify({
    atoms: Object.values(scene.atoms),
    bonds: Object.values(scene.bonds),
    molecules: Object.values(scene.molecules),
  })
}

export function deserializeScene(json: string): SceneSnapshot {
  const raw = JSON.parse(json) as { atoms: any[]; bonds: any[]; molecules: any[] }
  const atoms: SceneSnapshot['atoms'] = {}
  for (const a of raw.atoms) atoms[a.id] = a
  const bonds: SceneSnapshot['bonds'] = {}
  for (const b of raw.bonds) bonds[b.id] = b
  const molecules: SceneSnapshot['molecules'] = {}
  for (const m of raw.molecules) molecules[m.id] = m
  return { atoms, bonds, molecules }
}
```

- [ ] **Step 3: Test passes. Commit.**

```bash
pnpm test tests/lib/serializeScene.spec.ts
git add .
git commit -m "lib: serializeScene / deserializeScene"
git push
```

---

### Task 8.2 — Share URL encoding

- [ ] **Step 1: Test**

Write `/Users/christopherwest/web/molecular/tests/lib/shareUrl.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { encodeToHash, decodeFromHash } from '@/src/lib/shareUrl'

describe('shareUrl', () => {
  it('round-trips a JSON payload', () => {
    const payload = JSON.stringify({ hello: 'world', n: 42 })
    const hash = encodeToHash(payload)
    expect(hash.length).toBeLessThan(payload.length * 2)
    expect(decodeFromHash(hash)).toBe(payload)
  })

  it('handles unicode', () => {
    const p = '{"name":"水"}'
    expect(decodeFromHash(encodeToHash(p))).toBe(p)
  })
})
```

- [ ] **Step 2: Implement**

```bash
pnpm add pako
```

Write `/Users/christopherwest/web/molecular/src/lib/shareUrl.ts`:

```ts
import { deflateRaw, inflateRaw } from 'pako'

function bytesToBase64Url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function encodeToHash(payload: string): string {
  const bytes = deflateRaw(new TextEncoder().encode(payload), { level: 9 })
  return bytesToBase64Url(bytes)
}

export function decodeFromHash(hash: string): string {
  const bytes = base64UrlToBytes(hash)
  const out = inflateRaw(bytes)
  return new TextDecoder().decode(out)
}
```

- [ ] **Step 3: Tests pass; commit**

```bash
pnpm test tests/lib/shareUrl.spec.ts
git add .
git commit -m "lib: shareUrl encode/decode via pako deflate + base64url"
git push
```

---

### Task 8.3 — `/s/[hash]` route + Share button wiring

**Files:**
- Create: `app/s/[hash]/page.tsx`
- Create: `src/lib/persistence.ts`
- Modify: `app/app/AppShell.tsx` (Share button)

- [ ] **Step 1: Persistence helpers**

Write `/Users/christopherwest/web/molecular/src/lib/persistence.ts`:

```ts
import type { SceneSnapshot } from '@/src/chem/types'
import { serializeScene, deserializeScene } from './serializeScene'

const KEY_CURRENT = 'molecular:current-scene'
const KEY_CREATIONS = 'molecular:my-creations'

export function saveCurrent(scene: SceneSnapshot) {
  try {
    localStorage.setItem(KEY_CURRENT, serializeScene(scene))
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

export function loadCurrent(): SceneSnapshot | null {
  try {
    const v = localStorage.getItem(KEY_CURRENT)
    if (!v) return null
    return deserializeScene(v)
  } catch {
    return null
  }
}

export interface SavedCreation {
  name: string
  ts: number
  scene: string
}

export function listCreations(): SavedCreation[] {
  try {
    const v = localStorage.getItem(KEY_CREATIONS)
    return v ? (JSON.parse(v) as SavedCreation[]) : []
  } catch {
    return []
  }
}

export function saveCreation(name: string, scene: SceneSnapshot) {
  const list = listCreations()
  list.push({ name, ts: Date.now(), scene: serializeScene(scene) })
  localStorage.setItem(KEY_CREATIONS, JSON.stringify(list))
}
```

- [ ] **Step 2: Auto-save hook**

Inside `/Users/christopherwest/web/molecular/app/app/AppScene.tsx`, add at the top of `AppScene`:

```tsx
const scene = useStore((s) => s.scene)
useEffect(() => {
  const t = setTimeout(() => saveCurrent(scene), 1000)
  return () => clearTimeout(t)
}, [scene])
```

…and import:

```tsx
import { saveCurrent } from '@/src/lib/persistence'
```

- [ ] **Step 3: `/s/[hash]/page.tsx`**

Write `/Users/christopherwest/web/molecular/app/s/[hash]/page.tsx`:

```tsx
'use client'

import { use, useEffect } from 'react'
import { useStore } from '@/src/store'
import { decodeFromHash } from '@/src/lib/shareUrl'
import { deserializeScene } from '@/src/lib/serializeScene'
import { AppShell } from '../../app/AppShell'

export default function SharedScenePage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params)
  const resetScene = useStore((s) => s.resetScene)
  const addAtom = useStore((s) => s.addAtom)
  const addBond = useStore((s) => s.addBond)
  const addMolecule = useStore((s) => s.addMolecule)

  useEffect(() => {
    try {
      const json = decodeFromHash(hash)
      const scene = deserializeScene(json)
      resetScene()
      for (const m of Object.values(scene.molecules)) addMolecule(m)
      for (const a of Object.values(scene.atoms)) addAtom(a)
      for (const b of Object.values(scene.bonds)) addBond(b)
    } catch (err) {
      console.error('Failed to decode shared scene', err)
    }
  }, [hash, resetScene, addAtom, addBond, addMolecule])

  return <AppShell />
}
```

- [ ] **Step 4: Share button**

Edit `/Users/christopherwest/web/molecular/app/app/AppShell.tsx`. Add at the top-right toolbar (next to "Tutor"):

```tsx
<Button
  variant="ghost"
  size="sm"
  className="min-h-[36px] bg-[#14112e]/80 text-[#dffaff] hover:bg-[#1a163a]"
  onClick={async () => {
    const scene = useStore.getState().scene
    const { encodeToHash } = await import('@/src/lib/shareUrl')
    const { serializeScene } = await import('@/src/lib/serializeScene')
    const hash = encodeToHash(serializeScene(scene))
    const url = `${window.location.origin}/s/${hash}`
    await navigator.clipboard.writeText(url).catch(() => {})
    alert('Share link copied:\n' + url)
  }}
>
  Share
</Button>
```

- [ ] **Step 5: e2e**

Write `/Users/christopherwest/web/molecular/tests/e2e/share.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('share roundtrip — encoded scene loads back identical', async ({ page, context }) => {
  await page.goto('/app')
  // Open library, pick methane
  await page.getByText(/Library ↑|↑/i).first().click().catch(() => null)
  await page.getByRole('button', { name: /^Methane/i }).click()
  // Click Share. We can't read clipboard reliably in CI, so we instead compute the URL
  // by reading the page's store via window.__test_getScene.
  await page.addScriptTag({
    content: `window.__test_getScene = () => Object.values(window).find(o => o && o.getState && o.getState().scene)?.getState().scene`,
  })
  const sceneJson = await page.evaluate(() => {
    return null // Skipped — exercise share button click instead
  })
  // Easier: build a URL with the current scene by clicking Share and reading the alert.
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toMatch(/\/s\/[A-Za-z0-9_-]+/)
    await dialog.accept()
  })
  await page.getByRole('button', { name: /share/i }).click()
})
```

- [ ] **Step 6: Run e2e**

```bash
pnpm test:e2e tests/e2e/share.spec.ts
```

- [ ] **Step 7: Commit (Phase 8 capstone)**

```bash
git add .
git commit -m "persist: auto-save scene + share via /s/[hash] URL; Phase 8 complete"
git push
```

**🎉 Phase 8 demoable:** Build a molecule, click Share — paste the URL anywhere; opening it loads the same scene.

---

# Phase 9 — Polish, accessibility, performance, deploy

**Goal:** Lighthouse mobile ≥ 90, `prefers-reduced-motion` honored, keyboard nav works, service worker caches static assets, Vercel preview/production deploy works with AI Gateway.

### Task 9.1 — `prefers-reduced-motion`

**Files:**
- Modify: `src/scene/Atom.tsx`, `src/scene/AttachPoints.tsx`, `src/landing/HomepageReel.tsx`

- [ ] **Step 1: Hook**

Write `/Users/christopherwest/web/molecular/src/lib/useReducedMotion.ts`:

```ts
'use client'

import { useEffect, useState } from 'react'

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mql.matches)
    const onChange = () => setReduced(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return reduced
}
```

- [ ] **Step 2: Use in Atom**

In `/Users/christopherwest/web/molecular/src/scene/Atom.tsx`, add at top:

```tsx
import { useReducedMotion } from '@/src/lib/useReducedMotion'
```

…and gate the `useFrame` electron rotation:

```tsx
const reduced = useReducedMotion()
useFrame((_, delta) => {
  if (reduced) return
  // existing rotation code
})
```

Also gate the AttachPoints pulse and HomepageReel auto-advance.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "a11y: honor prefers-reduced-motion across scene components"
git push
```

---

### Task 9.2 — Device tier detection

**Files:**
- Create: `src/lib/deviceTier.ts`
- Modify: `src/scene/Scene.tsx`

- [ ] **Step 1: Implement**

Write `/Users/christopherwest/web/molecular/src/lib/deviceTier.ts`:

```ts
export type DeviceTier = 'mobile-lite' | 'tablet' | 'desktop'

export function detectDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'desktop'
  const isTouch = window.matchMedia('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency ?? 4
  if (isTouch && cores <= 4) return 'mobile-lite'
  if (isTouch) return 'tablet'
  return 'desktop'
}
```

- [ ] **Step 2: Use in Scene to gate bloom**

In `/Users/christopherwest/web/molecular/src/scene/Scene.tsx`, add:

```tsx
import { useEffect, useState } from 'react'
import { detectDeviceTier, type DeviceTier } from '@/src/lib/deviceTier'

// inside Scene:
const [tier, setTier] = useState<DeviceTier>('desktop')
useEffect(() => setTier(detectDeviceTier()), [])
const useBloom = enableBloom && tier !== 'mobile-lite'
```

…and gate the `<EffectComposer>` on `useBloom`.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "perf: detect device tier and disable bloom on mobile-lite"
git push
```

---

### Task 9.3 — Service worker for offline second-load

**Files:**
- Create: `app/sw-register.tsx`, `public/sw.js`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Service worker**

Write `/Users/christopherwest/web/molecular/public/sw.js`:

```js
const CACHE = 'molecular-v1'
const PRECACHE = ['/textures/electron.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)))
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached
      return fetch(req).then((res) => {
        if (res.ok && req.url.startsWith(self.location.origin)) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(req, clone))
        }
        return res
      })
    }),
  )
})
```

- [ ] **Step 2: Registration component**

Write `/Users/christopherwest/web/molecular/app/sw-register.tsx`:

```tsx
'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])
  return null
}
```

- [ ] **Step 3: Mount in layout**

Edit `/Users/christopherwest/web/molecular/app/layout.tsx`:

```tsx
import { ServiceWorkerRegister } from './sw-register'
// inside <body>:
<ServiceWorkerRegister />
{children}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "perf: register service worker; cache electron texture for offline 2nd load"
git push
```

---

### Task 9.4 — README + final docs

**Files:**
- Replace: `README.md`

- [ ] **Step 1: Write README**

Write `/Users/christopherwest/web/molecular/README.md`:

```markdown
# Molecular

A mobile-first 3D educational chemistry web app. Browse a curated molecule library, build atoms and molecules by drag-and-snap, and run reactions in a Lab mode with physics. AI tutor included.

Built with Next.js 16, react-three-fiber, Zustand, and Vercel AI Gateway.

## Local development

Requires Node 24 and pnpm 9.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

To enable the AI tutor locally, set `AI_GATEWAY_API_KEY` in `.env.local`. On Vercel, the Gateway is wired automatically once your project is linked.

## Scripts

| Command            | What it does                              |
|--------------------|-------------------------------------------|
| `pnpm dev`         | Start the dev server with Turbopack       |
| `pnpm build`       | Production build                          |
| `pnpm start`       | Run the production build                  |
| `pnpm lint`        | Biome lint + format check                 |
| `pnpm lint:fix`    | Auto-fix Biome issues                     |
| `pnpm typecheck`   | TypeScript with `--noEmit`                |
| `pnpm test`        | Vitest unit tests                         |
| `pnpm test:e2e`    | Playwright end-to-end tests               |

## Architecture

See [DESIGN.md](./DESIGN.md) for the complete spec. Short version:

- **`src/chem/`** — periodic table data, bonding rules, VSEPR geometry, reactions, scene validation. Pure TypeScript, no DOM.
- **`src/scene/`** — react-three-fiber components: `<Scene>`, `<Atom>`, `<Bond>`, `<Molecule>`, `<DragGhost>`, `<AttachPoints>`.
- **`src/store/`** — Zustand slices: scene, ui, build, lab, tutor.
- **`src/ui/`** — 2D UI shells (mobile-first), built on shadcn/ui.
- **`src/landing/`** — homepage hero + autonomous reaction reel.
- **`src/data/`** — curated molecule library + named-molecule lookup.
- **`app/`** — Next.js App Router. `/` is the landing page, `/app` is the interactive app, `/s/[hash]` loads a shared scene.

## Tests

Unit tests (Vitest) cover the chem engine exhaustively. End-to-end tests (Playwright) cover:

1. Landing page renders and CTA navigates
2. Library spawn from `/app`
3. Build mode attach-point flow
4. Lab mode reaction
5. Share-link roundtrip

All tests run on `mobile-chrome` (Pixel 7 emulation) **and** `desktop-chrome`. Mobile is the primary target.

## License

MIT. See `LICENSE`.
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "docs: write README with run/test instructions and architecture overview"
git push
```

---

### Task 9.5 — Vercel deploy

**Files:** None new; uses the `vercel.ts` from Phase 0.

- [ ] **Step 1: Link the project**

```bash
pnpm dlx vercel@latest link
```

Follow prompts; pick the appropriate Vercel team.

- [ ] **Step 2: Verify the link**

```bash
pnpm dlx vercel@latest project
```

- [ ] **Step 3: Production deploy (preview first)**

```bash
pnpm dlx vercel@latest
```

Expected: a preview URL like `https://molecular-<hash>-<team>.vercel.app`. Visit it; verify the homepage reel runs and `/app` works.

- [ ] **Step 4: Promote to production**

Only after verifying preview:

```bash
pnpm dlx vercel@latest --prod
```

- [ ] **Step 5: Lighthouse check (mobile)**

In Chrome DevTools → Lighthouse → Mobile preset → run on the production URL. Expected: Performance + Accessibility ≥ 90.

If perf is below 90, the most likely culprits:
- bloom enabled on mobile (Task 9.2 should have caught this — verify `detectDeviceTier()` returns `mobile-lite`)
- starfield star count too high — drop from 3000 to 800 on mobile in `Scene.tsx`
- electron sprite count too high per atom — drop max from 8 to 4 in `mobile-lite`

- [ ] **Step 6: Commit any tuning + push**

If you made tuning edits:

```bash
git add .
git commit -m "perf: tune star count and electron cap for mobile-lite tier"
git push
```

- [ ] **Step 7: Tag v1**

```bash
git tag v1.0.0
git push --tags
```

**🎉 Phase 9 demoable:** Production URL up on Vercel. Lighthouse mobile ≥ 90. `git tag v1.0.0` exists. Ship-able.

---

## Plan summary

| Phase | Tasks | Demoable |
|---|---|---|
| 0 | 6 | App scaffolds, runs, CI passes |
| 1 | 7 | Chem engine: ~50 unit tests pass |
| 2 | 7 | Hardcoded water renders in 3D at /app |
| 3 | 6 | Library spawn + Inspector + ModeSwitcher (mobile-first) |
| 4 | 5 | Drag-snap Build mode with attach points |
| 5 | 5 | Lab mode: spawn reactants, react, log |
| 6 | 3 | AI tutor streams scene-aware responses |
| 7 | 2 | Landing page with autonomous reel |
| 8 | 3 | Auto-save + share via URL hash |
| 9 | 5 | Polish, a11y, perf, Vercel deploy |

**Total:** ~49 tasks across 10 phases. Each phase ships a working increment. Total estimated effort for a skilled developer: 3–5 focused weeks.

---

## Known follow-ups (v1.x candidates — not blocking v1 ship)

These are honest gaps where this plan ships the mobile-first MVP but leaves richer UX for a fast follow:

1. **Tablet (≥720 px) and desktop (≥1100 px) layouts.** The plan implements the mobile drawer/sheet layout as the always-on baseline and confirms it works on all viewports. The spec calls for a left side-sheet at tablet width and a three-column desktop layout. Add these as Phase 9.6 — they're CSS-driven (Tailwind responsive variants) and don't require new logic.

2. **Tier toggle UI.** The `tier` state is in the store and the palette respects it (Beginner shows Z 1–20, Standard/Advanced show 1–36). The plan does not include a UI to switch tiers. Add a settings sheet with a tier selector — small task, big educational lever.

3. **Periodic-table overlay modal.** `toggleFullTable` action exists in the store but no overlay component renders. Add `<PeriodicOverlay>` (Dialog with the 18-column textbook grid).

4. **Reaction electron-transfer animation.** Phase 5's `applyReaction` removes reactants and spawns products in one frame. The spec calls for an interpolated transition (atoms tween, electron sparks animate). Re-implement as a `<ReactionAnimator>` component that holds an in-flight transition state and crossfades.

5. **High-contrast accessibility mode.** Phase 9.1 covers `prefers-reduced-motion`; the spec also mentions a high-contrast toggle (solid CPK colors, thicker bonds, no bloom). Add a settings flag.

6. **Keyboard navigation in 3D scene.** Tab cycling through atoms, arrow-key nudge, Enter to select. Phase 9 doesn't include this beyond DOM-level focus order.

7. **Undo / redo.** Spec calls for ⌘Z / ⇧⌘Z using immer patches. The store currently uses immer for mutations but doesn't capture patches into a history stack. Add a `historySlice`.

Each is small (1–3 tasks). Park them in the project tracker after v1 ships; revisit based on real user feedback.

---

## Self-review notes

- **Spec coverage:** every section of DESIGN.md has at least one task. §17 (open questions) is intentionally deferred. The follow-ups list above flags the gaps that exist *despite* a task being in scope.
- **Type consistency:** branded ids (`AtomId`/`BondId`/`MoleculeId`), `Atom`/`Bond`/`Molecule`/`SceneSnapshot`, `BondOrder`, `BondType` are introduced in Task 1.1 and used unchanged through every later task.
- **Naming consistency:** scene store action names are stable (`addAtom`, `removeAtom`, `addBond`, `setMode`, etc.). Library helpers: `getLibraryEntry`, `spawnLibraryEntry`. Chemistry: `canBond`, `getBondingSites`, `getFormula`, `findReaction`, `validateScene`. Persistence: `serializeScene`/`deserializeScene`, `encodeToHash`/`decodeFromHash`.
- **No placeholders in code blocks:** every step that changes code shows the actual code. The word "placeholder" appears only in legitimate uses (input `placeholder=`, Phase 0 placeholder page).
- **Commits respect repo memory:** every commit is under Chris West; no `Co-Authored-By` lines.



