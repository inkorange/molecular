/**
 * Curated step-by-step chemistry demonstrations. Each entry pairs a
 * reaction from `src/chem/reactions.ts` with display metadata, an
 * ingredient layout, and per-audience step text. The /demo player drives
 * the three-step flow (ingredients → combine → results) and the
 * reaction-type effect vocabulary is keyed off `effectKind` below.
 */

import type { ReactionType } from '@/src/chem/reactions'

/**
 * One thing in the Ingredients step. Two flavours:
 *   - `library`: spawn an existing library molecule (e.g. 'hydrogen-gas')
 *   - `atom`: spawn a single bare atom by atomic number (for monoatomic
 *     elements like Na, Cl, Zn that don't have a library entry)
 */
export type DemoIngredient =
  | { kind: 'library'; libraryId: string; count: number }
  | { kind: 'atom'; Z: number; count: number }

/**
 * Subatomic / massless particles released by the reaction that aren't
 * full atoms but still belong in the Results scene — neutrons from
 * nuclear events, gamma photons / heat photons from anything exothermic.
 *
 * Rendered as labeled glowing sprites alongside the product atoms so the
 * conservation story stays visible: the user can SEE what came out of
 * the reaction beyond the headline products.
 */
export type FreeParticleKind = 'neutron' | 'photon'
export interface FreeParticle {
  kind: FreeParticleKind
  count: number
}

/**
 * Relative magnitude of the energy released. 0 means the reaction is
 * endothermic or near-thermoneutral and no glow is rendered; 1–5 ramp
 * the brightness + quanta count of the energy halo. The numeric scale is
 * deliberately log-ish (level 5 is nuclear, level 1 is mild heat) so the
 * visualization can span chemistry and nuclear regimes without flattening.
 */
export type EnergyScale = 0 | 1 | 2 | 3 | 4 | 5

export interface DemoStepText {
  elementary: string
  advanced: string
}

export interface Demonstration {
  /** URL slug — used in /demo/[id]. */
  id: string
  /** Display title in the picker dialog. */
  title: string
  /** One-line summary in the picker card. Audience-neutral. */
  summary: string
  /** Reaction id from REACTIONS — used to look up reactants, products, enthalpy. */
  reactionId: string
  /** Engine reaction type. Drives the effect vocabulary in the player. */
  reactionType: ReactionType
  /** Difficulty band — sorts cards in the picker (1 easy → 5 advanced). */
  difficulty: 1 | 2 | 3 | 4 | 5
  /**
   * Effect signature for the combine animation. Maps to a specific visual
   * treatment in `<ReactionEffect>`: synthesis flashes bond formations,
   * combustion adds fire particles, electrolysis arcs and splits, etc.
   */
  effectKind:
    | 'synthesis'
    | 'combustion'
    | 'decomposition'
    | 'neutralization'
    | 'displacement'
    // Nuclear effect kinds. Drive a distinct VFX path in DemoPlayer
    // (NuclearEffect) instead of the chemistry-style ReactionEffect —
    // fusion converges + flashes inward, fission shatters outward with
    // ejected neutrons, decay spontaneously emits a single alpha
    // particle. Visually dramatic to match the energy scale.
    | 'fusion'
    | 'fission'
    | 'decay'
  /**
   * Optional environmental trigger overlay. When present, the player
   * layers an additional visual on top of the reaction-type effect:
   *   - 'electricity' → animated lightning bolts striking inward
   *   - 'heat'        → (future) heat-shimmer / waving glow
   *   - 'spark'       → (future) brief ignition flash
   * Omit for spontaneous reactions that need no external driver.
   */
  energySource?: 'electricity' | 'heat' | 'spark'
  /** Ingredient layout shown in the Ingredients step. */
  ingredients: DemoIngredient[]
  /**
   * Optional override for what to spawn as products. When omitted, the
   * /demo player derives products from the engine reaction's stoichiometry.
   * Useful for the "atoms" demos where products visually differ.
   */
  products?: DemoIngredient[]
  /**
   * Subatomic particles released alongside the products. Drawn as
   * floating labeled sprites around the product cluster in the Results
   * step so the user can SEE neutrons / photons that the reaction emitted.
   */
  freeParticles?: FreeParticle[]
  /**
   * Magnitude of energy released, on a relative 0–5 scale. Drives the
   * brightness + quanta count of the energy halo in the Results step.
   * Omit (or set to 0) for endothermic / near-thermoneutral reactions.
   */
  energyScale?: EnergyScale
  /**
   * Optional human-readable energy magnitude shown as floating 3D text
   * in the Results step (e.g. "17.6 MeV", "−572 kJ/mol", "+57 kJ/mol").
   * Pair with `energyScale` to drive both the label and the visual.
   */
  energyLabel?: string
  /** Step text, per audience level. */
  steps: {
    ingredients: DemoStepText
    combine: DemoStepText
    results: DemoStepText
  }
}

