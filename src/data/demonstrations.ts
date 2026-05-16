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
    // ejected neutrons. Visually dramatic to match the energy scale.
    | 'fusion'
    | 'fission'
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
]

const DEMOS_BY_ID = new Map(DEMOS.map((d) => [d.id, d]))

export function getDemonstration(id: string): Demonstration | undefined {
  return DEMOS_BY_ID.get(id)
}
