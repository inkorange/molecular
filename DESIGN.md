# Molecular — Design Document

**Status:** Approved design for v1
**Date:** 2026-05-12
**Repo:** `git@github.com:inkorange/molecular.git`

---

## 1. Goals & Audience

**One-line:** A 3D web app where students browse, build, and experiment with atoms, molecules, and compounds — in a stylized, animated, electron-aware space.

**Tiers** (all served by one product; UI scales with the user):

- **Beginner** — middle / early-high-school. Default mode. Only elements 1–20 in the palette at full opacity. Labels show full element names on hover. Friendly tutor register.
- **Standard** — high school / AP chem. Elements 1–36, common ions, all v1 reactions. VSEPR-accurate bond angles. Formulas displayed (H₂O, NaCl).
- **Advanced** — college intro. Reveals electron configuration (1s² 2s² 2p⁴), bond hybridization (sp³), formal charges. Tutor uses precise terminology.

**Success criteria for v1:**

1. A first-time visitor lands on the **homepage** and watches at least one full reaction cycle in the background before clicking through to the app.
2. A student can drop atoms in the scene and **build water, methane, salt, and carbon dioxide** in under 2 minutes, with no prior instruction.
3. A student can **search "glucose" in the molecule library** and instantly see C₆H₁₂O₆ rotating in 3D, with its formula, common name, and a "tell me about this molecule" button.
4. A student can **throw two H₂ at one O₂** in Lab mode and watch them react into 2 H₂O — with electron transfer/sharing visualized.
5. The **AI tutor** can answer "why did this happen?" given the current scene state.
6. Runs at 60 fps on a 2020 MacBook Air at full window; gracefully degrades on tablets and phones. Homepage hero hits TTI ≤ 1.5 s on Fast 4G.

---

## 2. Core Experiences

Three top-level modes, switchable from a persistent toolbar. The 3D viewport is the canvas; sidebar + inspector wrap it.

### A. Explore (default landing)

The 3D viewport shows a single molecule centered (or empty on first visit). The left sidebar is the **Molecule Library** — a search field, category filters (Water & Solvents, Acids & Bases, Hydrocarbons, Salts & Ionic, Biological, Gases), and a list of curated molecules (~30–50 for v1). Click any entry → it spawns fully built in the scene, ready to inspect, rotate, and explore. The right-side **Inspector** shows the selected molecule's metadata: common name, formula, atomic composition, total electrons, common uses, and a "Tell me about this molecule" button that streams an AI explanation.

Camera: mouse-drag to orbit, scroll to zoom, ⌘/⌥-drag to pan. Touch: two-finger orbit, pinch zoom, long-press for context menu.

### B. Build

The left sidebar switches to the **Periodic Table palette** (see §7). User drags an element card into the viewport; the card morphs into a full 3D atom (nucleus + swirling electrons) on the cursor. Existing atoms in the scene light up valid bonding sites as pulsing green dots (see §8 for full interaction). The Inspector shows the current molecule's live formula and validity ("✓ Water", "⚠ Free radical", etc.). Buttons: **Save** (to localStorage "My Creations"), **Share link** (URL hash).

### C. Lab

Same scene as Build, but physics enabled (lazy-loaded `@react-three/rapier`). Toolbar lets the user select an atom or molecule, then **fling** it (click-drag direction + force; a vector arrow shows the trajectory). On collision, the chemistry engine checks: does this match a known reaction? If yes, animate the transformation — electrons visibly transfer (ionic) or share (covalent), old bonds dissolve, new bonds glow into place. If no match, atoms bond per valence rules if energy + geometry allow, otherwise bounce. A **Reaction Log** panel records what happened ("2 H₂ + O₂ → 2 H₂O · synthesis · ΔH released").

### D. Landing page (homepage, route `/`)

The first thing a visitor sees, and a ship-blocker for v1. A fullscreen R3F canvas plays an **autonomous reaction reel** in the background — one molecule at a time, anchored off-center to the right so it doesn't compete with the hero copy on the left.

**The reel** (~8 s per cycle, then loops cleanly):

