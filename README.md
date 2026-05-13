# Molecular

A mobile-first 3D educational chemistry web app. Browse a curated molecule library, build atoms and molecules by drag-and-snap, and run reactions in a Lab mode with physics. AI tutor included.

Built with Next.js 16, react-three-fiber, Zustand, and Vercel AI Gateway.

## Local development

Requires Node 24 and pnpm 9.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

To enable the AI tutor locally, set `AI_GATEWAY_API_KEY` in `.env.local`. On Vercel, the Gateway is wired automatically once your project is linked.

## Scripts

| Command            | What it does                              |
|--------------------|-------------------------------------------|
| `pnpm dev`         | Start the dev server with Turbopack       |
| `pnpm build`       | Production build                          |
| `pnpm start`       | Run the production build                  |
| `pnpm lint`        | Biome lint + format check                 |
| `pnpm lint:fix`    | Auto-fix Biome issues                     |
| `pnpm typecheck`   | TypeScript with `--noEmit`                |
| `pnpm test`        | Vitest unit tests                         |
| `pnpm test:e2e`    | Playwright end-to-end tests               |

## Architecture

See [DESIGN.md](./DESIGN.md) for the complete spec. Short version:

- **`src/chem/`** — periodic table data, bonding rules, VSEPR geometry, reactions, scene validation. Pure TypeScript, no DOM.
- **`src/scene/`** — react-three-fiber components: `<Scene>`, `<Atom>`, `<Bond>`, `<Molecule>`, `<DragGhost>`, `<AttachPoints>`.
- **`src/store/`** — Zustand slices: scene, ui, build, lab, tutor.
- **`src/ui/`** — 2D UI shells (mobile-first), built on shadcn/ui.
- **`src/landing/`** — homepage hero + autonomous reaction reel.
- **`src/demo/`** — teacher-led step-by-step demonstrations.
- **`src/data/`** — curated molecule library + named-molecule lookup.
- **`app/`** — Next.js App Router. `/` is the landing page, `/app` is the interactive app, `/demo` is the demonstrations index, `/s/[hash]` loads a shared scene.

## Tests

Unit tests (Vitest) cover the chem engine exhaustively. End-to-end tests (Playwright) cover:

1. Landing page renders and CTA navigates
2. Library spawn from `/app`
3. Build mode attach-point flow
4. Lab mode reaction
5. Share-link roundtrip

All tests run on `mobile-chrome` (Pixel 7 emulation) **and** `desktop-chrome`. Mobile is the primary target.

## License

MIT. See `LICENSE`.
