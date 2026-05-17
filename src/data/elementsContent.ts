/**
 * Educational content per element — supplementary to the bare data in
 * `elementsFull.ts`. Used by the /elements detail card to render the
 * Discovery, Common Uses, and Everyday Examples sections.
 *
 * Every Z from 1 to 118 has a non-empty entry so visitors can click any
 * tile in the periodic table and learn something. For very obscure
 * synthetics where no real "everyday example" exists, the entry is
 * honest about that and explains why the element matters anyway.
 *
 * Discovery years: negative numbers represent BCE (e.g. -3000 = ~3000
 * BCE). The UI renders these as "Known since at least 3000 BCE".
 */

/**
 * A notable isotope. The 3D atom's neutron count is driven by the
 * dominant isotope by default; chips on the detail page let the user
 * swap to one of these and the renderer updates live.
 */
export interface IsotopeInfo {
  /** Mass number (A) = protons + neutrons. Drives the rendered atom. */
  massNumber: number
  /** Informal name when it has one ("Deuterium", "Carbon-14"). */
  name?: string
  /** Natural abundance, percent. Omit for synthetic isotopes. */
  abundance?: number
  /** Half-life shown as text: "stable", "12.3 years", "4.5 × 10⁹ y". */
  halfLife?: string
  /** One-sentence note: what it's used for / why it's famous. */
  note?: string
}

/**
 * Where the element comes from cosmically + where you find it today.
 */
export interface OriginInfo {
  /** One-sentence formation story (Big Bang, stellar fusion, supernova
   *  r-process, lab synthesis…). */
  formation: string
  /** Where you find this element in the natural world today. */
  whereFound?: string
}

/** Quantitative abundance across contexts a student would meet. */
export interface AbundanceInfo {
  crust?: string
  body?: string
  universe?: string
  atmosphere?: string
  oceans?: string
}

export interface ElementContent {
  discoveredYear?: number
  discoveredBy?: string
  /** 3–6 short phrases for the Common Uses list. */
  uses?: string[]
  /** One short paragraph (1–3 sentences) for Everyday Examples. */
  everydayExamples?: string
  /** Notable isotopes — usually 1–4 entries. */
  isotopes?: IsotopeInfo[]
  /** Cosmic formation story + earthly distribution. */
  origin?: OriginInfo
  /** Abundance across body / crust / universe / oceans / atmosphere. */
  abundance?: AbundanceInfo
}

const ANTIQUITY = 'Known since antiquity'