export const DEMOS: Demonstration[] = [
  {
    id: 'water-synthesis',
    title: 'Making water',
    summary: 'Two hydrogen gases meet one oxygen gas and form water.',
    reactionId: 'water-synthesis',
    reactionType: 'synthesis',
    difficulty: 1,
    effectKind: 'synthesis',
    ingredients: [
      { kind: 'library', libraryId: 'hydrogen-gas', count: 2 },
      { kind: 'library', libraryId: 'oxygen-gas', count: 1 },
    ],
    energyScale: 4,
    energyLabel: '−572 kJ/mol',
    steps: {
      ingredients: {
        elementary:
          "We have two hydrogens (the small white pairs) and one oxygen (the big red pair). They're going to come together to make water!",
        advanced:
          'Reactants: 2 H₂ (g) and 1 O₂ (g). The hydrogen and oxygen molecules each carry a covalent bond that will break and reform as polar O–H bonds.',
      },
      combine: {
        elementary:
          'The atoms snap together! Each oxygen grabs two hydrogens — and now we have two water molecules (H₂O).',
        advanced:
          'The H–H and O=O bonds break; the freed atoms form new polar O–H bonds. The reaction is highly exothermic — energy is released as heat and light.',
      },
      results: {
        elementary:
          "We made 2 water molecules! Water is what fish swim in, what we drink, and what clouds are made of. This reaction also gives off heat — it's like a tiny explosion.",
        advanced:
          '2 H₂ + O₂ → 2 H₂O. ΔH ≈ −572 kJ/mol — strongly exothermic. The same reaction powers hydrogen fuel cells and was used by the Space Shuttle main engines.',
      },
    },
  },
  {
    id: 'ammonia-synthesis',
    title: 'Building ammonia',
    summary: 'Three hydrogens grab one nitrogen to make ammonia, NH₃.',
    reactionId: 'ammonia-synthesis',
    reactionType: 'synthesis',
    difficulty: 2,
    effectKind: 'synthesis',
    ingredients: [
      { kind: 'library', libraryId: 'hydrogen-gas', count: 3 },
      { kind: 'library', libraryId: 'nitrogen-gas', count: 1 },
    ],
    energyScale: 2,
    energyLabel: '−92 kJ/mol',
    steps: {
      ingredients: {
        elementary:
          'Three hydrogen pairs and one nitrogen pair. Nitrogen really wants to share electrons with hydrogen.',
        advanced:
          'Reactants: 3 H₂ (g) and 1 N₂ (g). N₂ has a stable triple bond — breaking it is the energy barrier this reaction must clear.',
      },
      combine: {
        elementary:
          "The nitrogen atoms split apart and each one grabs three hydrogens. We've made two ammonia molecules!",
        advanced:
          'The N≡N triple bond breaks; each N forms three N–H bonds. The Haber–Bosch process runs this industrially at high temperature and pressure with an iron catalyst.',
      },
      results: {
        elementary:
          'Ammonia (NH₃) is the main ingredient in farm fertilizer. Without this reaction, we could not grow enough food for the planet.',
        advanced:
          'N₂ + 3 H₂ → 2 NH₃. ΔH ≈ −92 kJ/mol — exothermic but slow without a catalyst. The Haber–Bosch process produces ~150 million tons of ammonia annually for fertilizer.',
      },
    },
  },
  {
    id: 'nacl-synthesis',
    title: 'Forming table salt',
    summary: 'Sodium gives up an electron to chlorine — and you get salt.',
    reactionId: 'nacl-synthesis',
    reactionType: 'synthesis',
    difficulty: 2,
    effectKind: 'synthesis',
    // Sodium has no library entry — render as a bare atom. Chlorine is
    // similarly monoatomic for the demo since the library only ships
    // chlorine inside compounds.
    ingredients: [
      { kind: 'atom', Z: 11, count: 2 },
      { kind: 'atom', Z: 17, count: 2 },
    ],
    products: [{ kind: 'library', libraryId: 'sodium-chloride', count: 2 }],
    energyScale: 4,
    energyLabel: '−411 kJ/mol per NaCl',
    steps: {
      ingredients: {
        elementary:
          'A sodium atom (the purple one) and a chlorine atom (green). Sodium is really eager to give away an electron, and chlorine is really eager to grab one.',
        advanced:
          "Reactants: 2 Na (s) and Cl₂ (g) shown here as 2 Cl atoms. Sodium's 3s¹ electron is loosely held; chlorine has 7 valence electrons and needs one more for an octet.",
      },
      combine: {
        elementary:
          'Sodium hands its electron to chlorine. Now sodium has a positive charge and chlorine has a negative charge — and they stick together like magnets!',
        advanced:
          'Each Na donates its 3s¹ electron to a Cl 3p hole. The resulting Na⁺ and Cl⁻ ions are bound by an electrostatic ionic bond — no shared electrons, just opposite charges.',
      },
      results: {
        elementary:
          'Salt! The same stuff on your dinner table. Notice how this reaction is different from making water — no electron sharing, just a swap.',
        advanced:
          '2 Na + Cl₂ → 2 NaCl. ΔH ≈ −411 kJ/mol per NaCl — highly exothermic. The classic example of an ionic bond: electron transfer rather than covalent sharing.',
      },
    },
  },
  {
    id: 'methane-combustion',
    title: 'Burning natural gas',
    summary: 'Methane plus oxygen makes fire — and carbon dioxide and water.',
    reactionId: 'methane-combustion',
    reactionType: 'combustion',
    difficulty: 3,
    effectKind: 'combustion',
    ingredients: [
      { kind: 'library', libraryId: 'methane', count: 1 },
      { kind: 'library', libraryId: 'oxygen-gas', count: 2 },
    ],
    energyScale: 4,
    energyLabel: '−891 kJ/mol',
    steps: {
      ingredients: {
        elementary:
          'One methane molecule (CH₄, the stuff in your stove) and two oxygens. We just need a tiny spark to start the reaction.',
        advanced:
          'Reactants: CH₄ (g) and 2 O₂ (g). Methane is the simplest hydrocarbon; complete combustion requires 2 mol O₂ per mol CH₄.',
      },
      combine: {
        elementary:
          'Boom! The methane bursts apart. Carbon grabs two oxygens to make CO₂, and the hydrogens grab oxygens to make water.',
        advanced:
          'The C–H bonds and O=O bonds break; new C=O and O–H bonds form. The reaction is strongly exothermic; the visible flame is hot CO₂ and H₂O incandescing.',
      },
      results: {
        elementary:
          'We made carbon dioxide (CO₂, the bubbles in soda) and water. Burning natural gas is how many homes heat themselves — but the CO₂ also makes the planet warmer.',
        advanced:
          'CH₄ + 2 O₂ → CO₂ + 2 H₂O. ΔH ≈ −891 kJ/mol — the basis of natural-gas energy. CO₂ is a greenhouse gas; this reaction is a major contributor to anthropogenic climate change.',
      },
    },
  },
  {
    id: 'water-electrolysis',
    title: 'Splitting water',
    summary: 'Run electricity through water and it comes apart.',
    reactionId: 'water-electrolysis',
    reactionType: 'decomposition',
    difficulty: 3,
    effectKind: 'decomposition',
    energySource: 'electricity',
    ingredients: [{ kind: 'library', libraryId: 'water', count: 2 }],
    steps: {
      ingredients: {
        elementary:
          'Two water molecules. Water looks simple, but it stores a LOT of energy in its bonds — and we can pull it apart with electricity.',
        advanced:
          'Reactants: 2 H₂O (l). The reverse of water synthesis. Endothermic — requires an external energy input (electrical) to break the polar O–H bonds.',
      },
      combine: {
        elementary:
          'Zap! Electricity pulls the molecules apart. The hydrogens pair up and the oxygens pair up.',
        advanced:
          'At the cathode: 4 H⁺ + 4 e⁻ → 2 H₂. At the anode: 2 H₂O → O₂ + 4 H⁺ + 4 e⁻. Net: 2 H₂O → 2 H₂ + O₂. ΔH > 0 (endothermic) — input energy stored as chemical bonds.',
      },
      results: {
        elementary:
          'Hydrogen gas and oxygen gas! Hydrogen is what hopes to fuel future cars — clean burning, just makes water back when it does.',
        advanced:
          '2 H₂O → 2 H₂ + O₂. ΔH ≈ +572 kJ/mol — the exact reverse of water synthesis. Electrolysis is the basis of green hydrogen production for fuel cells and industrial chemistry.',
      },
    },
  },
  {
    id: 'hcl-naoh',
    title: 'Neutralizing an acid',
    summary: 'Strong acid meets strong base. They cancel each other out.',
    reactionId: 'hcl-naoh',
    reactionType: 'neutralization',
    difficulty: 2,
    effectKind: 'neutralization',
    ingredients: [
      { kind: 'library', libraryId: 'hydrochloric-acid', count: 1 },
      { kind: 'library', libraryId: 'sodium-hydroxide', count: 1 },
    ],
    energyScale: 1,
    energyLabel: '−57 kJ/mol',
    steps: {
      ingredients: {
        elementary:
          'On the left: hydrochloric acid, a strong acid. On the right: sodium hydroxide (lye), a strong base. Both can burn skin on their own.',
        advanced:
          'Reactants: HCl (aq) and NaOH (aq). HCl fully dissociates into H⁺ + Cl⁻; NaOH fully dissociates into Na⁺ + OH⁻ in water.',
      },
      combine: {
        elementary:
          'The hydrogen from the acid jumps to the OH from the base — and they make water. The leftover sodium and chlorine pair up as salt.',
        advanced:
          "Net ionic equation: H⁺ + OH⁻ → H₂O. The acid's H and the base's OH combine to form water; Na⁺ and Cl⁻ remain as spectator ions, crystallising into NaCl.",
      },
      results: {
        elementary:
          'Just salt water! Two dangerous chemicals mixed to make something you could safely drink (in small amounts). That\'s what "neutralize" means.',
        advanced:
          'HCl + NaOH → NaCl + H₂O. ΔH ≈ −57 kJ/mol — the heat of neutralisation. The basis of acid-base titration and many industrial pH-control processes.',
      },
    },
  },
  {
    id: 'zn-hcl',
    title: 'Zinc displaces hydrogen',
    summary: 'A more reactive metal kicks hydrogen out of an acid.',
    reactionId: 'zn-hcl',
    reactionType: 'displacement',
    difficulty: 4,
    effectKind: 'displacement',
    // Zinc isn't in the library either — render as atom.
    ingredients: [
      { kind: 'atom', Z: 30, count: 1 },
      { kind: 'library', libraryId: 'hydrochloric-acid', count: 2 },
    ],
    // Engine reaction is Zn + 2 HCl → ZnCl₂ + H₂. ZnCl₂ isn't in the
    // library, so the auto-derived products would only show H₂ — making
    // it look like the Zn and Cl vanished into thin air. Explicitly
    // render the displaced atoms as standalone Zn + 2 Cl alongside the
    // H₂ gas so conservation of mass is visible (every atom in is an
    // atom out, just rearranged).
    products: [
      { kind: 'library', libraryId: 'hydrogen-gas', count: 1 },
      { kind: 'atom', Z: 30, count: 1 },
      { kind: 'atom', Z: 17, count: 2 },
    ],
    energyScale: 2,
    energyLabel: '−154 kJ/mol',
    steps: {
      ingredients: {
        elementary:
          'A zinc atom (a metal) and two hydrochloric acid molecules. Zinc is more "reactive" than hydrogen — it wants to bond more.',
        advanced:
          'Reactants: Zn (s) and 2 HCl (aq). Zinc sits above hydrogen on the activity series, so Zn can reduce H⁺ to H₂.',
      },
      combine: {
        elementary:
          "Zinc shoves hydrogen out of the way! Zinc takes hydrogen's place with the chlorine, and the freed hydrogens bubble up as hydrogen gas.",
        advanced:
          'Zn(s) → Zn²⁺(aq) + 2 e⁻ (oxidation); 2 H⁺(aq) + 2 e⁻ → H₂(g) (reduction). Net redox: Zn + 2 HCl → ZnCl₂ + H₂.',
      },
      results: {
        elementary:
          'Zinc chloride and hydrogen gas bubbles. This is how a chemistry class often makes hydrogen — the bubbles you see rising in beakers.',
        advanced:
          'Zn + 2 HCl → ZnCl₂ + H₂. A classic single-displacement redox reaction. Used industrially to galvanise iron and as a lab-bench hydrogen source.',
      },
    },
  },
  {
    id: 'h2-from-h-atoms',
    title: 'Atoms pair up',
    summary: 'Two lonely hydrogen atoms find each other and form a bond.',
    reactionId: 'h2-synthesis-from-h',
    reactionType: 'synthesis',
    difficulty: 1,
    effectKind: 'synthesis',
    ingredients: [{ kind: 'atom', Z: 1, count: 2 }],
    energyScale: 3,
    energyLabel: '−436 kJ/mol',
    steps: {
      ingredients: {
        elementary:
          'Two single hydrogen atoms, floating apart. Hydrogen really does not like being alone — it wants a buddy.',
        advanced:
          'Reactants: 2 H atoms (radicals). Each has one unpaired electron, so they pair up almost instantly when they meet.',
      },
      combine: {
        elementary:
          'Snap! The two atoms grab each other and share electrons — that is what a chemical bond is.',
        advanced:
          'The two H· radicals overlap 1s orbitals and form a sigma (σ) covalent bond. The shared electron pair stabilises both atoms.',
      },
      results: {
        elementary:
          'We made an H₂ molecule — hydrogen gas. This is the simplest possible chemical bond, and it is how almost every other reaction starts: atoms looking for partners.',
        advanced:
          '2 H → H₂. ΔH ≈ −436 kJ/mol — extremely exothermic. The H–H bond energy sets the baseline against which most bond-strength tables are measured.',
      },
    },
  },
  {
    id: 'co2-from-c',
    title: 'Burning carbon',
    summary: 'A piece of carbon catches fire and becomes the gas you exhale.',
    reactionId: 'co2-from-c',
    reactionType: 'combustion',
    difficulty: 2,
    effectKind: 'combustion',
    ingredients: [
      { kind: 'atom', Z: 6, count: 1 },
      { kind: 'library', libraryId: 'oxygen-gas', count: 1 },
    ],
    energyScale: 3,
    energyLabel: '−394 kJ/mol',
    steps: {
      ingredients: {
        elementary:
          'One carbon atom (think charcoal) and one oxygen molecule. The carbon is about to catch fire.',
        advanced:
          'Reactants: C (s) and O₂ (g). Solid carbon is the simplest fuel — pure element, no other atoms to manage.',
      },
      combine: {
        elementary:
          "Flames! The carbon snaps to both oxygens. We've made carbon dioxide — the same gas you breathe out.",
        advanced:
          'C + O₂ → CO₂. Two new C=O double bonds form, releasing the lattice energy of solid carbon. The reaction is the basis of every charcoal grill and every breath you take.',
      },
      results: {
        elementary:
          'Carbon dioxide (CO₂). Plants drink it in, we breathe it out. Too much of it in the air is what is making the planet warmer.',
        advanced:
          'C + O₂ → CO₂. ΔH ≈ −394 kJ/mol — strongly exothermic. The principal product of complete combustion of any carbon-containing fuel.',
      },
    },
  },
  {
    id: 'mgo-synthesis',
    title: 'Burning magnesium',
    summary: 'Magnesium ribbon ignites with a brilliant white flash.',
    reactionId: 'mgo-synthesis',
    reactionType: 'synthesis',
    difficulty: 2,
    effectKind: 'combustion',
    ingredients: [
      { kind: 'atom', Z: 12, count: 2 },
      { kind: 'library', libraryId: 'oxygen-gas', count: 1 },
    ],
    // MgO isn't in the library — render product as separate Mg + O atoms,
    // ionically associated but visually independent (same approach as
    // nacl-synthesis).
    products: [
      { kind: 'atom', Z: 12, count: 2 },
      { kind: 'atom', Z: 8, count: 2 },
    ],
    energyScale: 4,
    energyLabel: '−602 kJ/mol per MgO',
    steps: {
      ingredients: {
        elementary:
          'Two magnesium atoms (a metal that loves to burn) and one oxygen molecule. Watch out — this gets bright!',
        advanced:
          'Reactants: 2 Mg (s) and O₂ (g). Magnesium has two valence electrons it readily donates; oxygen needs two more to complete its octet.',
      },
      combine: {
        elementary:
          'FLASH! Each magnesium gives both of its electrons to an oxygen. The bright white light is how we know this is happening.',
        advanced:
          'Each Mg → Mg²⁺ + 2 e⁻ (oxidation); each O + 2 e⁻ → O²⁻ (reduction). The intense incandescent light is the high-temperature emission spectrum of the Mg²⁺ ions and hot MgO solid.',
      },
      results: {
        elementary:
          'Magnesium oxide — a white powder. The flash from this reaction was once used in old camera flashbulbs, and it is still used in fireworks.',
        advanced:
          '2 Mg + O₂ → 2 MgO. ΔH ≈ −602 kJ/mol per MgO — strongly exothermic, with an extreme adiabatic flame temperature (~3000 K). The bond is fully ionic between Mg²⁺ and O²⁻.',
      },
    },
  },
  {
    id: 'ethanol-combustion',
    title: 'Burning alcohol',
    summary: 'Ethanol (drinking alcohol) burns cleanly into water and CO₂.',
    reactionId: 'ethanol-combustion',
    reactionType: 'combustion',
    difficulty: 4,
    effectKind: 'combustion',
    ingredients: [
      { kind: 'library', libraryId: 'ethanol', count: 1 },
      { kind: 'library', libraryId: 'oxygen-gas', count: 3 },
    ],
    energyScale: 5,
    energyLabel: '−1367 kJ/mol',
    steps: {
      ingredients: {
        elementary:
          'One ethanol molecule (the alcohol in hand sanitizer) and three oxygens. Ethanol is bigger than methane, so it needs more oxygen to burn.',
        advanced:
          'Reactants: C₂H₆O (l) and 3 O₂ (g). Ethanol has 2 carbons and an –OH group; complete combustion requires 3 mol O₂ per mol ethanol.',
      },
      combine: {
        elementary:
          'The ethanol breaks apart. Each carbon grabs two oxygens, the hydrogens grab the rest, and a quiet blue flame burns the whole thing up.',
        advanced:
          'All C–C, C–H, and C–O bonds break; new C=O and O–H bonds form. The blue flame indicates complete combustion at higher temperatures than yellow sooty flames.',
      },
      results: {
        elementary:
          'Two carbon dioxides and three waters. This is how cars that run on E85 fuel and old-fashioned alcohol lamps work — burn ethanol, get heat.',
        advanced:
          'C₂H₆O + 3 O₂ → 2 CO₂ + 3 H₂O. ΔH ≈ −1367 kJ/mol — strongly exothermic. The basis of ethanol fuel and the spirit lamps used in chemistry labs.',
      },
    },
  },
  {
    id: 'mg-hcl',
    title: 'Magnesium fizzes in acid',
    summary: 'A magnesium ribbon dropped into HCl bubbles vigorously.',
    reactionId: 'mg-hcl',
    reactionType: 'displacement',
    difficulty: 3,
    effectKind: 'displacement',
    ingredients: [
      { kind: 'atom', Z: 12, count: 1 },
      { kind: 'library', libraryId: 'hydrochloric-acid', count: 2 },
    ],
    // MgCl₂ isn't in the library — same trick as zn-hcl, render the
    // displaced atoms as standalone Mg + 2 Cl alongside the H₂ gas so
    // mass-conservation reads correctly.
    products: [
      { kind: 'library', libraryId: 'hydrogen-gas', count: 1 },
      { kind: 'atom', Z: 12, count: 1 },
      { kind: 'atom', Z: 17, count: 2 },
    ],
    energyScale: 3,
    energyLabel: '−466 kJ/mol',
    steps: {
      ingredients: {
        elementary:
          'A magnesium atom and two hydrochloric acid molecules. Magnesium is even more reactive than zinc — this will fizz hard.',
        advanced:
          'Reactants: Mg (s) and 2 HCl (aq). Magnesium sits well above hydrogen on the activity series; this is a textbook single-displacement redox.',
      },
      combine: {
        elementary:
          'Mg pushes hydrogen out of the way and takes its place. Hydrogen gas comes bubbling out fast.',
        advanced:
          'Mg(s) → Mg²⁺(aq) + 2 e⁻; 2 H⁺(aq) + 2 e⁻ → H₂(g). The Mg²⁺ pairs ionically with two Cl⁻ to form aqueous MgCl₂.',
      },
      results: {
        elementary:
          'Magnesium chloride dissolved in water plus hydrogen gas. The reaction is so fast you can light the hydrogen bubbles on fire as they leave the test tube.',
        advanced:
          'Mg + 2 HCl → MgCl₂ + H₂. Faster than the Zn + HCl analogue because Mg has lower ionisation energy. Used in undergraduate labs to demonstrate the activity series.',
      },
    },
  },
  {
    id: 'nh3-decomp',
    title: 'Unmaking ammonia',
    summary: 'High heat splits ammonia back into nitrogen and hydrogen.',
    reactionId: 'nh3-decomp',
    reactionType: 'decomposition',
    difficulty: 3,
    effectKind: 'decomposition',
    ingredients: [{ kind: 'library', libraryId: 'ammonia', count: 2 }],
    steps: {
      ingredients: {
        elementary:
          'Two ammonia molecules (NH₃). With enough heat, we can rip them apart — the exact reverse of how we made them.',
        advanced:
          'Reactants: 2 NH₃ (g). The exact reverse of the Haber process. Endothermic — requires external heat to break the N–H bonds.',
      },
      combine: {
        elementary:
          'The nitrogens find each other and pair up. The hydrogens pair up in groups of two.',
        advanced:
          'All N–H bonds break; new N≡N triple bond forms (very stable, releasing some of the energy back) and 3 new H–H bonds form. Net energy in.',
      },
      results: {
        elementary:
          'One nitrogen molecule (N₂) and three hydrogen molecules (H₂). All the atoms are still here — they just rearranged.',
        advanced:
          '2 NH₃ → N₂ + 3 H₂. ΔH ≈ +92 kJ/mol — endothermic. Occurs naturally at high temperatures (e.g. inside burning rockets) and industrially when cracking ammonia for hydrogen-fuel applications.',
      },
    },
  },
  {
    id: 'propane-combustion',
    title: 'Burning BBQ propane',
    summary: 'The fuel in propane tanks burns explosively in oxygen.',
    reactionId: 'propane-combustion',
    reactionType: 'combustion',
    difficulty: 4,
    effectKind: 'combustion',
    ingredients: [
      { kind: 'library', libraryId: 'propane', count: 1 },
      { kind: 'library', libraryId: 'oxygen-gas', count: 5 },
    ],
    energyScale: 5,
    energyLabel: '−2220 kJ/mol',
    steps: {
      ingredients: {
        elementary:
          'One propane molecule (C₃H₈, the gas in BBQ tanks) and FIVE oxygens. It takes a lot of oxygen to burn this much fuel.',
        advanced:
          'Reactants: C₃H₈ (g) and 5 O₂ (g). The 1:5 fuel-to-air ratio is why propane combustion requires good ventilation; running it lean produces soot and CO.',
      },
      combine: {
        elementary:
          'BOOM! All eight C–H bonds break, the carbons grab oxygens, the hydrogens grab oxygens. The propane is gone — only CO₂ and water are left.',
        advanced:
          'The C–H and C–C bonds break; the C–O and O–H bonds reform. Per molecule of propane: 3 CO₂ and 4 H₂O. Burns hotter than methane per mole.',
      },
      results: {
        elementary:
          'Three carbon dioxides and four waters. Same as natural gas — just bigger. Propane is what people use for off-grid heating, BBQs, and outdoor torches.',
        advanced:
          'C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O. ΔH ≈ −2220 kJ/mol — more energy per mole than methane combustion. Standard fuel for portable heating and forklift engines.',
      },
    },
  },
  // ===== Nuclear demos =====
  // The chemistry engine doesn't simulate nuclear reactions, so these
  // demos use placeholder reactionIds (no matching entry in REACTIONS)
  // and provide explicit `products` overrides. The Demo player handles
  // the missing reaction metadata gracefully — the enthalpy badge just
  // doesn't render.
  //
  // Atoms are rendered by their atomic number; isotope mass differences
  // (deuterium vs protium, U-235 vs U-238) are explained in the step
  // text rather than rendered, since the periodic-table data only
  // knows the standard atomic mass.
  {
    id: 'nuclear-fusion',
    title: 'Nuclear fusion',
    summary: 'Two hydrogen nuclei slam together and become helium — like the Sun.',
    reactionId: 'd-t-fusion',
    reactionType: 'fusion',
    difficulty: 5,
    effectKind: 'fusion',
    ingredients: [{ kind: 'atom', Z: 1, count: 2 }],
    products: [{ kind: 'atom', Z: 2, count: 1 }],
    // The free neutron carries most of the 14 MeV of kinetic energy
    // released; the EnergyDisplay cloud represents the rest (radiation +
    // recoil). Showing the neutron in the Results scene closes the
    // "where did the mass go?" loop for students.
    freeParticles: [{ kind: 'neutron', count: 1 }],
    energyScale: 5,
    energyLabel: '17.6 MeV',
    steps: {
      ingredients: {
        elementary:
          'Two hydrogen atoms. In the Sun, they get squeezed by gravity until they crash into each other so hard they stick together.',
        advanced:
          'Reactants (idealised D-T fusion): ²H (deuterium) and ³H (tritium). Coulomb repulsion between the two positive nuclei requires either extreme temperature (~100 million K) or quantum tunneling for them to fuse.',
      },
      combine: {
        elementary:
          'BAM! The two nuclei merge into a single, bigger nucleus. A tiny bit of mass turns into a huge amount of energy.',
        advanced:
          'The strong nuclear force binds the merged nucleus together once electrostatic repulsion is overcome. Per E = mc², about 0.7% of the input mass converts to energy — mostly carried away by a 14 MeV neutron.',
      },
      results: {
        elementary:
          'A helium atom! Plus one tiny neutron that flew off, and a TON of energy. This is exactly how the Sun makes its light.',
        advanced:
          '²H + ³H → ⁴He + ¹n + 17.6 MeV. The released neutron carries most of the energy. The same reaction powers thermonuclear weapons and is the target of ITER, NIF, and every commercial fusion attempt.',
      },
    },
  },
  {
    id: 'nuclear-fission',
    title: 'Nuclear fission',
    summary: 'A heavy uranium nucleus splits in two — releasing energy and free neutrons.',
    reactionId: 'u235-fission',
    reactionType: 'fission',
    difficulty: 5,
    effectKind: 'fission',
    // Bare uranium atom. A real fission event starts with U-235 absorbing
    // a thermal neutron — we elide that incident neutron for visual
    // clarity and explain it in the step text.
    ingredients: [{ kind: 'atom', Z: 92, count: 1 }],
    // Canonical Ba-141 + Kr-92 + 3 neutrons split. The 3 neutrons are
    // rendered by NuclearEffect as ejected sprites, not as scene atoms.
    products: [
      { kind: 'atom', Z: 56, count: 1 },
      { kind: 'atom', Z: 36, count: 1 },
    ],
    // Three free neutrons — what makes a chain reaction possible
    // (each one can trigger another fission event in nearby U-235
    // nuclei). The remaining ~200 MeV of released energy is visualised
    // by the EnergyDisplay cloud rather than as individual photons.
    freeParticles: [{ kind: 'neutron', count: 3 }],
    energyScale: 5,
    energyLabel: '~200 MeV',
    steps: {
      ingredients: {
        elementary:
          'One uranium atom — the biggest atom that exists naturally. It is so heavy it can barely hold itself together.',
        advanced:
          'Reactant: ²³⁵U (uranium-235). The fissile nucleus is metastable; absorbing a slow (thermal) neutron pushes it past the binding-energy hump and it splits.',
      },
      combine: {
        elementary:
          'CRACK! The uranium splits into two smaller atoms. Three new neutrons fly out — and if they hit OTHER uranium atoms, the whole thing repeats. That is a chain reaction.',
        advanced:
          'A captured neutron deforms the U-236 intermediate beyond its critical Coulomb barrier. The nucleus splits into two roughly mid-mass fragments plus, on average, ~2.4 prompt neutrons — enough to sustain a chain reaction in a critical mass.',
      },
      results: {
        elementary:
          'Barium and krypton — two new atoms, made from one. Plus three neutrons, plus a HUGE amount of energy. This is what powers nuclear reactors, and what is inside a fission bomb.',
        advanced:
          '²³⁵U + ¹n → ¹⁴¹Ba + ⁹²Kr + 3 ¹n + ~200 MeV. About 0.1% of the input mass becomes energy. Every commercial fission reactor and every first-stage nuclear weapon runs on this reaction.',
      },
    },
  },
  {
    id: 'thermite',
    title: 'Thermite reaction',
    summary: 'Aluminum rips oxygen away from rust — molten iron pours out.',
    reactionId: 'thermite',
    reactionType: 'displacement',
    difficulty: 4,
    // Visually a combustion-style burst — molten metal, blinding flash —
    // even though it's chemically a single-displacement reaction.
    effectKind: 'combustion',
    // Render reactants as bare atoms. Iron oxide (Fe₂O₃) and aluminum
    // aren't in the molecule library; bare atoms convey the
    // stoichiometry without needing custom library entries.
    ingredients: [
      { kind: 'atom', Z: 26, count: 2 },
      { kind: 'atom', Z: 8, count: 3 },
      { kind: 'atom', Z: 13, count: 2 },
    ],
    // Products: Al₂O₃ (alumina) + molten Fe. Both as bare atoms for
    // the same reason as ingredients.
    products: [
      { kind: 'atom', Z: 13, count: 2 },
      { kind: 'atom', Z: 8, count: 3 },
      { kind: 'atom', Z: 26, count: 2 },
    ],
    energyScale: 5,
    energyLabel: '~−850 kJ/mol',
    steps: {
      ingredients: {
        elementary:
          'Two pieces of rust (iron + oxygen) and two pieces of aluminum. Aluminum REALLY wants to grab oxygen — more than iron does.',
        advanced:
          'Reactants: Fe₂O₃ (s) and 2 Al (s). Aluminum sits well above iron on the reactivity series, so Al can reduce Fe³⁺ all the way back to elemental Fe.',
      },
      combine: {
        elementary:
          'BLINDING WHITE FLASH! The aluminum yanks the oxygen off the iron. Iron is left so hot it melts and pours like lava.',
        advanced:
          "Each Al → Al³⁺ + 3 e⁻ (oxidation); each Fe³⁺ + 3 e⁻ → Fe (reduction). The reaction is so exothermic it heats the molten iron to ~2500 °C, well past iron's melting point.",
      },
      results: {
        elementary:
          'Aluminum oxide (white powder) and pure iron — so hot it flows like water. Workers use this to weld railway tracks together out in the field.',
        advanced:
          'Fe₂O₃ + 2 Al → Al₂O₃ + 2 Fe. ΔH ≈ −850 kJ/mol — among the most energetic non-nuclear reactions accessible without specialised equipment. Used industrially in field welding and incendiary munitions.',
      },
    },
  },
  {
    id: 'alpha-decay',
    title: 'Alpha decay',
    summary: 'An unstable nucleus spits out a helium atom on its own.',
    reactionId: 'u238-alpha-decay',
    reactionType: 'decay',
    difficulty: 5,
    effectKind: 'decay',
    // Uranium-238 — the most abundant uranium isotope, naturally
    // radioactive, decays slowly (half-life 4.5 billion years).
    ingredients: [{ kind: 'atom', Z: 92, count: 1 }],
    // Thorium-234 + the alpha particle (a helium-4 nucleus). We
    // render the alpha as a regular helium atom so the user sees
    // exactly what flew out.
    products: [
      { kind: 'atom', Z: 90, count: 1 },
      { kind: 'atom', Z: 2, count: 1 },
    ],
    energyScale: 4,
    energyLabel: '4.27 MeV',
    steps: {
      ingredients: {
        elementary:
          'A uranium atom — naturally unstable. Just sitting there, slowly trying to find a more stable shape.',
        advanced:
          'Reactant: ²³⁸U (uranium-238). The nucleus is past the line of nuclear stability; lowering its mass-energy by emitting a tightly-bound ⁴He cluster is the most favourable decay path.',
      },
      combine: {
        elementary:
          'Without anything triggering it, the uranium spits out a tiny chunk — a helium nucleus. Now the uranium has changed into a different element: thorium.',
        advanced:
          '²³⁸U → ²³⁴Th + ⁴He via tunnelling through the Coulomb barrier. Energetics are governed by binding-energy differences; no external particle is required.',
      },
      results: {
        elementary:
          'Thorium and a helium atom. The helium flew off so fast it can punch through skin (this is alpha radiation). Uranium does this trillions of times per second in any uranium sample.',
        advanced:
          '²³⁸U → ²³⁴Th + ⁴He + 4.27 MeV. Half-life: 4.468 × 10⁹ y. The energy is carried away mostly as alpha-particle kinetic energy. The basis of uranium-lead radiometric dating.',
      },
    },
  },
  {
    id: 'pp-chain-fusion',
    title: 'Solar fusion (proton-proton)',
    summary: 'Four hydrogen atoms fuse into helium — this is how the Sun shines.',
    reactionId: 'pp-chain',
    reactionType: 'fusion',
    difficulty: 5,
    effectKind: 'fusion',
    // 4 protons net — the visual abstracts the multi-step PP-I chain
    // into a single 4→1 fusion event for clarity.
    ingredients: [{ kind: 'atom', Z: 1, count: 4 }],
    products: [{ kind: 'atom', Z: 2, count: 1 }],
    energyScale: 5,
    energyLabel: '26.7 MeV',
    steps: {
      ingredients: {
        elementary:
          'Four hydrogen atoms, deep in the heart of a star. The Sun has a LOT of these, being crushed by gravity at millions of degrees.',
        advanced:
          "Reactants (net): 4 ¹H. The actual PP-I chain runs in three stages over ~10⁹ years per cycle in the Sun's core, mediated by ²H and ³He intermediates and the weak interaction.",
      },
      combine: {
        elementary:
          'In a long chain of tiny collisions, four protons squeeze together until they merge into one helium atom. The mass that disappears becomes pure energy.',
        advanced:
          'Steps: 2(¹H + ¹H → ²H + e⁺ + νe), 2(²H + ¹H → ³He + γ), then ³He + ³He → ⁴He + 2¹H. Net: 4 ¹H → ⁴He + 2 e⁺ + 2 νe + ~26.7 MeV (incl. positron annihilation).',
      },
      results: {
        elementary:
          "One helium atom and a HUGE amount of energy. The Sun does this 10³⁸ times every second — that's where sunlight comes from.",
        advanced:
          'Net: 4 ¹H → ⁴He + 26.7 MeV. The mass deficit (~0.7%) is converted per E = mc². The PP chain powers all stars below ~1.3 M☉, including the Sun.',
      },
    },
  },
  {
    id: 'triple-alpha',
    title: 'Triple-alpha process',
    summary: 'Three helium atoms forge a carbon atom — how stars make life.',
    reactionId: 'triple-alpha',
    reactionType: 'fusion',
    difficulty: 5,
    effectKind: 'fusion',
    // Three ⁴He nuclei combine into one ¹²C nucleus. The reaction is
    // why heavy elements (and ultimately we) exist.
    ingredients: [{ kind: 'atom', Z: 2, count: 3 }],
    products: [{ kind: 'atom', Z: 6, count: 1 }],
    energyScale: 4,
    energyLabel: '7.3 MeV',
    steps: {
      ingredients: {
        elementary:
          'Three helium atoms inside a dying star. The star is old, hot, and dense — perfect conditions for helium to fuse into something heavier.',
        advanced:
          'Reactants: 3 ⁴He. Requires ~100 million K and high density — conditions reached in red giant cores after hydrogen burning depletes the stellar core.',
      },
      combine: {
        elementary:
          'The three helium atoms crash together and merge into a single carbon atom. Every carbon atom in your body — and every star — was made this way.',
        advanced:
          'Two-step: ⁴He + ⁴He ⇌ ⁸Be (unstable, lifetime 10⁻¹⁶ s), then ⁸Be + ⁴He → ¹²C* → ¹²C + γ via the Hoyle state resonance. Fred Hoyle predicted this excited state to explain the abundance of carbon.',
      },
      results: {
        elementary:
          'Carbon! The element that makes DNA, plants, and you. Every carbon atom in the universe came from this exact reaction in a red giant star.',
        advanced:
          '3 ⁴He → ¹²C + 7.275 MeV. Together with subsequent alpha-capture (¹²C + ⁴He → ¹⁶O, ¹⁶O + ⁴He → ²⁰Ne, ...) this is how nucleosynthesis builds elements up to iron in stellar interiors.',
      },
    },
  },
  {
    id: 'pu239-fission',
    title: 'Plutonium-239 fission',
    summary: 'A plutonium atom splits — the fuel of fast reactors and Fat Man.',
    reactionId: 'pu239-fission',
    reactionType: 'fission',
    difficulty: 5,
    effectKind: 'fission',
    ingredients: [{ kind: 'atom', Z: 94, count: 1 }],
    // Representative split — Pu-239 actually yields a distribution of
    // fragments. Tellurium-134 + Molybdenum-102 is one common path.
    products: [
      { kind: 'atom', Z: 52, count: 1 },
      { kind: 'atom', Z: 42, count: 1 },
    ],
    freeParticles: [{ kind: 'neutron', count: 3 }],
    energyScale: 5,
    energyLabel: '~210 MeV',
    steps: {
      ingredients: {
        elementary:
          'A plutonium atom — synthetic, even heavier than uranium, and even more eager to split apart.',
        advanced:
          'Reactant: ²³⁹Pu (plutonium-239). Bred from U-238 by neutron capture and two beta decays. Lower critical mass than U-235 (~10 kg vs ~52 kg), making it the fissile material of choice for compact warheads and breeder reactors.',
      },
      combine: {
        elementary:
          'A neutron hits the plutonium. It splits into two new atoms and shoots out THREE more neutrons — which can split THREE more plutoniums. Chain reaction!',
        advanced:
          '²³⁹Pu + n → ²⁴⁰Pu* → fission fragments + ~2.9 prompt neutrons + ~210 MeV. Higher neutron yield per fission than U-235 → easier to sustain a chain reaction.',
      },
      results: {
        elementary:
          "Tellurium and molybdenum — two new atoms made from plutonium splitting. Plus three free neutrons. Plus enormous energy. This is what's inside a fast-spectrum reactor or a plutonium bomb.",
        advanced:
          '²³⁹Pu + ¹n → ¹³⁴Te + ¹⁰²Mo + 3 ¹n + ~210 MeV (one of many possible splits). Used in fast breeder reactors, the Nagasaki "Fat Man" device, and the secondary stages of thermonuclear weapons.',
      },
    },
  },
]

const DEMOS_BY_ID = new Map(DEMOS.map((d) => [d.id, d]))

export function getDemonstration(id: string): Demonstration | undefined {
  return DEMOS_BY_ID.get(id)
}
