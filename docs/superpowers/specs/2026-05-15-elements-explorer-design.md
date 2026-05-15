# Periodic Table of Elements Explorer — Design Spec

**Status:** Approved (2026-05-15)
**Branch:** `feature-elements-explorer`

## Goal

Add an interactive periodic-table explorer at `/elements`. Visitors browse the full 118-element periodic table, click a tile to see a large 3D rendering of that atom (protons + neutrons swirling in the nucleus, electrons orbiting on shells), and read educational content about discovery, common uses, and everyday examples. Related molecules from the library link back into the lab.

The feature is mobile-first like the rest of the app, ships with a homepage promo section, and reuses the existing R3F + design vocabulary so it feels native.

---

## Routing

- **`/elements`** — full periodic-table grid, no selection
- **`/elements/[slug]`** — same shell, with one element selected and its detail card expanded
- Both routes mount a single client component (`<ElementsExplorer>`)
- Selection state lives in the component; the URL syncs via `history.replaceState` so a tile click never triggers a Next.js route transition
- Direct loads of `/elements/[slug]` hydrate selection from the URL — important for shareable links and SEO

Element slugs are lowercase element names: `/elements/hydrogen`, `/elements/oxygen`, `/elements/iron`.

## Data layer

### Existing
- `src/chem/elements.ts` — Z 1–36 with the `Element` type (symbol, name, mass, category, color, valenceElectrons, shells). **Unchanged.** The chem engine keeps using this dataset, so bonding rules / VSEPR / reactions stay scoped to the curated subset.

### New
**`src/data/elementsFull.ts`** — Z 1–118 records using a slimmer type tailored for the periodic-table view:

```ts
export interface PeriodicElement {
  Z: number
  symbol: string
  name: string
  mass: number
  category: ElementCategory  // existing enum
  /** Row in the textbook 7-row layout (1–7). Lanthanide/actinide use 8/9 visually. */
  row: number
  /** Column 1–18 in the textbook layout. */
  column: number
  /** Electron shell occupancy: e.g. [2, 8, 18, 18, 1] for silver. */
  shells: number[]
}
```

Periodic-table rows include the lanthanide row (Z 57–71) and actinide row (Z 89–103) rendered as a separate band below the main grid. We assign them `row: 8` / `row: 9` and column positions 4..18 to match the textbook offset.

`ElementCategory` gets two new values to cover the heavies: `'post-transition' | 'lanthanide' | 'actinide'`. Existing category mappings stay intact.

**`src/data/elementsContent.ts`** — supplementary educational fields keyed by Z:

```ts
export interface ElementContent {
  discoveredYear?: number
  discoveredBy?: string
  /** 3–6 short phrases for the "Common uses" list. */
  uses?: string[]
  /** One short paragraph (1–3 sentences) for "Everyday examples". */
  everydayExamples?: string
}
export const ELEMENT_CONTENT: Record<number, ElementContent>
```

Heavy / obscure elements may have empty entries — the UI shows the corresponding section as "Coming soon" rather than rendering an empty block.

### Lookup helpers
- `getPeriodicElement(Z: number): PeriodicElement | undefined`
- `getPeriodicElementBySlug(slug: string): PeriodicElement | undefined`
- `getElementContent(Z: number): ElementContent`
- `slugForElement(name: string): string` — lowercase, hyphenate

---

## 3D atom — sub-atomic particles

New component **`src/scene/ElementAtom.tsx`**. Independent from the existing `<Atom>` so the molecule scenes stay unchanged.

### Visual

- **Nucleus volume**: a soft, semi-transparent sphere (`meshBasicMaterial`, `opacity: 0.18`, `toneMapped: false`) at the atom origin. Sized to scale modestly with mass (`NUCLEUS_BASE_RADIUS * (1 + Math.log10(mass) * 0.15)`) so heavy atoms read bigger but uranium isn't 5× the size of hydrogen.
- **Protons**: red (`#ff7a8c`) spheres `0.05` units across. Count = Z. Initial positions sampled inside the nucleus volume on a Fibonacci-distributed sphere so they fill the volume evenly.
- **Neutrons**: grey-blue (`#9aa0c8`) spheres, same size. Count = `Math.round(mass) - Z`. Initial positions similarly sampled.
- **Per-frame jitter**: each particle has a `phaseOffset` and `frequency`; useFrame updates position to `basePosition + sin(t * freq + phase) * 0.05` along each axis. Reads as gentle swarming.
- **Electron shells**: same renderer as the existing `<Atom>` — concentric shells with electrons orbiting. Reuse the existing `electronPlans` computation by extracting it into `src/scene/electronShells.ts` so both `<Atom>` and `<ElementAtom>` share the logic.