const CONTENT: Record<number, ElementContent> = {
  1: {
    discoveredYear: 1766,
    discoveredBy: 'Henry Cavendish',
    uses: ['Rocket fuel', 'Ammonia production', 'Fuel cells', 'Hydrogenating fats'],
    everydayExamples:
      'The most abundant element in the universe. Two hydrogen atoms bond with oxygen to make every drop of water you have ever drunk.',
    isotopes: [
      {
        massNumber: 1,
        name: 'Protium (¹H)',
        abundance: 99.985,
        halfLife: 'stable',
        note: 'Plain hydrogen — one proton, no neutrons. 99.985% of all hydrogen atoms.',
      },
      {
        massNumber: 2,
        name: 'Deuterium (²H)',
        abundance: 0.015,
        halfLife: 'stable',
        note: 'Heavy hydrogen — one extra neutron. Used in "heavy water" reactors and as a fusion fuel.',
      },
      {
        massNumber: 3,
        name: 'Tritium (³H)',
        halfLife: '12.3 years',
        note: 'Radioactive. Produced in nuclear reactors, used in glow-in-the-dark exit signs and fusion bombs.',
      },
    ],
    origin: {
      formation:
        'Formed in the first three minutes after the Big Bang — hydrogen is older than every star.',
      whereFound:
        'On Earth, almost all hydrogen is locked into water and organic molecules. Free H₂ gas leaks to space because it is too light for gravity to hold.',
    },
    abundance: {
      universe: '~75% of all atomic mass',
      crust: '~0.14% by mass',
      body: '~10% by mass (mostly in water and organic molecules)',
      oceans: '~11% by mass',
    },
  },
  2: {
    discoveredYear: 1868,
    discoveredBy: 'Pierre Janssen & Norman Lockyer',
    uses: [
      'Party balloons',
      'MRI machines (liquid helium coolant)',
      'Deep-sea breathing mixes',
      'Cooling space telescopes',
    ],
    everydayExamples:
      'The squeaky-voice gas in birthday balloons. Lighter than air, completely inert — it never reacts with anything else.',
    isotopes: [
      {
        massNumber: 3,
        name: 'Helium-3',
        abundance: 0.0002,
        halfLife: 'stable',
        note: 'Extremely rare on Earth. Considered a potential clean fusion fuel (lots of it on the Moon).',
      },
      {
        massNumber: 4,
        name: 'Helium-4',
        abundance: 99.9998,
        halfLife: 'stable',
        note: 'What you actually breathe in a party balloon. Also the alpha particle ejected by radioactive decay.',
      },
    ],
    origin: {
      formation:
        'About 24% of all helium formed in Big Bang nucleosynthesis; the rest is forged inside stars by hydrogen fusion (the proton-proton chain).',
      whereFound:
        "Most Earth helium is in natural-gas pockets — produced by radioactive alpha decay of uranium and thorium underground over billions of years. It's a non-renewable resource on this planet.",
    },
    abundance: {
      universe: '~24% by mass (second only to hydrogen)',
      atmosphere: '~5 ppm',
      crust: 'trace',
    },
  },
  3: {
    discoveredYear: 1817,
    discoveredBy: 'Johan August Arfwedson',
    uses: [
      'Rechargeable batteries',
      'Mood-stabilizing medication',
      'Heat-resistant glass',
      'Aircraft alloys',
    ],
    everydayExamples:
      'Inside the battery of every phone and laptop. The lightest metal — soft enough to cut with a butter knife.',
  },
  4: {
    discoveredYear: 1798,
    discoveredBy: 'Louis Nicolas Vauquelin',
    uses: [
      'X-ray windows',
      'Aerospace alloys',
      'Nuclear reactors',
      'Springs in precision instruments',
    ],
    everydayExamples:
      'Toxic, but transparent to X-rays — which is why it lines the windows of X-ray tubes in hospitals.',
  },
  5: {
    discoveredYear: 1808,
    discoveredBy: 'Joseph Louis Gay-Lussac & Louis Jacques Thénard',
    uses: ['Detergents and bleach', 'Pyrex glass', 'Insulation fiberglass', 'Borax (cleaning)'],
    everydayExamples:
      'Borax in laundry detergent, boric acid in eye-wash, borosilicate in your favorite Pyrex measuring cup.',
  },
  6: {
    discoveredYear: -3750,
    discoveredBy: ANTIQUITY,
    uses: ['Pencils (graphite)', 'Diamonds', 'Every living thing', 'Steel (carbon alloys)'],
    everydayExamples:
      'You are mostly carbon. So are diamonds, charcoal, and the graphite in pencils — all the same element in different bonding arrangements.',
    isotopes: [
      {
        massNumber: 12,
        name: 'Carbon-12',
        abundance: 98.9,
        halfLife: 'stable',
        note: 'The reference for the atomic mass unit. The carbon in your body is almost all this.',
      },
      {
        massNumber: 13,
        name: 'Carbon-13',
        abundance: 1.1,
        halfLife: 'stable',
        note: 'Used in NMR spectroscopy and to trace where carbon goes in chemistry experiments.',
      },
      {
        massNumber: 14,
        name: 'Carbon-14',
        halfLife: '5,730 years',
        note: 'Trace radioactive isotope produced when cosmic rays hit nitrogen in the atmosphere. The basis of carbon dating.',
      },
    ],
    origin: {
      formation:
        'Forged inside dying red-giant stars by the triple-alpha process: three helium nuclei fuse into one carbon nucleus. Every carbon atom in your body came from inside a star.',
      whereFound:
        "Carbon is everywhere life is — DNA, proteins, sugars, fats, coal, oil, diamonds, and limestone (CaCO₃). The Earth's crust is only ~0.18% carbon, but it's the structural backbone of biochemistry.",
    },
    abundance: {
      universe: '4th most abundant element',
      crust: '~0.18% by mass',
      body: '~18% by mass (second only to oxygen)',
      atmosphere: '~0.04% (as CO₂, rising)',
    },
  },
  7: {
    discoveredYear: 1772,
    discoveredBy: 'Daniel Rutherford',
    uses: [
      'Fertilizers',
      'Inert atmosphere for chips & food packaging',
      'Liquid nitrogen freezing',
      'Explosives (TNT, nitroglycerin)',
    ],
    everydayExamples:
      '78% of the air you breathe. Liquid nitrogen freezes ice cream into snack-size beads at carnival stands.',
    isotopes: [
      {
        massNumber: 14,
        name: 'Nitrogen-14',
        abundance: 99.6,
        halfLife: 'stable',
        note: "Almost all nitrogen on Earth — including everything you've ever inhaled.",
      },
      {
        massNumber: 15,
        name: 'Nitrogen-15',
        abundance: 0.4,
        halfLife: 'stable',
        note: 'Used in NMR studies of proteins; also useful for tracking fertiliser uptake in plants.',
      },
    ],
    origin: {
      formation:
        'Made inside stars in the CNO cycle (a hydrogen-burning fusion pathway catalyzed by carbon, nitrogen, and oxygen nuclei).',
      whereFound:
        'Most of it sits in the atmosphere as N₂. Plants need nitrogen to make proteins but can only use the "fixed" form (NH₃ or NO₃⁻) — that fixing happens in bacterial root nodules and in industrial Haber-Bosch reactors.',
    },
    abundance: {
      universe: '7th most abundant',
      atmosphere: '~78% by volume',
      crust: '~0.002%',
      body: '~3% by mass',
    },
  },
  8: {
    discoveredYear: 1774,
    discoveredBy: 'Carl Wilhelm Scheele & Joseph Priestley',
    uses: ['Breathing', 'Steelmaking', 'Rocket fuel oxidizer', 'Medical ventilators'],
    everydayExamples:
      'You inhale 11,000 liters of air containing this every day. Iron rusts because oxygen pulls electrons off the metal.',
    isotopes: [
      {
        massNumber: 16,
        name: 'Oxygen-16',
        abundance: 99.76,
        halfLife: 'stable',
        note: 'The dominant oxygen isotope — most of the oxygen in air, water, and rocks.',
      },
      {
        massNumber: 17,
        name: 'Oxygen-17',
        abundance: 0.04,
        halfLife: 'stable',
      },
      {
        massNumber: 18,
        name: 'Oxygen-18',
        abundance: 0.2,
        halfLife: 'stable',
        note: 'Ratio of ¹⁸O to ¹⁶O in ice cores and seashells is how we measure ancient climate.',
      },
    ],
    origin: {
      formation:
        'Forged in massive stars during helium fusion (¹²C + ⁴He → ¹⁶O) and scattered across the galaxy when those stars explode as supernovae.',
      whereFound:
        "Most abundant element in the Earth's crust by mass — locked up in silicate rocks, water, and the atmosphere. Free O₂ in the air only exists because cyanobacteria started photosynthesizing 2.4 billion years ago.",
    },
    abundance: {
      universe: '3rd most abundant',
      crust: '~46% by mass (most abundant)',
      body: '~65% by mass (most abundant)',
      atmosphere: '~21% by volume',
      oceans: '~86% by mass',
    },
  },
  9: {
    discoveredYear: 1886,
    discoveredBy: 'Henri Moissan',
    uses: [
      'Toothpaste (fluoride)',
      'Non-stick coatings (PTFE/Teflon)',
      'Refrigerants',
      'Pharmaceuticals',
    ],
    everydayExamples:
      'The fluoride that strengthens tooth enamel — and the same element that makes non-stick pans non-stick.',
  },
  10: {
    discoveredYear: 1898,
    discoveredBy: 'William Ramsay & Morris Travers',
    uses: ['Neon signs', 'High-voltage indicators', 'Lasers (He-Ne)', 'Cryogenics'],
    everydayExamples:
      'The reddish-orange glow in vintage diner signs and old movie marquees. Pass electricity through neon gas and it lights up.',
  },
  11: {
    discoveredYear: 1807,
    discoveredBy: 'Humphry Davy',
    uses: ['Table salt (with chlorine)', 'Streetlights (orange glow)', 'Soap', 'Baking soda'],
    everydayExamples:
      'Half of every salt shaker. Also responsible for the warm orange streetlight color on old highways.',
    isotopes: [
      {
        massNumber: 23,
        name: 'Sodium-23',
        abundance: 100,
        halfLife: 'stable',
        note: 'The only natural sodium isotope. All the sodium in your blood, in salt, and in soap is this one.',
      },
    ],
    origin: {
      formation:
        'Forged in massive stars by carbon burning (²¹Ne fuses upward via the rp-process) and scattered by supernovae.',
      whereFound:
        'Sodium is so reactive it never exists pure in nature — only as ions. Rock salt (NaCl) deposits, sea water, and the brines of dry lakes. Your blood plasma carries 0.4% sodium by weight.',
    },
    abundance: {
      crust: '~2.3% by mass (6th most abundant)',
      oceans: '~1.1% by mass',
      body: '~0.15% by mass (in blood and extracellular fluid)',
    },
  },
  12: {
    discoveredYear: 1808,
    discoveredBy: 'Humphry Davy',
    uses: [
      'Fireworks (bright white flares)',
      'Lightweight alloys for cars and laptops',
      'Antacids',
      'Photosynthesis (chlorophyll)',
    ],
    everydayExamples:
      'The metal that makes magnesium-flare fireworks burn dazzling white. Also at the center of every chlorophyll molecule.',
    isotopes: [
      {
        massNumber: 24,
        name: 'Magnesium-24',
        abundance: 79,
        halfLife: 'stable',
      },
      {
        massNumber: 25,
        name: 'Magnesium-25',
        abundance: 10,
        halfLife: 'stable',
      },
      {
        massNumber: 26,
        name: 'Magnesium-26',
        abundance: 11,
        halfLife: 'stable',
        note: 'Excess ²⁶Mg in meteorites is a fingerprint of extinct ²⁶Al — evidence of supernova material in the early solar system.',
      },
    ],
    origin: {
      formation:
        'Built inside massive stars during carbon and neon burning, then ejected by supernovae. Plants pull it from soil to build chlorophyll.',
      whereFound:
        '8th most abundant element on Earth. Sea water is rich in Mg²⁺ ions; the metal is industrially extracted by electrolysis of molten MgCl₂. Every chlorophyll molecule has one Mg atom at its center.',
    },
    abundance: {
      crust: '~2.3% by mass (8th most abundant)',
      body: '~0.05%',
      oceans: '~0.13%',
    },
  },
  13: {
    discoveredYear: 1825,
    discoveredBy: 'Hans Christian Ørsted',
    uses: ['Soda cans', 'Aircraft frames', 'Foil and cooking pans', 'Power transmission lines'],
    everydayExamples:
      'Most-used metal after iron. Light, cheap, and recyclable — your soda can today might be airplane skin next year.',
    isotopes: [
      {
        massNumber: 27,
        name: 'Aluminum-27',
        abundance: 100,
        halfLife: 'stable',
        note: 'The only stable aluminum isotope.',
      },
    ],
    origin: {
      formation:
        'Forged in massive stars by oxygen burning and ejected in supernovae. Until 1886 it was as expensive as silver because nobody could economically reduce aluminum oxide.',
      whereFound:
        "Most-abundant metal in the Earth's crust (~8%). Always bound to oxygen as bauxite (Al₂O₃·2H₂O) until refined. The Hall–Héroult process (electrolysis of molten alumina) drops the price by 1000× and made aluminum the everyday metal it is now.",
    },
    abundance: {
      crust: '~8.1% by mass (most abundant metal, 3rd overall)',
      body: 'trace',
    },
  },
  14: {
    discoveredYear: 1824,
    discoveredBy: 'Jöns Jacob Berzelius',
    uses: [
      'Computer chips & solar panels',
      'Glass and quartz',
      'Concrete and sand',
      'Silicone rubber',
    ],
    everydayExamples:
      'The second-most abundant element in Earth’s crust. Every computer chip and every grain of beach sand.',
    isotopes: [
      {
        massNumber: 28,
        name: 'Silicon-28',
        abundance: 92.2,
        halfLife: 'stable',
      },
      {
        massNumber: 29,
        name: 'Silicon-29',
        abundance: 4.7,
        halfLife: 'stable',
      },
      {
        massNumber: 30,
        name: 'Silicon-30',
        abundance: 3.1,
        halfLife: 'stable',
      },
    ],
    origin: {
      formation:
        "Made in massive stars by oxygen burning. The 'silicon-burning' stage that follows is the LAST gasp of fusion before the star runs out of usable fuel and collapses into a supernova.",
      whereFound:
        "Second-most abundant element in the Earth's crust (after oxygen). Locked into silicate minerals: quartz, feldspar, mica. Refined into 99.9999% pure ingots for semiconductor wafers — the basis of every modern computer.",
    },
    abundance: {
      crust: '~28% by mass (2nd most abundant)',
      universe: '~0.07%',
    },
  },
  15: {
    discoveredYear: 1669,
    discoveredBy: 'Hennig Brand',
    uses: ['Fertilizers', 'DNA backbone', 'Match heads', 'Detergents'],
    everydayExamples:
      'In every strand of DNA and every grain of fertilizer that grows your food. The original "elemental discovery" — Brand boiled urine looking for gold.',
  },
  16: {
    discoveredYear: -2000,
    discoveredBy: ANTIQUITY,
    uses: [
      'Gunpowder & matches',
      'Sulfuric acid (most-produced industrial chemical)',
      'Vulcanizing rubber',
      'Sulfa drugs',
    ],
    everydayExamples:
      'The smell of struck matches, hot springs, and rotten eggs (as H₂S). Tires last because sulfur cross-links the rubber.',
  },
  17: {
    discoveredYear: 1774,
    discoveredBy: 'Carl Wilhelm Scheele',
    uses: ['Drinking-water disinfection', 'Bleach', 'PVC plastic', 'Table salt (with sodium)'],
    everydayExamples:
      'Keeps swimming pools clean and tap water safe. The other half of every salt shaker.',
    isotopes: [
      {
        massNumber: 35,
        name: 'Chlorine-35',
        abundance: 75.8,
        halfLife: 'stable',
      },
      {
        massNumber: 37,
        name: 'Chlorine-37',
        abundance: 24.2,
        halfLife: 'stable',
        note: 'The two stable chlorine isotopes give chlorine its peculiar 35.45 average atomic mass.',
      },
    ],
    origin: {
      formation:
        'Forged in oxygen-burning stages of massive stars and dispersed by supernovae. Reactive enough that it never exists pure in nature — always as Cl⁻ ions or Cl₂ in compounds.',
      whereFound:
        'Mostly in dissolved salt: oceans contain ~1.9% chloride ions. Rock-salt deposits, salt flats, and the brine pumped out for industrial chlorine production. Your stomach makes HCl to digest food.',
    },
    abundance: {
      crust: '~0.014%',
      oceans: '~1.9% (as Cl⁻)',
      body: '~0.15%',
    },
  },
  18: {
    discoveredYear: 1894,
    discoveredBy: 'Lord Rayleigh & William Ramsay',
    uses: [
      'Inert welding atmospheres',
      'Old-school incandescent bulbs',
      'Wine preservation',
      'Geological dating (Ar-40)',
    ],
    everydayExamples:
      'Almost 1% of the air you breathe — completely inert and odorless. Welders shroud their work in it to keep oxygen out.',
  },
  19: {
    discoveredYear: 1807,
    discoveredBy: 'Humphry Davy',
    uses: [
      'Fertilizers',
      'Bananas (and every cell in your body)',
      'Soft soap',
      'Gunpowder substitute',
    ],
    everydayExamples:
      'The reason a banana is a healthy snack. Every nerve impulse in your body depends on potassium ions crossing cell membranes.',
    isotopes: [
      {
        massNumber: 39,
        name: 'Potassium-39',
        abundance: 93.26,
        halfLife: 'stable',
      },
      {
        massNumber: 40,
        name: 'Potassium-40',
        abundance: 0.012,
        halfLife: '1.25 × 10⁹ years',
        note: 'Naturally radioactive — about 0.012% of all potassium. Bananas (and you) emit measurable beta radiation from this isotope. The basis of K-Ar rock dating.',
      },
      {
        massNumber: 41,
        name: 'Potassium-41',
        abundance: 6.73,
        halfLife: 'stable',
      },
    ],
    origin: {
      formation: 'Built in massive stars by silicon burning, then released by supernovae.',
      whereFound:
        "Earth's crust holds ~2% potassium, mostly in feldspar minerals and salt deposits. Plants pull it from soil; you get it from bananas, potatoes, and leafy greens. Inside your cells, K⁺ is the dominant positive ion.",
    },
    abundance: {
      crust: '~2.1% by mass (7th most abundant)',
      body: '~0.4% (mostly inside cells)',
      oceans: '~0.04%',
    },
  },
  20: {
    discoveredYear: 1808,
    discoveredBy: 'Humphry Davy',
    uses: ['Bones and teeth', 'Cement and plaster', 'Eggshells', 'Antacids (TUMS)'],
    everydayExamples:
      'The reason your bones are strong and your teeth bite. Chalk, marble, and seashells are all calcium carbonate.',
    isotopes: [
      {
        massNumber: 40,
        name: 'Calcium-40',
        abundance: 96.94,
        halfLife: 'stable',
        note: 'The dominant isotope — the calcium in your bones is mostly this.',
      },
      {
        massNumber: 44,
        name: 'Calcium-44',
        abundance: 2.09,
        halfLife: 'stable',
      },
      {
        massNumber: 48,
        name: 'Calcium-48',
        abundance: 0.187,
        halfLife: '4 × 10¹⁹ years',
        note: 'Technically radioactive but with a half-life billions of times the age of the universe — effectively stable.',
      },
    ],
    origin: {
      formation:
        "Forged in massive stars by 'silicon burning' — silicon nuclei fuse upward through sulfur, argon, and calcium during the final hours before the star goes supernova.",
      whereFound:
        "5th most abundant element in the Earth's crust. Locked into limestone (CaCO₃), gypsum, and bones. The white cliffs of Dover are pure calcium carbonate from compressed plankton shells.",
    },
    abundance: {
      crust: '~4.2% by mass (5th most abundant)',
      body: '~1.5% by mass (mostly in bones and teeth)',
      universe: '~0.007%',
      oceans: '~0.04%',
    },
  },
  21: {
    discoveredYear: 1879,
    discoveredBy: 'Lars Fredrik Nilson',
    uses: ['Aerospace alloys (Sc-Al)', 'High-intensity stadium lights', 'Baseball-bat alloys'],
    everydayExamples:
      'Mixed with aluminum it makes an alloy lighter than titanium — used in jet fighter frames and high-end baseball bats.',
  },
  22: {
    discoveredYear: 1791,
    discoveredBy: 'William Gregor',
    uses: ['Aircraft and rocket bodies', 'Medical implants', 'Sunscreen pigment (TiO₂)', 'Jewelry'],
    everydayExamples:
      'Hip replacements, white paint, and the white pigment in sunscreen. Strong as steel at half the weight.',
  },
  23: {
    discoveredYear: 1801,
    discoveredBy: 'Andrés Manuel del Río',
    uses: ['Tool steel', 'Catalysts for sulfuric acid', 'Vanadium-redox flow batteries'],
    everydayExamples:
      'The "V" in tool steel — wrenches and drill bits last longer because vanadium toughens them. Named after a Norse goddess of beauty.',
  },
  24: {
    discoveredYear: 1797,
    discoveredBy: 'Louis Nicolas Vauquelin',
    uses: ['Stainless steel', 'Chrome plating', 'Leather tanning', 'Catalysts'],
    everydayExamples:
      'The shiny finish on bumpers, faucet handles, and motorcycle exhaust pipes. Adds rust resistance to stainless steel.',
  },
  25: {
    discoveredYear: 1774,
    discoveredBy: 'Johan Gottlieb Gahn',
    uses: [
      'Steel hardening',
      'Disposable batteries',
      'Stainless-steel alloys',
      'KMnO₄ disinfectant',
    ],
    everydayExamples:
      'The dark interior of every alkaline battery. Also the purple stuff a chemistry teacher uses to disinfect fish-tank water.',
  },
  26: {
    discoveredYear: -3000,
    discoveredBy: ANTIQUITY,
    uses: [
      'Steel (everything from buildings to cars)',
      'Hemoglobin in blood',
      'Magnets',
      'Cookware',
    ],
    everydayExamples:
      'The most-used metal on Earth — every skyscraper, every car, every cast-iron pan. Also what makes your blood red.',
    isotopes: [
      {
        massNumber: 54,
        name: 'Iron-54',
        abundance: 5.8,
        halfLife: 'stable',
      },
      {
        massNumber: 56,
        name: 'Iron-56',
        abundance: 91.8,
        halfLife: 'stable',
        note: 'The most stable nucleus in the universe — has the highest binding energy per nucleon. The end point of stellar fusion.',
      },
      {
        massNumber: 57,
        name: 'Iron-57',
        abundance: 2.1,
        halfLife: 'stable',
      },
      {
        massNumber: 58,
        name: 'Iron-58',
        abundance: 0.3,
        halfLife: 'stable',
      },
    ],
    origin: {
      formation:
        "Forged at the end of a massive star's life — iron is where fusion stops paying off. Stars 8+ solar masses build iron cores, can't generate more energy, and collapse into supernovae that scatter iron across the galaxy.",
      whereFound:
        "The Earth's inner and outer cores are mostly iron. The crust holds the iron we mine (banded iron formations laid down when early life first oxygenated the oceans). Your blood carries 4 grams of iron in hemoglobin.",
    },
    abundance: {
      universe: '6th most abundant',
      crust: '~5% by mass (4th most abundant)',
      body: '~0.006% (4 grams in adult)',
    },
  },
  27: {
    discoveredYear: 1735,
    discoveredBy: 'Georg Brandt',
    uses: [
      'Magnets',
      'Lithium-ion battery cathodes',
      'Cobalt-blue glass and pigment',
      'Surgical tools',
    ],
    everydayExamples:
      'The deep blue in stained-glass windows and Delft pottery. Also a key ingredient in the cathode of every smartphone battery.',
  },
  28: {
    discoveredYear: 1751,
    discoveredBy: 'Axel Fredrik Cronstedt',
    uses: ['Stainless steel', 'Rechargeable batteries', 'Coins', 'Catalysts'],
    everydayExamples:
      'The non-rusting metal in a US 5¢ "nickel" (mostly copper, but the name sticks). Also the plating on most kitchen sinks.',
  },
  29: {
    discoveredYear: -8000,
    discoveredBy: ANTIQUITY,
    uses: ['Electrical wiring', 'Plumbing', 'Coins and statues', 'Cookware'],
    everydayExamples:
      'The wires in your walls and the pipes under your sink. The Statue of Liberty is copper — that’s why she’s green (oxidized to a patina).',
  },
  30: {
    discoveredYear: 1746,
    discoveredBy: 'Andreas Sigismund Marggraf',
    uses: [
      'Galvanizing steel (preventing rust)',
      'Brass alloys',
      'Sunscreen (ZnO)',
      'Cold remedies',
    ],
    everydayExamples:
      'The dull-grey coating on chain-link fences and galvanized nails. White zinc oxide on a lifeguard’s nose.',
  },
  31: {
    discoveredYear: 1875,
    discoveredBy: 'Paul-Émile Lecoq de Boisbaudran',
    uses: ['LEDs and laser diodes', 'Solar panels', 'Thermometers (low-melting alloys)'],
    everydayExamples:
      'Melts in your hand — its melting point is just 30°C. The blue LEDs in your remote control are made from gallium nitride.',
  },
  32: {
    discoveredYear: 1886,
    discoveredBy: 'Clemens Winkler',
    uses: ['Fiber-optic cables', 'Infrared optics (night-vision)', 'Solar cells'],
    everydayExamples:
      'The element that lets fiber-optic internet work — light travels through germanium-doped glass with almost no loss. Also the heart of every night-vision scope.',
  },
  33: {
    discoveredYear: 1250,
    discoveredBy: 'Albertus Magnus',
    uses: ['Semiconductor doping', 'Wood preservatives (historically)', 'Lead-acid battery alloys'],
    everydayExamples:
      'Famously poisonous — Victorian wallpaper was tinted green with arsenic dye, slowly poisoning entire households. Today it’s used in tiny amounts to dope silicon for high-speed transistors.',
  },
  34: {
    discoveredYear: 1817,
    discoveredBy: 'Jöns Jacob Berzelius',
    uses: ['Photocopier and laser printer drums', 'Anti-dandruff shampoo', 'Glass tinting'],
    everydayExamples:
      'The active ingredient in Head & Shoulders shampoo (selenium sulfide). Also makes photocopier drums conduct electricity only when light hits them.',
  },
  35: {
    discoveredYear: 1826,
    discoveredBy: 'Antoine Jérôme Balard',
    uses: [
      'Flame retardants',
      'Photographic film (historically)',
      'Water treatment',
      'Antiknock fuel additives',
    ],
    everydayExamples:
      'Liquid at room temperature — one of only two non-metallic liquid elements. The brown smoke that rises off it is poisonous.',
  },
  36: {
    discoveredYear: 1898,
    discoveredBy: 'William Ramsay & Morris Travers',
    uses: ['High-intensity flash lamps', 'Lasers', 'Insulating window-pane gas'],
    everydayExamples:
      'Sealed between the panes of energy-efficient windows to slow heat loss. Also the gas in the flashbulb of an old camera.',
  },
  37: {
    discoveredYear: 1861,
    discoveredBy: 'Robert Bunsen & Gustav Kirchhoff',
    uses: [
      'Atomic clocks (rubidium frequency standards)',
      'Specialty glass',
      'Vacuum tube getters',
    ],
    everydayExamples:
      'GPS satellites carry rubidium atomic clocks accurate to a second every 30,000 years — that’s how your phone knows where you are.',
  },
  38: {
    discoveredYear: 1790,
    discoveredBy: 'Adair Crawford',
    uses: [
      'Fireworks (red flames)',
      'Old TV tubes (X-ray shielding)',
      'Toothpaste for sensitivity',
      'Glow-in-the-dark paint',
    ],
    everydayExamples:
      'The brilliant red in fireworks comes from burning strontium salts. Strontium chloride is the active ingredient in toothpaste for sensitive teeth.',
  },
  39: {
    discoveredYear: 1794,
    discoveredBy: 'Johan Gadolin',
    uses: [
      'Red phosphors in old color TVs',
      'High-temperature superconductors',
      'Camera lenses',
      'YAG lasers',
    ],
    everydayExamples:
      'The red dots in old color TVs and CRT monitors glowed thanks to yttrium-europium phosphors. Today it’s in high-temperature superconductors for MRI magnets.',
  },
  40: {
    discoveredYear: 1789,
    discoveredBy: 'Martin Heinrich Klaproth',
    uses: [
      'Nuclear reactor fuel cladding',
      'Cubic zirconia (fake diamonds)',
      'Surgical tools',
      'Ceramic knives',
    ],
    everydayExamples:
      'Cubic zirconia in cheap "diamond" jewelry is actually zirconium oxide. Real diamonds and CZ look nearly identical but CZ costs 1/1000 the price.',
  },
  41: {
    discoveredYear: 1801,
    discoveredBy: 'Charles Hatchett',
    uses: [
      'MRI and particle-accelerator magnets',
      'Jet-engine alloys',
      'Hypoallergenic jewelry',
      'Capacitors',
    ],
    everydayExamples:
      'The wire coils in MRI machines are niobium-titanium, cooled with liquid helium so they conduct electricity with zero resistance.',
  },
  42: {
    discoveredYear: 1778,
    discoveredBy: 'Carl Wilhelm Scheele',
    uses: [
      'Steel alloys (high-strength, heat-resistant)',
      'Pigments',
      'Lubricants (MoS₂)',
      'Catalysts',
    ],
    everydayExamples:
      'Mixed into steel for jet engine turbine blades that stay strong at 1000°C. Molybdenum disulfide is the slippery black grease in bike chains.',
  },
  43: {
    discoveredYear: 1937,
    discoveredBy: 'Carlo Perrier & Emilio Segrè',
    uses: ['Medical imaging (Tc-99m radioactive tracer)', 'Steel corrosion inhibitor'],
    everydayExamples:
      'The first synthetic element — every atom of it on Earth was made in a lab. Tc-99m is injected into ~30 million patients a year for diagnostic scans.',
  },
  44: {
    discoveredYear: 1844,
    discoveredBy: 'Karl Ernst Claus',
    uses: [
      'Hard-disk drive platters',
      'Electrical contacts',
      'Solar-cell catalysts',
      'Jewelry alloys',
    ],
    everydayExamples:
      'The magnetic layer in hard drives is often a ruthenium-cobalt alloy. Also makes platinum tougher in jewelry.',
  },
  45: {
    discoveredYear: 1803,
    discoveredBy: 'William Hyde Wollaston',
    uses: [
      'Catalytic converters',
      'Jewelry (rhodium plating)',
      'Mirrors for searchlights',
      'Thermocouples',
    ],
    everydayExamples:
      'The most expensive precious metal — rarer than gold. White-gold jewelry is usually rhodium-plated to give it that bright silver-white finish.',
  },
  46: {
    discoveredYear: 1803,
    discoveredBy: 'William Hyde Wollaston',
    uses: ['Catalytic converters', 'Hydrogen-fuel-cell catalysts', 'Jewelry', 'Dental crowns'],
    everydayExamples:
      'Catalytic converters in cars use platinum-palladium to convert toxic exhaust gases into harmless ones — half the global supply goes to your tailpipe.',
  },
  47: {
    discoveredYear: -3000,
    discoveredBy: ANTIQUITY,
    uses: ['Jewelry and coins', 'Antibacterial coatings', 'Mirrors', 'Solar panel contacts'],
    everydayExamples:
      'The most reflective metal — that’s why mirrors have a thin silver coating on the back. Also kills bacteria on contact, which is why it’s woven into some sportswear.',
  },
  48: {
    discoveredYear: 1817,
    discoveredBy: 'Friedrich Stromeyer',
    uses: ['Older rechargeable batteries (NiCd)', 'Yellow paint pigment', 'Solar-cell coatings'],
    everydayExamples:
      'The "Cd" in old NiCd batteries (now mostly replaced by Li-ion because cadmium is toxic). Cadmium yellow is still used in artist’s oils for its vivid color.',
  },
  49: {
    discoveredYear: 1863,
    discoveredBy: 'Ferdinand Reich & Hieronymous Theodor Richter',
    uses: [
      'Touchscreens (indium tin oxide)',
      'LCD displays',
      'Solar cells',
      'Low-temperature solder',
    ],
    everydayExamples:
      'Every smartphone touchscreen has a paper-thin transparent indium layer that conducts electricity AND lets light through. Without it, multi-touch wouldn’t exist.',
  },
  50: {
    discoveredYear: -3000,
    discoveredBy: ANTIQUITY,
    uses: ['Tin cans (lining)', 'Solder for electronics', 'Pewter mugs', 'Bronze (with copper)'],
    everydayExamples:
      'The "tin" in tin cans is actually a thin tin coating over steel. Soldered joints in every circuit board are tin-based alloys.',
  },
  51: {
    discoveredYear: -3000,
    discoveredBy: ANTIQUITY,
    uses: [
      'Lead-acid car battery plates',
      'Flame retardants',
      'Cosmetics (historically as kohl eyeliner)',
    ],
    everydayExamples:
      'Ancient Egyptians wore antimony eye-makeup ("kohl"). Today it’s mostly in the plates of your car battery, hardening the lead.',
  },
  52: {
    discoveredYear: 1782,
    discoveredBy: 'Franz-Joseph Müller von Reichenstein',
    uses: ['Rewritable DVDs and Blu-rays', 'Solar panels (CdTe cells)', 'Steel alloys'],
    everydayExamples:
      'The phase-change material in a rewritable DVD is mostly tellurium — switching between crystalline and amorphous when a laser hits it stores or erases bits.',
  },
  53: {
    discoveredYear: 1811,
    discoveredBy: 'Bernard Courtois',
    uses: [
      'Iodized table salt (thyroid health)',
      'Disinfectants (tincture of iodine)',
      'X-ray contrast dye',
    ],
    everydayExamples:
      'The brown stain a school nurse paints on a scraped knee. Also added to table salt because your thyroid needs it.',
  },
  54: {
    discoveredYear: 1898,
    discoveredBy: 'William Ramsay & Morris Travers',
    uses: [
      'Car headlights (xenon bulbs)',
      'Camera flashes',
      'Anesthetic',
      'Ion thrusters for spacecraft',
    ],
    everydayExamples:
      'The bright, slightly-blue HID headlights on luxury cars are xenon arc lamps. Also the propellant in the ion engines that power deep-space probes.',
  },
  55: {
    discoveredYear: 1860,
    discoveredBy: 'Robert Bunsen & Gustav Kirchhoff',
    uses: ['Atomic clocks (the SI definition of a second)', 'Drilling fluid', 'Photovoltaic cells'],
    everydayExamples:
      'The official second is defined by cesium’s natural vibration — every clock in the world is calibrated to a cesium atomic clock somewhere.',
  },
  56: {
    discoveredYear: 1808,
    discoveredBy: 'Humphry Davy',
    uses: [
      'X-ray contrast (barium swallow)',
      'Green fireworks',
      'Drilling mud',
      'Vacuum tube getters',
    ],
    everydayExamples:
      'The chalky "barium milkshake" a doctor makes you drink before an upper-GI X-ray — barium absorbs X-rays so your intestines show up.',
  },
  57: {
    discoveredYear: 1839,
    discoveredBy: 'Carl Gustaf Mosander',
    uses: [
      'Camera lenses (high refractive index)',
      'Hybrid car battery electrodes',
      'Lighter flints',
      'Pool chlorinator anodes',
    ],
    everydayExamples:
      'High-end DSLR camera lenses contain lanthanum oxide to bend light without distortion. Also a key ingredient in Toyota Prius batteries.',
  },
  58: {
    discoveredYear: 1803,
    discoveredBy: 'Jöns Jacob Berzelius & Wilhelm Hisinger',
    uses: [
      'Self-cleaning oven liners',
      'Catalytic converter coatings',
      'Glass polishing powder',
      'Lighter flints',
    ],
    everydayExamples:
      'Cerium oxide is the gritty white powder that jewelers use to polish glass and crystal — and it’s what coats the inside of self-cleaning ovens.',
  },
  59: {
    discoveredYear: 1885,
    discoveredBy: 'Carl Auer von Welsbach',
    uses: [
      'Aircraft engine magnets',
      'Yellow stained glass',
      'Studio lighting (didymium filters)',
      'Fiber-optic amplifiers',
    ],
    everydayExamples:
      'Welder’s goggles often use praseodymium-glass to filter out sodium’s harsh yellow flame light. Gives the wearer better contrast on the weld.',
  },
  60: {
    discoveredYear: 1885,
    discoveredBy: 'Carl Auer von Welsbach',
    uses: [
      'World’s strongest permanent magnets',
      'Microphones and speakers',
      'Hard disk drive motors',
      'Hybrid car motors',
    ],
    everydayExamples:
      'Those tiny crazy-strong "rare earth" magnets that snap together with a clack? Neodymium. They’re in every laptop speaker and electric-car motor.',
  },
  61: {
    discoveredYear: 1945,
    discoveredBy: 'Jacob A. Marinsky, Lawrence E. Glendenin, Charles D. Coryell',
    uses: [
      'Beta-source for nuclear batteries',
      'Radioluminescent paint (historically)',
      'Portable X-ray sources',
    ],
    everydayExamples:
      'The only lanthanide with no stable isotopes — entirely radioactive. Has been used in tiny long-life nuclear batteries that power deep-space probes.',
  },
  62: {
    discoveredYear: 1879,
    discoveredBy: 'Paul-Émile Lecoq de Boisbaudran',
    uses: [
      'High-temperature samarium-cobalt magnets',
      'Cancer treatment isotopes',
      'Optical lasers',
      'Carbon-arc lighting',
    ],
    everydayExamples:
      'Samarium-cobalt magnets handle extreme heat better than neodymium — used in jet-engine generators and military hardware.',
  },
  63: {
    discoveredYear: 1901,
    discoveredBy: 'Eugène-Anatole Demarçay',
    uses: [
      'Red phosphors in TVs and LED screens',
      'Anti-counterfeit ink in Euro banknotes',
      'Nuclear reactor control rods',
    ],
    everydayExamples:
      'Euro banknotes glow under UV light because of europium dyes — a built-in anti-counterfeiting feature. Same element makes the bright red pixels in old plasma TVs.',
  },
  64: {
    discoveredYear: 1880,
    discoveredBy: 'Jean Charles Galissard de Marignac',
    uses: [
      'MRI contrast agents',
      'Microwave ovens (yttrium-gadolinium garnet)',
      'CT scanner detectors',
      'Neutron-absorbing reactor rods',
    ],
    everydayExamples:
      'The "contrast" injected before an MRI is a gadolinium compound — it makes blood vessels and tumors light up sharply in the scan.',
  },
  65: {
    discoveredYear: 1843,
    discoveredBy: 'Carl Gustaf Mosander',
    uses: [
      'Green phosphors in fluorescent lamps',
      'Solid-state lasers',
      'Magneto-optical recording',
    ],
    everydayExamples:
      'The green glow inside fluorescent tubes and old CFL bulbs comes from terbium phosphors. Yttrium provides the host crystal; terbium provides the green light.',
  },
  66: {
    discoveredYear: 1886,
    discoveredBy: 'Paul-Émile Lecoq de Boisbaudran',
    uses: [
      'Wind-turbine generator magnets',
      'Hard-drive read heads',
      'Nuclear reactor control rods',
      'Halide lamps',
    ],
    everydayExamples:
      'Modern wind turbines need ~600 kg of dysprosium-doped magnets per turbine — without dysprosium the magnets demagnetize in the heat.',
  },
  67: {
    discoveredYear: 1878,
    discoveredBy: 'Marc Delafontaine & Jacques-Louis Soret',
    uses: [
      'Strongest magnetic poles known',
      'Nuclear reactor control rods',
      'Yellow / red glass dyes',
      'Microwave electronic devices',
    ],
    everydayExamples:
      'Has the highest magnetic strength of any element — laboratory electromagnets use holmium pole pieces to concentrate the field for materials research.',
  },
  68: {
    discoveredYear: 1843,
    discoveredBy: 'Carl Gustaf Mosander',
    uses: [
      'Fiber-optic amplifiers (erbium-doped fiber)',
      'Pink glass and ceramic glazes',
      'Lasers for surgery and skin treatment',
    ],
    everydayExamples:
      'The reason long-haul internet works: erbium-doped fibers boost the optical signal every ~80 km without needing to convert it to electricity first.',
  },
  69: {
    discoveredYear: 1879,
    discoveredBy: 'Per Teodor Cleve',
    uses: [
      'Portable X-ray sources',
      'Holmium-thulium-doped lasers (medical)',
      'Microwave ferrites',
    ],
    everydayExamples:
      'Pocket-sized portable X-ray machines (used by veterinarians and on disaster sites) often contain a small thulium-170 source as the radiation emitter.',
  },
  70: {
    discoveredYear: 1878,
    discoveredBy: 'Jean Charles Galissard de Marignac',
    uses: ['Atomic clocks (next-generation)', 'Stainless steel grain refining', 'Laser gain media'],
    everydayExamples:
      'The next generation of ultra-precise atomic clocks uses ytterbium ions trapped in optical lattices — accurate to one second over the age of the universe.',
  },
  71: {
    discoveredYear: 1907,
    discoveredBy: 'Georges Urbain & Carl Auer von Welsbach',
    uses: ['Petroleum cracking catalysts', 'PET-scan radiotracers', 'Stainless-steel alloys'],
    everydayExamples:
      'The last lanthanide. Mostly used as a catalyst in oil refineries — lutetium speeds up the cracking of crude oil into gasoline.',
  },
  72: {
    discoveredYear: 1923,
    discoveredBy: 'Dirk Coster & George de Hevesy',
    uses: [
      'Nuclear reactor control rods',
      'Plasma-cutter electrodes',
      'High-temperature alloys',
      'Computer-chip insulation layers',
    ],
    everydayExamples:
      'Modern computer chips (45nm and below) use a hafnium-oxide insulator under each transistor — Intel’s "high-k gate dielectric" breakthrough in 2007.',
  },
  73: {
    discoveredYear: 1802,
    discoveredBy: 'Anders Ekeberg',
    uses: [
      'Capacitors in every phone and laptop',
      'Surgical implants and pacemakers',
      'High-temperature jet-engine alloys',
    ],
    everydayExamples:
      'Every smartphone has hundreds of tantalum capacitors — they store and release tiny amounts of electricity faster than any other type. Body-friendly tantalum is also used for skull plates after head injuries.',
  },
  74: {
    discoveredYear: 1783,
    discoveredBy: 'Juan José Elhuyar & Fausto Elhuyar',
    uses: [
      'Light bulb filaments',
      'Drill bits and cutting tools (tungsten carbide)',
      'Armor-piercing projectiles',
      'Welding electrodes',
    ],
    everydayExamples:
      'Highest melting point of any metal (3422°C) — that’s why it’s the glowing filament in old incandescent bulbs. Tungsten carbide drill bits cut through concrete and steel.',
  },
  75: {
    discoveredYear: 1925,
    discoveredBy: 'Walter Noddack, Ida Tacke, Otto Berg',
    uses: [
      'Jet engine turbine blades',
      'Catalysts for high-octane gasoline',
      'Light filaments',
      'Tungsten-rhenium thermocouples',
    ],
    everydayExamples:
      'One of the rarest elements on Earth. Almost all of it gets alloyed into nickel-rhenium superalloys for the hottest, most-stressed parts of jet engines.',
  },
  76: {
    discoveredYear: 1803,
    discoveredBy: 'Smithson Tennant',
    uses: [
      'Fountain pen nib tips',
      'Electrical contacts that never wear out',
      'Hardener for platinum jewelry',
    ],
    everydayExamples:
      'The densest naturally-occurring element — twice as heavy as lead by volume. Hard tips on luxury fountain pen nibs are osmium-iridium so they never wear down.',
  },
  77: {
    discoveredYear: 1803,
    discoveredBy: 'Smithson Tennant',
    uses: [
      'Spark plug electrodes',
      'Pen nib tips',
      'Crucibles for melting quartz',
      'High-temperature thermocouples',
    ],
    everydayExamples:
      'The most corrosion-resistant metal known. A thin iridium layer in the boundary between sedimentary rock layers is the smoking-gun evidence that an asteroid killed the dinosaurs.',
  },
  78: {
    discoveredYear: 1735,
    discoveredBy: 'Antonio de Ulloa',
    uses: ['Catalytic converters', 'Jewelry', 'Cancer chemotherapy (cisplatin)', 'Lab crucibles'],
    everydayExamples:
      'Inside every car catalytic converter — the platinum splits pollutants apart before they reach the air. Rarer (and pricier) than gold.',
  },
  79: {
    discoveredYear: -4000,
    discoveredBy: ANTIQUITY,
    uses: [
      'Jewelry',
      'Electrical contacts (corrosion-proof)',
      'Dentistry',
      'Spacecraft heat shields',
    ],
    everydayExamples:
      'Civilization’s favorite metal for 6,000 years. Spacecraft windows are gold-coated to reflect infrared. Every smartphone has a few cents of gold on its circuit board.',
    isotopes: [
      {
        massNumber: 197,
        name: 'Gold-197',
        abundance: 100,
        halfLife: 'stable',
        note: 'The only natural gold isotope. All gold on Earth is this one.',
      },
    ],
    origin: {
      formation:
        "Forged in the most violent events in the universe — neutron-star mergers and the supernovae of very massive stars. The 'r-process' (rapid neutron capture) builds heavy elements like gold in seconds, then ejects them into space.",
      whereFound:
        "Mined from veins formed when hot fluids deposit gold inside cracks in rock. The Earth's crust has 4 ppb gold; most of the planet's gold sank into the core during formation and is unreachable.",
    },
    abundance: {
      crust: '~4 ppb (parts per billion)',
      universe: 'trace',
    },
  },
  80: {
    discoveredYear: -1500,
    discoveredBy: ANTIQUITY,
    uses: ['Thermometers (historically)', 'Fluorescent lamps', 'Dental amalgam', 'Mining for gold'],
    everydayExamples:
      'The only metal that’s liquid at room temperature. Old-school thermometers and fluorescent tubes contain a tiny amount.',
  },
  81: {
    discoveredYear: 1861,
    discoveredBy: 'William Crookes',
    uses: [
      'Rat poison (historically)',
      'Infrared optical glass',
      'High-temperature superconductors',
      'Medical isotope imaging',
    ],
    everydayExamples:
      'Famously poisonous — Agatha Christie used thallium poisoning in "The Pale Horse" and a real reader spotted the symptoms in a sick neighbour, saving their life.',
  },
  82: {
    discoveredYear: -7000,
    discoveredBy: ANTIQUITY,
    uses: ['Lead-acid car batteries', 'Radiation shielding', 'Bullets and shot', 'Roof flashing'],
    everydayExamples:
      'The heavy plates in every car battery. Dental X-ray techs drape a lead apron over you because lead blocks X-rays.',
  },
  83: {
    discoveredYear: 1753,
    discoveredBy: 'Claude François Geoffroy',
    uses: [
      'Pepto-Bismol (bismuth subsalicylate)',
      'Lead-free solder',
      'Cosmetics and pearlescent finishes',
      'Fire-sprinkler fusible links',
    ],
    everydayExamples:
      'The pink stuff in Pepto-Bismol is a bismuth compound — calms an upset stomach. Bismuth crystals also grow into stunning iridescent rainbow staircases.',
  },
  84: {
    discoveredYear: 1898,
    discoveredBy: 'Marie & Pierre Curie',
    uses: [
      'Anti-static brushes (historically)',
      'Heat sources for satellites',
      'Trigger for early nuclear weapons',
    ],
    everydayExamples:
      'Named after Poland (Marie Curie’s home country). Famously used to assassinate Russian dissident Alexander Litvinenko in 2006 — a microgram in a teapot was fatal.',
  },
  85: {
    discoveredYear: 1940,
    discoveredBy: 'Dale R. Corson, Kenneth Ross MacKenzie, Emilio Segrè',
    uses: ['Targeted alpha therapy for cancer (experimental)', 'Nuclear-physics research'],
    everydayExamples:
      'The rarest naturally-occurring element on Earth — at any given moment there is less than 30 grams of it in the entire planet’s crust. Decays so fast you can’t even hold a sample.',
  },
  86: {
    discoveredYear: 1900,
    discoveredBy: 'Friedrich Ernst Dorn',
    uses: ['Cancer radiation therapy (historically)', 'Earthquake prediction research'],
    everydayExamples:
      'A radioactive gas that seeps up from granite bedrock — the #2 cause of lung cancer after smoking. Home radon test kits are a $50 way to find out if your basement is safe.',
  },
  87: {
    discoveredYear: 1939,
    discoveredBy: 'Marguerite Perey',
    uses: ['Nuclear research', 'Cancer treatment research'],
    everydayExamples:
      'The least stable of the first 100 elements — at any moment there’s less than 30 grams in the entire planet’s crust. Named after France by its discoverer.',
  },
  88: {
    discoveredYear: 1898,
    discoveredBy: 'Marie & Pierre Curie',
    uses: [
      'Cancer radiotherapy (historically)',
      'Glow-in-the-dark paint (historically)',
      'Neutron sources',
    ],
    everydayExamples:
      'The "Radium Girls" who painted glowing watch dials in the 1920s got cancer from licking radium-tipped brushes to a fine point. The lawsuit they won established U.S. workers’ right to sue employers for occupational disease.',
  },
  89: {
    discoveredYear: 1899,
    discoveredBy: 'André-Louis Debierne',
    uses: ['Neutron sources for well-logging', 'Cancer alpha-radiation therapy (experimental)'],
    everydayExamples:
      'Gives off so much radiation it glows pale blue in the dark — the Cherenkov glow you see in spent-nuclear-fuel pools.',
  },
  90: {
    discoveredYear: 1828,
    discoveredBy: 'Jöns Jacob Berzelius',
    uses: [
      'Gas-lantern mantles (historically)',
      'High-temperature ceramics',
      'Future nuclear fuel (thorium reactors)',
    ],
    everydayExamples:
      'Camping lantern mantles used to be thorium-coated — slightly radioactive but harmless in normal use. Some scientists believe thorium-fueled reactors will eventually replace uranium ones.',
  },
  91: {
    discoveredYear: 1913,
    discoveredBy: 'Kasimir Fajans & Oswald Helmuth Göhring',
    uses: ['Nuclear physics research', 'No commercial uses'],
    everydayExamples:
      'One of the rarest natural elements — to extract a few grams the U.K. Atomic Energy Authority processed 60 tons of pitchblende. Almost no practical use today.',
  },
  92: {
    discoveredYear: 1789,
    discoveredBy: 'Martin Heinrich Klaproth',
    uses: [
      'Nuclear power reactors',
      'Nuclear weapons (historically)',
      'Glass tinting (uranium glass glows under UV)',
      'Radiometric dating',
    ],
    everydayExamples:
      'The heaviest naturally-occurring element. Fissioning a single uranium-235 atom releases enough energy to lift a textbook off the ground — multiply by trillions and you get a nuclear reactor.',
    isotopes: [
      {
        massNumber: 234,
        name: 'Uranium-234',
        abundance: 0.005,
        halfLife: '245,500 years',
        note: 'Trace isotope, part of the U-238 decay chain.',
      },
      {
        massNumber: 235,
        name: 'Uranium-235',
        abundance: 0.72,
        halfLife: '7.04 × 10⁸ years',
        note: 'Fissile — splits in a chain reaction. The fuel of nuclear reactors and the Hiroshima bomb.',
      },
      {
        massNumber: 238,
        name: 'Uranium-238',
        abundance: 99.27,
        halfLife: '4.47 × 10⁹ years',
        note: 'Not fissile but "fertile" — neutron capture turns it into plutonium-239 (which IS fissile). Used in tank armor and depleted-uranium munitions.',
      },
    ],
    origin: {
      formation:
        "Forged in neutron-star mergers and the supernovae of very massive stars (the r-process, same as gold but at the heavy end of what's possible). Every uranium atom predates the solar system.",
      whereFound:
        "Mined from ores like uraninite (UO₂) and pitchblende. The Earth's crust averages ~3 ppm uranium — more abundant than silver. Half of the planet's internal heat comes from radioactive decay of uranium, thorium, and potassium-40.",
    },
    abundance: {
      crust: '~2.7 ppm',
      oceans: '~3.3 ppb',
    },
  },
  93: {
    discoveredYear: 1940,
    discoveredBy: 'Edwin McMillan & Philip Abelson',
    uses: ['Neutron detectors', 'Nuclear research'],
    everydayExamples:
      'The first transuranium element ever synthesized — named after Neptune because uranium is named after Uranus and Neptune is the next planet out.',
  },
  94: {
    discoveredYear: 1940,
    discoveredBy: 'Glenn T. Seaborg and team',
    uses: [
      'Nuclear weapons',
      'Nuclear reactor fuel',
      'Pacemaker batteries (historically)',
      'Space-probe power sources',
    ],
    everydayExamples:
      'NASA’s Mars rovers and the Voyager probes run on plutonium-238 heat sources — they’re still powering instruments billions of miles from the Sun.',
  },
  95: {
    discoveredYear: 1944,
    discoveredBy: 'Glenn T. Seaborg, Leon Morgan, Ralph James, Albert Ghiorso',
    uses: ['Smoke detectors', 'Industrial gauges', 'Neutron sources'],
    everydayExamples:
      'The radioactive source inside almost every home smoke detector — about 0.3 micrograms of americium-241. It emits alpha particles that ionize the air; smoke disrupts the current and triggers the alarm.',
  },
  96: {
    discoveredYear: 1944,
    discoveredBy: 'Glenn T. Seaborg, Ralph James, Albert Ghiorso',
    uses: ['Mars rover alpha-particle X-ray spectrometers', 'Nuclear research'],
    everydayExamples:
      'Used in the spectrometers on Mars rovers (including Curiosity and Perseverance) to figure out the chemical composition of Martian rocks. Named after Marie and Pierre Curie.',
  },
  97: {
    discoveredYear: 1949,
    discoveredBy: 'Stanley G. Thompson, Albert Ghiorso, Glenn T. Seaborg, Kenneth Street',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after the University of California, Berkeley, where it was discovered. Has never been produced in usable quantities outside research labs.',
  },
  98: {
    discoveredYear: 1950,
    discoveredBy: 'Stanley G. Thompson, Kenneth Street, Albert Ghiorso, Glenn T. Seaborg',
    uses: [
      'Neutron sources for oil-well logging',
      'Cancer treatment (Cf-252)',
      'Airport-baggage neutron scanners',
    ],
    everydayExamples:
      'A few micrograms of californium-252 can act as a portable neutron source — used to scan luggage for explosives at airports.',
  },
  99: {
    discoveredYear: 1952,
    discoveredBy: 'Albert Ghiorso and team',
    uses: ['Nuclear research only'],
    everydayExamples:
      'First found in the radioactive fallout from the first hydrogen-bomb test in 1952 (Ivy Mike). Named in honor of Albert Einstein, who died three years after its discovery.',
  },
  100: {
    discoveredYear: 1952,
    discoveredBy: 'Albert Ghiorso and team',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Also discovered in Ivy Mike fallout. Named after Enrico Fermi, the architect of the first nuclear reactor.',
  },
  101: {
    discoveredYear: 1955,
    discoveredBy:
      'Glenn T. Seaborg, Albert Ghiorso, Bernard Harvey, Gregory Choppin, Stanley Thompson',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after Dmitri Mendeleev, who designed the periodic table — and who predicted gaps where elements would later be discovered.',
  },
  102: {
    discoveredYear: 1958,
    discoveredBy: 'Lawrence Berkeley National Laboratory team',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after Alfred Nobel. So unstable that only a few atoms at a time have ever been made — they decay before the next sample is ready.',
  },
  103: {
    discoveredYear: 1961,
    discoveredBy: 'Albert Ghiorso, Torbjørn Sikkeland, Almon Larsh, Robert M. Latimer',
    uses: ['Nuclear research only'],
    everydayExamples:
      'The last actinide. Named after Ernest Lawrence, inventor of the cyclotron — the particle accelerator that made the discovery of most transuranium elements possible.',
  },
  104: {
    discoveredYear: 1964,
    discoveredBy: 'Joint Institute for Nuclear Research (Dubna) & UC Berkeley',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after Ernest Rutherford, who discovered the atomic nucleus. The first of the "superheavy" elements, all entirely synthetic.',
  },
  105: {
    discoveredYear: 1968,
    discoveredBy: 'Joint Institute for Nuclear Research (Dubna) & UC Berkeley',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after the Russian town of Dubna, home of the Joint Institute for Nuclear Research. Half-life is measured in seconds.',
  },
  106: {
    discoveredYear: 1974,
    discoveredBy: 'Lawrence Berkeley National Laboratory & JINR',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after Glenn Seaborg — the only person to have an element named after them while still alive. Seaborg discovered or co-discovered 10 elements.',
  },
  107: {
    discoveredYear: 1981,
    discoveredBy: 'GSI Helmholtz Centre for Heavy Ion Research',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after physicist Niels Bohr. Lives for less than a minute before decaying — researchers had to detect just six atoms to confirm the discovery.',
  },
  108: {
    discoveredYear: 1984,
    discoveredBy: 'GSI Helmholtz Centre for Heavy Ion Research',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after the German state of Hesse, where the GSI lab is located. Predicted to be a transition metal similar to osmium.',
  },
  109: {
    discoveredYear: 1982,
    discoveredBy: 'GSI Helmholtz Centre for Heavy Ion Research',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after Lise Meitner, the physicist whose work on nuclear fission was overlooked when her colleague Otto Hahn won the Nobel Prize for it in 1944.',
  },
  110: {
    discoveredYear: 1994,
    discoveredBy: 'GSI Helmholtz Centre for Heavy Ion Research',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after the German city of Darmstadt, where the GSI Helmholtz Centre sits. The most stable isotope sticks around for ~14 seconds before decaying.',
  },
  111: {
    discoveredYear: 1994,
    discoveredBy: 'GSI Helmholtz Centre for Heavy Ion Research',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after Wilhelm Röntgen, who discovered X-rays in 1895. The IUPAC officially named the element in 2004 on the 100th anniversary of his Nobel Prize.',
  },
  112: {
    discoveredYear: 1996,
    discoveredBy: 'GSI Helmholtz Centre for Heavy Ion Research',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after Nicolaus Copernicus, the astronomer who realized Earth orbits the Sun. Predicted to be a liquid metal like mercury, but no one has ever had enough to check.',
  },
  113: {
    discoveredYear: 2003,
    discoveredBy: 'RIKEN (Japan)',
    uses: ['Nuclear research only'],
    everydayExamples:
      'The first element discovered in Asia. Named "Nihonium" from "Nihon" (Japan) — RIKEN scientists fused zinc and bismuth atoms to make it.',
  },
  114: {
    discoveredYear: 1998,
    discoveredBy: 'Joint Institute for Nuclear Research (Dubna)',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after physicist Georgy Flerov. Predicted to lie inside the "island of stability" — a region where superheavy elements might live for hours instead of milliseconds.',
  },
  115: {
    discoveredYear: 2003,
    discoveredBy: 'Joint Institute for Nuclear Research (Dubna)',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after the Moscow region in Russia. Famously claimed by UFO conspiracy theorist Bob Lazar in 1989 as the alien "Element 115" — long before the real element was synthesized.',
  },
  116: {
    discoveredYear: 2000,
    discoveredBy:
      'Joint Institute for Nuclear Research (Dubna) & Lawrence Livermore National Laboratory',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after Lawrence Livermore National Laboratory in California. The most stable isotope decays in about 60 milliseconds.',
  },
  117: {
    discoveredYear: 2009,
    discoveredBy:
      'Joint Institute for Nuclear Research (Dubna), Oak Ridge National Laboratory, and others',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after the state of Tennessee, home of Oak Ridge National Laboratory which produced the berkelium target used in the synthesis. The second-heaviest element ever made.',
  },
  118: {
    discoveredYear: 2002,
    discoveredBy:
      'Joint Institute for Nuclear Research (Dubna) & Lawrence Livermore National Laboratory',
    uses: ['Nuclear research only'],
    everydayExamples:
      'Named after Yuri Oganessian, who led the discovery of many superheavies. The heaviest element on the periodic table — only a handful of atoms have ever existed.',
  },
}