1. **Water (H₂O)** — O drifts in from offscreen; 2 H follow from opposite sides; valence sites pulse; H atoms snap; covalent bonds form with the electron-pair animation; water rotates serenely; fade.
2. **Methane (CH₄)** — C arrives at center; 4 H come in from tetrahedral directions; snap simultaneously; the 109.5° tetrahedron resolves; fade.
3. **Ammonia (NH₃)** — N arrives; 3 H bond; pyramidal shape settles; lone pair shown as a faint paired-electron cluster; fade.
4. **Salt (NaCl)** — Na and Cl approach; the **ionic transfer animation** plays — a single electron literally jumps from Na to Cl, leaving Na⁺ and Cl⁻; the ions sit electrostatically close with a dotted line between them; fade.
5. Loop.

**Foreground content (above the fold):** product wordmark + slim top nav (About / Library / Lab), hero title ("Build the periodic table in 3D."), tagline, two CTAs ("Open the Lab →" routes to `/app`; "Browse molecules" routes to `/app?mode=explore`), and a scroll hint.

**Below the fold:** three feature cards (Explore / Build / Lab), each with its own small live R3F preview canvas demonstrating that mode; a 3-step "How it works" strip (pick an atom → snap bonds → see the chemistry); a footer with GitHub link and credits.

**Reusability.** The reel uses the same `<Atom>`, `<Bond>`, and `<ReactionAnimator>` components as the app. A thin `<HomepageReel>` orchestrator schedules each cycle, tweens incoming atoms from offscreen positions, and emits the bond-formation events the existing components already handle.

**Interactivity in the background:**

