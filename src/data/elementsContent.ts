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

export interface ElementContent {
  discoveredYear?: number
  discoveredBy?: string
  /** 3–6 short phrases for the Common Uses list. */
  uses?: string[]
  /** One short paragraph (1–3 sentences) for Everyday Examples. */
  everydayExamples?: string
}

const ANTIQUITY = 'Known since antiquity'

const CONTENT: Record<number, ElementContent> = {
  1: {
    discoveredYear: 1766,
    discoveredBy: 'Henry Cavendish',
    uses: ['Rocket fuel', 'Ammonia production', 'Fuel cells', 'Hydrogenating fats'],
    everydayExamples:
      'The most abundant element in the universe. Two hydrogen atoms bond with oxygen to make every drop of water you have ever drunk.',
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
  },
  8: {
    discoveredYear: 1774,
    discoveredBy: 'Carl Wilhelm Scheele & Joseph Priestley',
    uses: ['Breathing', 'Steelmaking', 'Rocket fuel oxidizer', 'Medical ventilators'],
    everydayExamples:
      'You inhale 11,000 liters of air containing this every day. Iron rusts because oxygen pulls electrons off the metal.',
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
  },
  13: {
    discoveredYear: 1825,
    discoveredBy: 'Hans Christian Ørsted',
    uses: ['Soda cans', 'Aircraft frames', 'Foil and cooking pans', 'Power transmission lines'],
    everydayExamples:
      'Most-used metal after iron. Light, cheap, and recyclable — your soda can today might be airplane skin next year.',
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
  },
  20: {
    discoveredYear: 1808,
    discoveredBy: 'Humphry Davy',
    uses: ['Bones and teeth', 'Cement and plaster', 'Eggshells', 'Antacids (TUMS)'],
    everydayExamples:
      'The reason your bones are strong and your teeth bite. Chalk, marble, and seashells are all calcium carbonate.',
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

export function getElementContent(Z: number): ElementContent {
  return CONTENT[Z] ?? EMPTY
}
