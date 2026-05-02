# Shipping

A static, single-page React app for visualizing and managing the social network of a D&D
campaign. Track PCs, NPCs, factions, and relationships as a graph or table; degrade
relationships over time; and propagate ripples through faction allegiances.

See [`docs/design.md`](docs/design.md) for the full design specification.

## Stack

- Vite 5 + React 18 + TypeScript
- Tailwind CSS + Radix UI Primitives
- `@xyflow/react` (React Flow) + `d3-force` for the graph view
- TanStack Table for tabular views
- Zustand + Immer for state, Zod for schemas/validation
- Vitest + React Testing Library for tests

## Local development

Requires Node 20 (see `.nvmrc`) and pnpm.

```bash
pnpm install
pnpm dev
```

Then open http://localhost:5173/shipping/.

### Run tests

```bash
pnpm test:run
```

### Build for production

```bash
pnpm build
```

The build output goes to `dist/` and expects to be served from `/shipping/` (configured in
`vite.config.ts` for GitHub Pages).

## Docker

```bash
docker compose up
```

Hot-reload is enabled inside the container.

## Deployment

Pushes to `main` automatically build and deploy to GitHub Pages via
`.github/workflows/deploy.yml`. In the repo's GitHub settings, set Pages source to
"GitHub Actions".

## Data

- All campaign data is in-browser only. There is no backend.
- State is autosaved to `localStorage` (debounced) and restored on next visit.
- Use **Export** in the top bar to download the campaign as JSON; use **Import** to
  restore it later.
- A bundled `public/sample-data.json` loads on first visit if no saved state exists.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `g` / `t` / `f` / `s` | Switch to Graph / Table / Factions / Settings |
| `n` | New character |
| `r` | New relationship |
| `i` / `e` | Import / Export |
| `d` | Degrade all |