### Performance

- Heavy elements have a lot of particles (uranium: 92 protons + 146 neutrons = 238 spheres). Use `<Instances>` from drei to batch into 2 draw calls (one for protons, one for neutrons).
- Skip per-frame jitter when `prefers-reduced-motion` is set — particles render at their base positions only.
- Mobile-lite device tier: cap visible particles at 60 protons + 60 neutrons (sample a subset). Tied to existing `detectDeviceTier()`.

### Reduced-motion handling

When `useReducedMotion()` returns true:
- No particle jitter
- No electron orbit rotation (already handled by the existing hook in `<Atom>`)
- Static frame, still draws everything

### Reuse inside `<Atom>`

The existing `<Atom>` component (used in molecules) keeps its solid-nucleus look. We do **not** add a `showSubatomic` prop to `<Atom>` — `<ElementAtom>` is the dedicated visualization for `/elements`. Other surfaces keep the molecule-friendly solid sphere.

---

## Periodic table grid

**`src/elements/PeriodicTableGrid.tsx`** — pure presentational client component.

### Layout

- CSS Grid: `grid-template-columns: repeat(18, minmax(0, 1fr))`, `grid-template-rows: repeat(9, minmax(0, 1fr))`
- Each tile placed via `style={{ gridColumnStart, gridRowStart }}` based on its `column`/`row` data
- Lanthanide + actinide bands sit on rows 8 + 9, columns 3–17 — matches the standard textbook offset
- A small gap between rows 7 and 8 visually separates the band

### Tile

`src/elements/PeriodicTile.tsx` — clickable card:
- Aspect-square
- Left-edge category accent strip (5px inset shadow, like `PaletteCard`)
- Z (small, top-left), symbol (large, center), name (small, bottom)
- Hover: `scale(1.06)` + soft glow shadow + raised z-index so it doesn't crop against neighbors
- `aria-label` and keyboard focus styling

### Mobile fallback

The textbook 18-column layout is too wide on phones. Below `md:` (768px), render the elements as a **scrollable list grouped by period** instead of a grid — same cards, sorted by Z, grouped under "Period 1", "Period 2"... headers. The user gets the same data, just in a column layout that fits. Above `md:` we render the canonical grid.

---

## Animated tile → detail transition

When a tile is clicked:

1. Capture the tile's `getBoundingClientRect()` and store in selection state alongside the element
2. Trigger a FLIP-style animation:
   - The clicked tile gets `position: fixed`, animates from its rect → detail-card target rect over `400ms easeOutCubic`
   - Sibling tiles fade to `opacity 0.2` and `blur(2px)` during the transition
   - The 3D scene fades in at the morph endpoint
3. URL updates to `/elements/[slug]` via `history.replaceState` once the animation begins
4. Closing (back button, ESC, or tap outside) reverses: tile shrinks back to its grid slot, siblings clear

Implementation:
- Track `selection: { element: PeriodicElement, originRect: DOMRect } | null` in `<ElementsExplorer>`
- A `<TileMorphLayer>` overlay component handles the animated clone via `transform` updates each frame (no DOM thrash)
- On mobile (where the layout is a list, not a grid), skip the morph and use a clean cross-fade instead

### Reduced-motion fallback

When `prefers-reduced-motion` is set: skip the morph entirely. Tile click instantly hides the grid and shows the detail card; no animation.

---

## Element detail card

**`src/elements/ElementDetail.tsx`** — renders inside `<ElementsExplorer>` when a selection exists.

### Layout

- **Above the fold** on desktop: large 3D atom scene on the left, element data column on the right
- **Stacked on mobile**: 3D scene on top, data column below
- 3D scene uses a slow auto-rotate (drei OrbitControls `autoRotate`, same low speed as the demo results turntable)

### Sections (top → bottom in the data column)

1. **Heading** — `{symbol}` huge, with `{name}` in smaller caps below it; category badge with accent color
2. **Atomic stats**: Z, atomic mass, category label, electron shell list (`2, 8, 8, 2` formatted)
3. **Discovery** (if `discoveredYear` present): "Discovered in {year} by {discoveredBy}"
4. **Common uses** (if `uses.length > 0`): bulleted list
5. **Everyday examples** (if `everydayExamples` present): short paragraph
6. **Related molecules** — see next section

