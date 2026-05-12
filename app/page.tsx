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
