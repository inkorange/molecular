const STEPS = [
  {
    n: 1,
    title: 'Pick an atom',
    body: 'Tap the periodic table. The element comes alive on your cursor.',
  },
  {
    n: 2,
    title: 'Snap a bond',
    body: 'Drop it on a glowing dot. The chemistry engine handles the geometry.',
  },
  {
    n: 3,
    title: 'See what happens',
    body: "Validity bar names what you've made. The AI tutor explains the why.",
  },
]

export function HowItWorks() {
  return (
    <section className="px-6 py-16 md:px-12 md:py-24">
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
          <li key={s.n} className="rounded-xl border border-[#2a2655] bg-[#0d0a22]/40 p-6">
            <div className="mb-3 font-extrabold text-4xl text-[#5cc6ff]">{s.n}</div>
            <h3 className="font-bold text-[#dffaff] text-lg">{s.title}</h3>
            <p className="mt-2 text-[#9aa0c8] text-sm">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