const EMPTY: ElementContent = {}

/**
 * Programmatic fallback origin story based on atomic number. Stellar
 * nucleosynthesis follows well-known phase rules — Big Bang for H/He,
 * cosmic-ray spallation for Li/Be/B, stellar fusion up through iron,
 * neutron-capture processes for the heavies, and lab synthesis past
 * Z=92. This means every element gets a non-empty answer when a
 * student is curious, even before someone writes an element-specific
 * description.
 *
 * The handful of elements above with an explicit `origin` in CONTENT
 * override this default.
 */
function defaultOrigin(Z: number): OriginInfo {
  if (Z === 1)
    return {
      formation: 'Formed in the first three minutes after the Big Bang — older than every star.',
      whereFound:
        "Almost all hydrogen is locked into water and organic molecules. Free H₂ leaks away because Earth's gravity is too weak to hold it.",
    }
  if (Z === 2)
    return {
      formation:
        'About 24% from Big Bang nucleosynthesis; the rest forged inside stars by hydrogen fusion.',
      whereFound:
        'Trapped in natural-gas pockets from billions of years of alpha decay underground. Non-renewable on Earth — what we vent into the air leaks to space.',
    }
  if (Z === 3)
    return {
      formation:
        'A trace amount formed in the Big Bang. Most lithium today was made by cosmic-ray spallation — high-energy particles fragmenting carbon and oxygen nuclei in interstellar space.',
      whereFound:
        'Mined from brine pools in salt flats (Chile, Australia) and from spodumene rock. Concentrated in granitic pegmatites.',
    }
  if (Z >= 4 && Z <= 5)
    return {
      formation:
        'Made by cosmic-ray spallation — high-energy cosmic rays hitting heavier nuclei (especially carbon and oxygen) and fragmenting them. Not produced in significant amounts by stellar fusion.',
      whereFound:
        'Concentrated by long geological cycles into specific mineral deposits — rarely found in pure form.',
    }
  if (Z >= 6 && Z <= 8)
    return {
      formation:
        'Forged inside red-giant stars: carbon by the triple-alpha process (three helium nuclei merging), then nitrogen and oxygen by successive helium captures and the CNO cycle.',
      whereFound:
        "Every atom in your body that isn't hydrogen came from inside a star. Carried into the interstellar medium by AGB-star winds and supernova ejecta.",
    }
  if (Z >= 9 && Z <= 20)
    return {
      formation:
        'Forged in massive stars by successive burning stages — neon burning, oxygen burning, silicon burning — each requiring hotter, denser conditions than the last. Ejected when those stars go supernova.',
      whereFound:
        "Concentrated by geological processes into specific ores or mineral deposits. Common in seawater and the Earth's crust as ions and oxides.",
    }
  if (Z >= 21 && Z <= 26)
    return {
      formation:
        'Built up in massive stars during silicon burning — the final stable fusion stage before the iron core collapses into a supernova. Iron is the end point: heavier elements consume rather than release energy when fused.',
      whereFound:
        "Earth's iron-rich core formed from these elements sinking during planetary differentiation. The crust still holds enough for ores at concentrated deposits.",
    }
  if (Z >= 27 && Z <= 41)
    return {
      formation:
        'Made by the s-process (slow neutron capture) inside AGB stars and the r-process (rapid neutron capture) in supernovae. The exact mix depends on neutron-density conditions where each isotope formed.',
      whereFound:
        'Concentrated in specific ore bodies through hydrothermal and magmatic processes. Often co-located with related transition metals.',
    }
  if (Z >= 42 && Z <= 56)
    return {
      formation:
        'Built primarily by the s-process in AGB stars (slow neutron capture over millennia) and the r-process in supernovae (seconds-long bursts of neutron capture). Distributed across the galaxy by stellar winds and explosions.',
      whereFound:
        'Mined from specific ore minerals, often as a byproduct of more abundant metal refining. Concentrations vary by region.',
    }
  if (Z >= 57 && Z <= 71)
    return {
      formation:
        'Forged primarily by the r-process in supernovae and neutron-star mergers. The lanthanide elements are chemically so similar that they often co-occur in the same ore minerals.',
      whereFound:
        "Despite the name 'rare earth', most lanthanides are more abundant than gold or silver in the crust. They're 'rare' only in the sense that they rarely concentrate into mineable deposits — usually scattered through other ores.",
    }
  if (Z >= 72 && Z <= 83)
    return {
      formation:
        'Forged by r-process nucleosynthesis in neutron-star mergers and the supernovae of massive stars. Every atom of these heavy elements predates the solar system.',
      whereFound:
        "Concentrated in specific hydrothermal ore deposits. Several (Re, Os, Ir, Pt) are among the rarest elements in the Earth's crust.",
    }
  if (Z >= 84 && Z <= 92)
    return {
      formation:
        "Forged primarily in neutron-star mergers via the r-process. The radioactive elements above bismuth would all have decayed away by now if they weren't continuously regenerated — uranium and thorium survive only because their half-lives match the age of Earth.",
      whereFound:
        "Mined from specific uranium / thorium ore bodies. Some (radon, polonium) exist only transiently as decay products. Half the Earth's internal heat comes from radioactive decay of these elements.",
    }
  // Z >= 93 — synthetic transuranics + transactinides.
  return {
    formation:
      'Synthetic — produced in nuclear reactors (neutron-rich isotopes) and heavy-ion accelerators (transactinides). Does not exist naturally on Earth in measurable quantities.',
    whereFound:
      'Only in physics laboratories. Trace amounts exist in spent nuclear-reactor fuel; individual atoms of the heaviest elements are detected one at a time after accelerator collisions.',
  }
}

export function getElementContent(Z: number): ElementContent {
  const explicit = CONTENT[Z] ?? EMPTY
  // Merge explicit content with a programmatic default-origin so every
  // element has a "where does this come from?" answer. Explicit always
  // wins; defaults fill in the gaps.
  return {
    ...explicit,
    origin: explicit.origin ?? defaultOrigin(Z),
  }
}