### Close affordance

Top-left back button (`ArrowLeft` icon in a glass pill) returns to the grid. Also wire ESC.

---

## Related molecules

Below the detail card on the element detail view:

- Iterate `LIBRARY` from `src/data/molecules.ts`
- A molecule is "related" if any of its `atoms` has `Z === selected.Z`
- Render as a horizontal scrollable row of mini-cards (similar to `DemoShowcase`'s demo cards). Each card shows the formula + name; clicking goes to `/app?molecule=[libraryId]`.
- If no library molecule contains the element, render: "No library molecules contain {name} yet."
- Section heading: "See Related Molecules"

---

## Homepage promo

**`src/landing/ElementsShowcase.tsx`** — placed between `<DemoShowcase>` and `<HowItWorks>` on the homepage.

### Layout

- Two-column on `md:`+ / stacked on mobile
- **Left**: compact preview of the periodic table (~50% scale of the real grid, non-interactive but the whole left side is clickable → `/elements`). Renders the actual tile components for visual consistency.
- **Right**: large rotating 3D atom. Cycle through a curated rotation of visually rich elements every ~6s (iron, uranium, gold, silicon, oxygen). Uses `<ElementAtom>`.
- Below both: heading "Explore every element in 3D", short body copy, glass-pill CTA "Open the periodic table →" linking to `/elements`.

### Title accent

Use the same tri-color gradient (`#5cc6ff → #ec59b6 → #ffd97a`) on the section heading as other landing sections, for visual continuity.

---

## SEO + metadata

### Routes
- `/elements`: title "Periodic Table · Molecular", description focused on educational tone
- `/elements/[slug]`: per-element generated title `"{Name} ({Symbol}) · Molecular"` and description pulled from content + atomic data
- `alternates.canonical` set per route
- OpenGraph + Twitter card metadata
- JSON-LD `LearningResource` on each element page (similar to demo pages)

### Sitemap
Extend `app/sitemap.ts` to include `/elements` + every `/elements/[slug]`.

### Robots
Existing `app/robots.ts` already allows `/` — `/elements` falls under that. No change needed.

---

## Component file structure

```
src/data/
  elementsFull.ts          # Z 1-118 with row/column/shells
  elementsContent.ts       # discovery/uses/examples per Z
src/scene/
  ElementAtom.tsx          # protons + neutrons + electrons + translucent nucleus
  electronShells.ts        # extracted from Atom.tsx; shared planner
src/elements/
  ElementsExplorer.tsx     # top-level client component, manages selection + URL
  PeriodicTableGrid.tsx    # 18×9 desktop grid
  PeriodicTableList.tsx    # mobile period-grouped list fallback
  PeriodicTile.tsx         # single tile (reused by grid + list)
  ElementDetail.tsx        # 3D scene + data column + related molecules
  TileMorphLayer.tsx       # FLIP transition overlay
src/landing/
  ElementsShowcase.tsx     # homepage promo
app/elements/
  page.tsx                 # /elements server entry
  [slug]/page.tsx          # /elements/[slug] server entry with generateMetadata
```

---

## Implementation plan (phases)

| # | Phase | Demoable |
|---|---|---|
| 1 | Data: extend to Z 1–118 + content | Unit tests assert each Z has correct row/column/category |
| 2 | `<ElementAtom>` 3D component | Renders standalone on a test page; protons/neutrons swirl, electrons orbit |
| 3 | Periodic-table grid + list + tile | `/elements` renders the full table, tiles clickable but selection no-ops |
| 4 | Detail card + selection state + URL sync | Clicking a tile shows the detail; direct loads of `/elements/iron` work |
| 5 | Tile → detail morph transition | The clicked tile animates into place |
| 6 | Related molecules section | Library matches surface as clickable cards |
| 7 | Homepage `<ElementsShowcase>` + page integration | Visible on `/`, linkable |
| 8 | Metadata + sitemap + JSON-LD + polish | SEO complete; `pnpm build` clean |

Each phase ends with a working increment that can be reviewed locally.

---

## Out of scope (v2 follow-ups)

- Isotope picker on the detail card (showing variants with different neutron counts)
- "Compare elements" multi-select on the grid
- Filter/search by category or property
- Heavy-element placeholder pages for the elements where we don't yet have content (they'll just show empty Discovery/Uses sections in v1)
- Bonding-rule extension to use heavies in molecules — explicitly out of scope; the chem engine stays at Z 1–36