- Clicking the central molecule jumps the user to Explore mode at `/app` with that exact molecule preloaded.
- Hovering pauses the reel (so it doesn't fade away mid-read).
- Cursor movement adds subtle parallax to the starfield.

**Performance budget:** TTI ≤ 1.5 s on Fast 4G. First paint shows the foreground text + a static starfield placeholder; the canvas hydrates after, and the reel starts on a one-frame delay.

**Reduced-motion / mobile fallback:**

- `prefers-reduced-motion` — render only the rest state (a single hand-arranged water molecule), no incoming atoms, no shock-burst, electron orbits frozen.
- Mobile — same fallback by default; cycle still runs but at a slower cadence (~12 s) with no bloom.

### Cross-cutting features (all modes)

- **AI Tutor sidebar** (collapsible, right side or bottom drawer on mobile) — always context-aware of the current scene. Suggested prompts change per mode.
- **Tier toggle** — Beginner / Standard / Advanced controls palette extent, label verbosity, tutor register.
- **Share** — current scene → compact URL hash. Paste anywhere; load via `/s/[hash]`.
- **Undo / Redo** — ⌘Z / ⇧⌘Z (immer patch history in the store).
- **Validity bar** (bottom of viewport) — live verdict of what's currently in the scene.

---

## 3. Visualization System

### Atoms

Each atom is a `THREE.Group`:

- **Nucleus** — a sphere mesh with a radial gradient material. Color is from the standard **CPK palette** (H=white, C=gray, N=blue, O=red, F=green, Na=violet, Cl=green, S=yellow, …), overlaid with bloom for the glow signature.
- **Element label** — a billboarded text mesh always-on (white-stroked text), showing the symbol (H, O). Hover reveals full name; in Advanced tier, hover also shows electron configuration.
- **Electron shells** — one nested rotating group per electron shell, computed from the element's `shells` array (e.g., O = `[2, 6]` → two shells). Each shell rotates on its own tilted axis at its own speed (inner shells faster, outer slower).
- **Electrons** — `THREE.Sprite` instances using a soft radial-gradient texture with additive blending. Fuzzy, not crisp. Each electron is small (~3px effective at default zoom) and tight to the nucleus — not sprawling — so they don't visually overlap neighboring atoms in bonded molecules.
- **Valence electrons** (outer shell) get a brighter tint and a subtle 1.6 s opacity pulse to signal "these are the ones that bond."

### Bonds

- **Covalent** — a glowing cylindrical beam between the two atom surface points (edge-to-edge, not center-to-center). Color: a cool cyan-white with bloom. Double / triple bonds = two / three parallel beams.
- **Ionic** — visually distinct: a brief electron-transfer animation at formation (one electron flies from donor to acceptor), then the resulting ions sit close together with a faint dotted electrostatic line rather than a solid beam.
- **Bond formation animation** — when a bond first forms, the appropriate electron sprites animate into the bond region (covalent pair sliding into the beam) or transfer (ionic), reinforcing what the bond *is*.

### Scene backdrop

- Deep-space gradient (`radial-gradient(circle at 50% 50%, #1a1135 0%, #07051a 100%)`).
- Subtle drei `<Stars>` parallax for depth.
- Bloom post-processing pass for the glow signature.

### Reduced-motion / accessibility

- `prefers-reduced-motion`: electrons freeze (still present, just static), pulses disabled, drag-morph is instant.
- Optional **high-contrast** toggle: replaces the moody palette with solid CPK colors at full saturation, thicker bond outlines, no bloom.

---

## 4. Chemistry Engine

Pure TypeScript, fully unit-tested, 100% client-side.

### Layer 1 — Bonding rules

A small module driven by a periodic-table data file. For each element 1–36 we store:

```ts
interface Element {
  Z: number                  // atomic number
  symbol: string             // 'H', 'O', 'Na', …
  name: string               // 'Hydrogen', 'Oxygen', …
  mass: number               // atomic mass
  category:
    | 'alkali' | 'alkaline' | 'transition' | 'other-metal'
    | 'metalloid' | 'nonmetal' | 'halogen' | 'noble'
  cpkColor: string           // '#FFFFFF', '#FF0D0D', …
  shells: number[]           // electron configuration, e.g. [2, 6] for O
  valence: number            // valence electron count
  oxidationStates: number[]  // typical states, e.g. [-2] for O
  electronegativity: number  // Pauling
  vdwRadius: number          // Å, for visual scaling
}
```

The engine exposes:

- `canBond(a: Element, b: Element): { allowed: boolean; order: 1|2|3; type: 'covalent'|'ionic'; preference: 'common'|'unusual' }` — applies octet/duet rules + electronegativity diff (Δχ > 1.7 ⇒ ionic preference).
- `getBondingSites(atom: Atom, scene: SceneState): VsperSite[]` — returns 3D positions for unfilled valence slots, oriented to VSEPR geometry (linear 180°, trigonal planar 120°, tetrahedral 109.5°, trigonal bipyramidal, octahedral). These positions become the green attach-point dots in Build mode.
- `getGeometry(centralAtom: Atom, scene: SceneState): VsperGeometry` — for a multi-bond atom, picks the correct geometry based on electron-pair count (incl. lone pairs).

### Layer 2 — Curated reaction database

A JSON/TS file with ~30 reactions for v1, grouped by type:

- **Synthesis:** 2 H₂ + O₂ → 2 H₂O, N₂ + 3 H₂ → 2 NH₃, 2 Na + Cl₂ → 2 NaCl, 2 Mg + O₂ → 2 MgO, C + O₂ → CO₂
- **Combustion:** CH₄ + 2 O₂ → CO₂ + 2 H₂O, C₂H₆ + 3.5 O₂ → 2 CO₂ + 3 H₂O, C₂H₅OH + 3 O₂ → 2 CO₂ + 3 H₂O
- **Neutralization:** HCl + NaOH → NaCl + H₂O, H₂SO₄ + 2 NaOH → Na₂SO₄ + 2 H₂O
- **Single displacement:** Zn + 2 HCl → ZnCl₂ + H₂, Fe + CuSO₄ → FeSO₄ + Cu (Standard tier+)
- **Decomposition:** 2 H₂O → 2 H₂ + O₂ (electrolysis prompt), 2 H₂O₂ → 2 H₂O + O₂, CaCO₃ → CaO + CO₂

Each entry:

```ts
interface Reaction {
  id: string
  type: 'synthesis' | 'decomposition' | 'displacement' | 'combustion' | 'neutralization'
  reactants: { formula: string; count: number }[]
  products: { formula: string; count: number }[]
  activationEnergy: number    // arbitrary units; gates Lab-mode collision
  enthalpy: 'exothermic' | 'endothermic'
  notes: string               // human-readable, used by the tutor
}
```

### Layer 3 — Scene validation

`validate(scene): ValidationResult` runs on every scene change (debounced):

- `valid + named` — formula matches a known compound (e.g. H₂O → "Water").
- `valid + unnamed` — passes octet/valence rules but isn't in the named library (e.g., C₂H₅Cl).
- `valid + unusual` — passes rules but is uncommon (free radical, expanded octet) — tutor can explain why.
- `invalid` — broken octet, impossible geometry, or violates a hard rule.

Drives the validity bar at the bottom of the viewport.

---

## 5. Data Model & State

### Core types

```ts
type AtomId = string
type BondId = string
type MoleculeId = string

interface Atom {
  id: AtomId
  Z: number                // atomic number, 1–36
  position: [number, number, number]
  velocity: [number, number, number]   // used in Lab mode
  charge: number           // 0, +1, -1 for ions
  moleculeId: MoleculeId
}

interface Bond {
  id: BondId
  atomA: AtomId
  atomB: AtomId
  order: 1 | 2 | 3
  type: 'covalent' | 'ionic'
}

interface Molecule {
  id: MoleculeId
  atomIds: AtomId[]
  bondIds: BondId[]
  // derived (cached): formula, knownName, electronCount
}

interface SceneState {
  atoms: Record<AtomId, Atom>
  bonds: Record<BondId, Bond>
  molecules: Record<MoleculeId, Molecule>
  mode: 'explore' | 'build' | 'lab'
  tier: 'beginner' | 'standard' | 'advanced'
  selection: AtomId | MoleculeId | null
  history: Patch[]          // immer patches for undo/redo
}
```

### Store

**Zustand** with `immer` middleware. Slices:

- `sceneSlice` — scene state above; mutating actions emit immer patches captured by the history slice.
- `uiSlice` — panels open/closed, drag-in-progress, overlay state.
- `tutorSlice` — message history, streaming state, suggested prompts.
- `historySlice` — undo / redo stacks of immer patches.

R3F components subscribe with selectors so individual atom moves don't trigger unrelated re-renders.

### Persistence

- **localStorage** — `molecular:current-scene` (auto-saved, debounced 1 s), `molecular:my-creations` (named, user-explicit saves), `molecular:settings` (tier, reduced motion override, high-contrast).
- **URL hash** — `share()` encodes the scene as `base64url(deflate(JSON))`. Target: ≤ 1 KB for typical molecules. Loaded automatically on `/s/[hash]` route.

---

## 6. Three.js / R3F Scene Architecture

**Stack inside the canvas:**

- `@react-three/fiber` — declarative scene graph
- `@react-three/drei` — `OrbitControls`, `Stars`, `Billboard`, `Text`
- `@react-three/postprocessing` — bloom for the glow signature
- `@react-three/rapier` — physics for Lab mode (lazy-loaded only when entering Lab)

**Component tree:**

```
<Scene>
  <Canvas camera frameloop="demand" dpr={[1, 2]}>
    <Stars />
    <ambientLight />
    <directionalLight />
    <EffectComposer><Bloom /></EffectComposer>

    {scene.molecules.map(m => (
      <Molecule key={m.id} molecule={m}>
        {m.atomIds.map(id => <Atom key={id} atom={scene.atoms[id]} />)}
        {m.bondIds.map(id => <Bond key={id} bond={scene.bonds[id]} />)}
      </Molecule>
    ))}

    {dragInProgress && (
      <>
        <DragGhost element={held} cursorPos={…} />
        {scene.atoms.values().map(a =>
          <AttachPoints atom={a} held={held} />
        )}
      </>
    )}

    {labReactionInProgress && <ReactionAnimator … />}
  </Canvas>
</Scene>
```

**Performance levers:**

- **Instanced electron sprites** — one `InstancedMesh` per element; each electron is an instance whose transform we update per-frame from a small bookkeeping array.
- **LOD** — molecules > 30 units from the camera drop to nucleus + a single halo sprite per atom (electrons hidden).
- **`frameloop="demand"`** — render only when the store mutates or the camera moves, saving battery during idle inspection.
- **Bloom disabled** on mobile (detected via `matchMedia('(pointer: coarse)')` + `navigator.hardwareConcurrency < 4`).

---

## 7. UI & Palette

### Layout

- **Sidebar (left, ~240 px)** — Molecule Library in Explore mode; Periodic Table palette in Build/Lab modes. Collapsible to 56 px on narrow screens.
- **Viewport (center, flex)** — the 3D canvas. Bottom strip: validity bar + formula + Save / Share buttons.
- **Inspector (right, ~280 px, collapsible)** — selection metadata + AI tutor entry point.
- **Mobile (< 720 px)** — sidebar becomes a bottom drawer; inspector becomes a top sheet that slides over.

### Periodic Table palette

Two presentations of the same data:

1. **Default sidebar — category-grouped stacked view.** Collapsible sections by element category (Reactive Nonmetals, Halogens, Alkali Metals, Alkaline Earth, Noble Gases, Metalloids, Transition Metals, Other Metals). Each card has:
   - Atomic number (top-left, small)
   - Symbol (large, centered)
   - Full name (smallest, bottom)
   - Atomic mass (smallest, bottom)
   - Left-edge accent bar colored by category
   - Hover: lifts 2 px + shadow
   - Picked-up state: dashed outline, contents at 35 % opacity

2. **"View full table" overlay** — opens the canonical 18-column textbook layout in a centered modal. Same draggable cards. Starting a drag slides the overlay out of the way so the user can drop into the scene below in one motion. Closes on Esc or click-outside. On mobile, this opens fullscreen.

**Tier visibility:**

- Beginner: elements 1–20 active; 21–36 dimmed/disabled.
- Standard: elements 1–36 active; lanthanides/actinides hidden (off-table convention).
- Advanced: 1–36 active; full table reveal is a v2 expansion.

**Search:** a 🔍 icon opens an inline filter; in the overlay, search dims non-matches.

### Category accent colors

| Category | Accent | Examples |
|---|---|---|
| Alkali metals | `#FF7A8C` | Li, Na, K |
| Alkaline earth | `#FFB86B` | Be, Mg, Ca |
| Transition metals | `#FFD07A` | Sc–Zn |
| Other metals | `#B0B5CC` | Al, Ga |
| Metalloids | `#7AD9AA` | B, Si, Ge, As |
| Reactive nonmetals | `#5CC6FF` | H, C, N, O, P, S, Se |
| Halogens | `#C8FF7A` | F, Cl, Br |
| Noble gases | `#C89EFF` | He, Ne, Ar, Kr |

---

## 8. Build Mode — Drag & Snap Interaction

### Picking

Mouse-down on an element card in the sidebar (or in the full-table overlay). The card enters a "picked up" state (dashed outline, contents dimmed). A tile-shaped ghost attaches to the cursor.

### Tile → 3D atom morph

As the ghost crosses the viewport boundary, it morphs over ~200 ms:

1. Tile shrinks and rotates slightly (start of the transition)
2. Tile fades into a faint nucleus with a single faint orbital ring
3. Full 3D atom appears: nucleus + tilted orbital rings + swirling fuzzy-sprite electrons

This is the same `<Atom>` component used everywhere, rendered at 0.7 opacity with a scale-in tween.

### Positioning

The ghost atom rides on an invisible plane through the orbit center (perpendicular to the camera ray). Holding `Shift` raises/lowers the placement plane along the Y axis.

### Attach points

The moment a drag enters the scene, the chemistry engine evaluates every existing atom against the held element. Compatible atoms light up pulsing dots at their VSEPR-correct unfilled valence positions:

- **Bright green** (`#A4FF8C`) — common, stable bond (H–O, C–H)
- **Yellow** (`#FFD97A`) — possible but unusual (expanded octet, free-radical)
- **Faint red on hover** (`#FF7A7A`) — invalid for the held element; hover shows a "why not?" tooltip the tutor can expand
- **No dots** — when the held element can't bond with any atom in the scene (e.g., dragging Ne)

Dots use a gentle 1.2 s pulse loop on radius + opacity to read as alive but not seizure-y.

### Snap behavior

- Cursor far from any dot → all dots pulse at base level
- Cursor within ~1.5 bond-lengths of a dot → that dot becomes the **active target** (scales up, brightens). Other dots dim slightly. A dashed bond preview line appears between existing atom and held atom.
- Release on the active target → bond commits: dashed → solid, electron animation plays (covalent pair slides into the bond, or ionic transfer flashes from donor to acceptor)
- Release away from any dot → atom drops as free-floating, no bond formed
- `Shift` while snapping → higher bond order (single → double → triple) where valence allows

### Other affordances

- **Bond between two existing atoms** — click an atom, click a second atom; engine commits a bond if valid (same colored rules + dot logic).
- **Delete** — select atom, `Backspace`. Connected bonds break visually; orphaned atoms float free.
- **Undo / Redo** — `⌘Z` / `⇧⌘Z`.
- **Validity bar** — live verdict ("✓ Water", "⚠ Free radical — tutor can explain", "⚠ Hypervalent — not normally stable", "⚠ Broken octet on C — fix or accept").

### Touch / tablet / mobile

- Tap a card → element attaches to a small cursor chip
- Tap a valence dot → atom places there; tap empty space → free-floating
- Long-press an atom in the scene → context menu (bond, delete, replace, "explain this atom")
- Two-finger orbit, pinch zoom

---

## 9. Lab Mode — Physics & Reactions

`@react-three/rapier` provides physics. Each atom/molecule gets a rigid body; bonds are constraints between atom bodies. The toolbar adds:

- **Spawner** — drag from the Library or palette into the scene to introduce reactants
- **Fling tool** — click-drag from any atom/molecule to set a velocity vector (visible arrow shows direction + magnitude). Release to fire.
- **Reaction Log panel** — append-only feed of what happened, including the inferred equation and ΔH.

### Collision → reaction lookup

On every collision with `relativeVelocity² > threshold`:

1. Collect the formulas of both colliding molecules.
2. Look up against the reaction database.
3. If a match exists, run `<ReactionAnimator>`: tween reactant atoms into product positions over ~600 ms, crossfade old bonds out and new bonds in, animate electron transfer/sharing during the crossfade.
4. If no match, fall back to bonding rules: if valence allows + geometry permits, a bond forms; otherwise atoms bounce. Either way, the Reaction Log records what happened.

Reaction database covers ~30 reactions for v1 (see §4 Layer 2). Future expansion: tier-gated reaction unlocks, "you made something new!" badges.

---

## 10. AI Tutor

A single Next.js Server Action proxies to **Vercel AI Gateway**, which routes to Anthropic models.

### Request payload

```ts
{
  sceneSnapshot: { atoms, bonds, molecules },  // compact, ≤ 2KB
  mode: 'explore' | 'build' | 'lab',
  tier: 'beginner' | 'standard' | 'advanced',
  userQuestion?: string,                      // or suggested prompt
  recentReactionLog?: ReactionLogEntry[],     // last 3 entries
}
```

### Model selection by tier

- **Beginner** — `anthropic/claude-haiku-4-5` via the Gateway (`"anthropic/claude-haiku-4-5"` string). System prompt biases toward simple analogies ("oxygen is greedy for electrons — it really wants two").
- **Standard / Advanced** — `anthropic/claude-sonnet-4-6`. System prompt allows technical terminology (electronegativity, hybridization, formal charge).

### Streaming UI

Tutor responses stream via the AI SDK's `streamText`. Tokens render as they arrive. The tutor panel supports two output modes:

1. **Plain prose** for "explain why" questions.
2. **Highlight commands** — structured tool calls like `{ highlightAtom: 'a-7' }` or `{ highlightBond: 'b-3' }`. The tutor panel renders these as clickable spans; clicking pulses the corresponding atom/bond in the scene. Example: "the **carbon** has only three bonds, so it's missing one electron pair" with "carbon" linked to that atom.

### Suggested prompts (mode-dependent)

- **Explore:** "What is this molecule used for?" · "Why does this shape matter?" · "What is its melting point?"
- **Build:** "Why didn't this bond form?" · "What molecule am I making?" · "What atom should I add next for water?"
- **Lab:** "What just happened?" · "Why did this reaction release energy?" · "What else could I try?"

### Rate limiting (v1)

Anonymous users → 20 messages/hour by IP, enforced at the Gateway. No auth. If abuse becomes a problem, add a signed-cookie throttle.

---

## 11. Persistence & Sharing

- **Auto-save** — current scene serialized to `localStorage.molecular:current-scene` on every change, debounced 1 s.
- **My Creations** — user clicks Save → prompts for a name → stored in `localStorage.molecular:my-creations` as a list. Visible in a sidebar tab.
- **Share link** — click Share → scene serialized to compact JSON → deflate + base64url-encoded → appended to URL as `/s/[hash]`. Hash typically ≤ 1 KB. The `/s/[hash]/page.tsx` route decodes on load and hydrates the store.

No backend. No accounts. v2 adds: optional Supabase auth, server-side gallery, teacher dashboards.

---

## 12. Performance & Accessibility

### Performance targets

- 60 fps on a 2020 MacBook Air, full window, ~20 atoms in view
- 30 fps minimum on iPad mini and mid-range Android phones
- < 200 ms time-to-interactive after route load on a Fast 4G connection (app route)
- Homepage hero — TTI ≤ 1.5 s on Fast 4G; static starfield + foreground render first, canvas hydrates after, reel starts on the next frame

### Levers

- Instanced electron sprites (one InstancedMesh per element)
- Per-atom electron cap at 8 visible; additional electrons collapse to a single halo sprite
- LOD: molecules > 30 units drop to nucleus + halo
- `frameloop="demand"` so idle inspection doesn't burn battery
- Lazy-load `@react-three/rapier` only on entering Lab mode

### Accessibility

- `prefers-reduced-motion` — electron orbits freeze, pulses disabled, drag-morph instant
- Keyboard navigation: Tab cycles atoms, arrows nudge selection, Enter selects, Delete removes
- High-contrast toggle: solid CPK colors, thicker bond outlines, no bloom
- All interactive elements have ARIA labels; periodic table cards have descriptive `aria-label` ("Hydrogen, atomic number 1, reactive nonmetal")
- Tutor panel transcript is fully screen-readable; "highlight" tool calls fall back to text descriptions for SR users

---

## 13. File Structure (Next.js App Router)

```
molecular/
├─ app/
│  ├─ layout.tsx              # Root: Tailwind, theme, providers
│  ├─ page.tsx                # Landing page (hero + reel + feature cards + footer)
│  ├─ app/page.tsx            # Interactive app: <Scene/> + <Sidebar/> + <Inspector/>
│  ├─ api/tutor/route.ts      # AI tutor streaming endpoint
│  ├─ s/[hash]/page.tsx       # Shared scene loader (URL hash route)
│  └─ globals.css
├─ src/
│  ├─ scene/                  # R3F components
│  │  ├─ Scene.tsx
│  │  ├─ Atom.tsx
│  │  ├─ Bond.tsx
│  │  ├─ AttachPoints.tsx
│  │  ├─ DragGhost.tsx
│  │  ├─ ReactionAnimator.tsx
│  │  ├─ ElectronSprite.tsx
│  │  └─ utils/vsper.ts       # geometry computations
│  ├─ chem/                   # Chemistry engine (pure TS, unit-tested)
│  │  ├─ rules.ts             # canBond, octet/duet, electronegativity
│  │  ├─ vsper.ts             # geometry + bonding-site positions
│  │  ├─ reactions.ts         # collision → reaction lookup
│  │  ├─ validate.ts          # scene validity
│  │  └─ formula.ts           # atom set → Hill formula
│  ├─ data/                   # Static data
│  │  ├─ elements.ts          # periodic table 1–36
│  │  ├─ molecules.ts         # curated library (30–50 entries)
│  │  └─ reactions.ts         # curated reaction database (~30)
│  ├─ store/                  # Zustand slices
│  │  ├─ index.ts
│  │  ├─ sceneSlice.ts
│  │  ├─ uiSlice.ts
│  │  ├─ tutorSlice.ts
│  │  └─ historySlice.ts
│  ├─ ui/                     # 2D UI (shadcn-based)
│  │  ├─ Sidebar.tsx
│  │  ├─ PeriodicSidebar.tsx
│  │  ├─ PeriodicOverlay.tsx
│  │  ├─ LibraryBrowser.tsx
│  │  ├─ Inspector.tsx
│  │  ├─ ModeSwitcher.tsx
│  │  ├─ ValidityBar.tsx
│  │  └─ TutorPanel.tsx
│  ├─ landing/                # Homepage-only components
│  │  ├─ HomepageReel.tsx     # Orchestrates the autonomous reaction cycle
│  │  ├─ ReelMolecule.tsx     # Wraps <Molecule> with tween-in/tween-out behavior
│  │  ├─ HeroCopy.tsx         # Title, tagline, CTAs
│  │  ├─ FeatureCards.tsx     # Explore / Build / Lab with mini live previews
│  │  ├─ HowItWorks.tsx       # 3-step strip
│  │  └─ Footer.tsx
│  ├─ hooks/                  # useDrag, useScene, useTutorStream, useShareUrl
│  └─ lib/
│     ├─ shareUrl.ts          # encode / decode scene → URL hash
│     ├─ persistence.ts       # localStorage helpers
│     └─ cpk.ts               # CPK color lookup
├─ public/                    # Static assets (electron sprite texture, favicon)
├─ tests/
│  ├─ chem/                   # rules.spec, reactions.spec, validate.spec, vsper.spec
│  ├─ store/                  # store mutation tests
│  └─ e2e/                    # Playwright: landing-page, build water, react H2+O2, share-link roundtrip
├─ vercel.ts                  # framework: nextjs, AI Gateway env binding
├─ next.config.ts
├─ tailwind.config.ts
├─ vitest.config.ts
├─ playwright.config.ts
├─ biome.json
├─ tsconfig.json
├─ package.json
└─ README.md
```

---

## 14. Tech Stack

- **Framework:** Next.js 16 (App Router) on Node 24 LTS
- **3D:** Three.js + `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing` + `@react-three/rapier` (lazy)
- **UI:** Tailwind CSS + shadcn/ui (Sidebar, Dialog, Popover, Button, Input, Slider, Tooltip)
- **State:** Zustand + immer
- **Validation:** Zod (share-link payloads, tutor responses)
- **AI:** Vercel AI SDK v6 + Vercel AI Gateway; models referenced via plain `"anthropic/claude-haiku-4-5"` and `"anthropic/claude-sonnet-4-6"` strings
- **Testing:** Vitest (unit) + Playwright (e2e)
- **Lint/format:** Biome
- **Deploy:** Vercel (Fluid Compute for the tutor route)
- **Telemetry (optional v1):** Vercel Analytics + Speed Insights

---

## 15. Testing

### Unit (Vitest)

The chemistry engine is pure TypeScript and gets the bulk of the unit coverage:

- `chem/rules.spec.ts` — `canBond(H, H) === { allowed: true, order: 1, type: 'covalent' }`; `canBond(He, H).allowed === false`; ionic bond between Na and Cl; electronegativity-difference cutoff at 1.7
- `chem/vsper.spec.ts` — methane → 4 sites at 109.5°; water → 2 sites at 104.5°; CO₂ → 2 sites at 180°
- `chem/reactions.spec.ts` — collision of {2 H₂} + {O₂} → matches water-synthesis reaction; collision of {CH₄} + {O₂} below threshold → no reaction; combustion balances
- `chem/validate.spec.ts` — H₂O recognized as "Water"; CH₃ flagged as free radical; SF₆ flagged as hypervalent (Standard tier+); broken octet rejected
- `chem/formula.spec.ts` — atom multisets produce correct Hill-system formulas (C₂H₆O for ethanol)

### Store

- Patch generation on every mutation; undo/redo round-trips
- Persistence: serialize → hydrate → identical scene
- Share-link encode/decode round-trips for representative molecules

### End-to-end (Playwright)

1. **Landing page** — `/` renders hero copy + canvas; reel starts within 2 s; clicking "Open the Lab" navigates to `/app` and lands in Build mode; clicking the central reel molecule navigates to `/app?mode=explore` with that molecule loaded
2. **Build water** — drag O onto scene, drag H, snap to first valence site, drag second H, snap to second site → validity bar reads "✓ Water"
3. **Library spawn** — search "glucose" → click → scene contains 24 atoms (C₆H₁₂O₆), inspector shows formula and uses
4. **Lab reaction** — switch to Lab mode, spawn 2 H₂ and 1 O₂, fling H₂ at O₂ → after collision, scene contains 2 H₂O, reaction log shows the equation
5. **Share roundtrip** — build methane, click Share, open returned URL in a fresh context → scene loads with identical atoms/bonds
6. **AI tutor** — in Explore mode with water spawned, click "Tell me about this molecule" → streaming response references "two hydrogen atoms bonded to oxygen"

### CI

- GitHub Actions on every PR: lint → typecheck → unit → e2e
- Vercel Preview URL linked from each PR
- Production deploy on merge to `main`

---

## 16. Out of Scope for v1

- User accounts, gallery of community creations, teacher/student grouping
- Lessons / guided tutorials (deferred to v2 once we know what students get stuck on)
- Saved creations beyond localStorage + URL hash (no backend)
- Elements beyond Z=36 (covers Beginner, Standard, and most Advanced needs)
- Reaction kinetics beyond the activation-energy threshold gate (no rate equations, no equilibrium)
- VR / AR mode
- Export to PDF / image / `.mol` files
- Quantum-orbital probability-cloud rendering (Bohr-style suffices for v1)

---

## 17. Open Questions for Future Iterations

These don't block v1 but are worth noting:

- **Sub-shell visualization (s, p, d):** currently using Bohr shell rings; an Advanced-tier toggle to show s/p/d sub-shells with their characteristic geometries could deepen the model.
- **Lone-pair indication:** valence lone pairs are implicit in our VSEPR computation but not visualized. Worth showing as faint paired electron sprites near the nucleus for Standard/Advanced.
- **Aromaticity:** benzene's delocalized π system is rendered as alternating double bonds today; a "ring with circle" notation (textbook style) might be more accurate at higher tiers.
- **Beyond Z=36:** transition metals are dimmed in Standard. Real student demand for heavier elements (Fe, Cu, Au) will be hard to ignore in v2.

---

**End of design document.**
