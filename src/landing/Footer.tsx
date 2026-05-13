export function Footer() {
  return (
    <footer className="border-[#2a2655] border-t px-6 py-8 text-[#6a6f95] text-xs md:px-12">
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
