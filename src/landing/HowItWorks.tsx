interface Step {
  n: number
  title: string
  body: string
  /** Public-folder background image — anchored to the right edge of the
   *  card so the text on the left stays readable. A left-to-right
   *  gradient overlay handles the contrast fade. */
  image: string
  /** Color for the step number — picks a palette accent that matches
   *  the image's vibe in the rest of the app. */
  numberColor: string
}

const STEPS: Step[] = [
  {
    n: 1,
    title: 'Pick an atom',
    body: 'Tap the periodic table. The element comes alive on your cursor.',
    image: '/step1.jpg',
    numberColor: '#5cc6ff',
  },
  {
    n: 2,
    title: 'Snap a bond',
    body: 'Drop it on a glowing dot. The chemistry engine handles the geometry.',
    image: '/step2.jpg',
    numberColor: '#ec59b6',
  },
  {
    n: 3,
    title: 'See what happens',
    body: "Validity bar names what you've made. The AI tutor explains the why.",
    image: '/step3.jpg',
    numberColor: '#ffd97a',
  },
]

export function HowItWorks() {
  return (
    <section className="px-6 py-16 md:px-12 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-10 font-extrabold text-3xl uppercase tracking-tight md:text-5xl">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
            }}
          >
            How it works
          </span>
        </h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="relative flex min-h-[220px] flex-col justify-end gap-3 overflow-hidden rounded-xl border border-[#2a2655] bg-[#0d0a22]/40 p-6"
            >
              {/* Background image — anchored to the right edge, sized to
                fill the card height. Behind the text + gradient overlay. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: `url(${s.image})`,
                  backgroundPosition: 'right center',
                  backgroundSize: 'auto 100%',
                  backgroundRepeat: 'no-repeat',
                }}
              />
              {/* Left-to-right fade so the step text on the left stays
                readable while the image still reads clearly on the right. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to right, rgba(13,10,34,0.95) 0%, rgba(13,10,34,0.7) 35%, rgba(13,10,34,0.25) 65%, transparent 100%)',
                }}
              />
              {/* Content sits above both background layers. Heavy blurred
                black text-shadows on every line so the copy stays
                readable against the brighter parts of the photos that
                show through the gradient overlay. */}
              <div className="relative z-10 flex flex-col gap-2">
                <div
                  className="font-extrabold text-4xl leading-none"
                  style={{
                    color: s.numberColor,
                    textShadow: '0 0 24px rgba(0, 0, 0, 0.95), 0 2px 6px rgba(0, 0, 0, 0.9)',
                  }}
                >
                  {s.n}
                </div>
                <h3
                  className="font-bold text-[#dffaff] text-lg"
                  style={{
                    textShadow: '0 0 18px rgba(0, 0, 0, 0.95), 0 2px 6px rgba(0, 0, 0, 0.9)',
                  }}
                >
                  {s.title}
                </h3>
                <p
                  className="text-[#dffaff] text-sm"
                  style={{
                    textShadow: '0 0 16px rgba(0, 0, 0, 0.95), 0 1px 4px rgba(0, 0, 0, 0.9)',
                  }}
                >
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
