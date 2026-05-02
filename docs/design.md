# Shipping — Detailed Design Document

> This document expands [`docs/init.md`](./init.md) into a full, actionable specification. Items marked **[Default]** are assumed decisions; they are easy to flip before implementation begins.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack & Tooling](#tech-stack--tooling)
3. [Domain Model](#domain-model)
4. [Relationship Value Bands](#relationship-value-bands)
5. [App Shell & Navigation](#app-shell--navigation)
6. [Graph View](#graph-view)
7. [Table View](#table-view)
8. [Degrade-All Button](#degrade-all-button)
9. [Factions & Affinity Propagation](#factions--affinity-propagation)
10. [Import / Export & Persistence](#import--export--persistence)
11. [Sample Data](#sample-data)
12. [Project Layout](#project-layout)
13. [CI/CD to GitHub Pages](#cicd-to-github-pages)
14. [Local Docker Development](#local-docker-development)
15. [Accessibility, Keyboard Shortcuts & Theming](#accessibility-keyboard-shortcuts--theming)
16. [Testing Strategy](#testing-strategy)
17. [Assumptions & Defaults Log](#assumptions--defaults-log)

---

## Overview

**Shipping** is a static, single-page React application hosted on GitHub Pages. It lets a Dungeon Master (or players) visualize and manage the social network of a D&D campaign: which PCs know which NPCs, how those relationships have evolved over time, and how faction loyalties ripple through the whole network.

There is no backend and no authentication. All campaign state lives in a downloadable JSON file that can be re-imported in a future session. A `localStorage` autosave provides crash protection during a session.

---

## Tech Stack & Tooling

| Concern | Choice | Notes |
|---|---|---|
| Runtime bundler | **Vite 5** | Fast HMR; `base` config needed for GitHub Pages sub-path |
| UI framework | **React 18** + TypeScript | Concurrent features, RSC-free (static site) |
| Package manager | **pnpm** | Workspace-ready; lockfile committed |
| Styling | **Tailwind CSS v3** + **Radix UI Primitives** | Tailwind for layout/tokens; Radix for accessible unstyled components; a thin `components/ui/*` wrapper layer owns the visual skin |
| Graph rendering | **`@xyflow/react` (React Flow v12)** | Editable nodes/edges, custom edge labels, built-in minimap + controls; force layout via `d3-force` |
| Tables | **TanStack Table v8** + **TanStack Virtual** | Sort/filter/inline-edit; virtualised rows for large datasets |
| State management | **Zustand** with **Immer** middleware | Single store, immer for mutation-style reducers, persistence middleware for `localStorage` |
| Schema/validation | **Zod** | Single source of truth for data shapes; TS types inferred via `z.infer<>` |
| Client-side routing | **Hash-based** (`#/graph`, `#/table`, `#/factions`, `#/settings`) | No server rewrite needed on GitHub Pages |
| Lint | ESLint + `@typescript-eslint` + `eslint-plugin-react-hooks` | Strict TS config |
| Format | **Prettier** | Auto-format on save |
| Unit / component tests | **Vitest** + **React Testing Library** | Co-located `*.test.ts(x)` files |
| E2E tests | **Playwright** (smoke only) | One test: import → edit → export round-trip |
| Node version | **20 LTS** | `.nvmrc` + `Dockerfile` pinned |

---

## Domain Model

All entities are keyed by stable **UUID v4** strings generated client-side on creation. The full in-memory state is described by `AppState`.

### `AppState`

```ts
{
  schemaVersion: number;       // bump on breaking changes; used by migration logic
  meta: {
    campaignName: string;
    lastSavedAt: string;       // ISO 8601
  };
  characters: Record<string, Character>;
  relationships: Record<string, Relationship>;
  factions: Record<string, Faction>;
  factionEdges: Record<string, FactionEdge>;
  settings: Settings;
}
```

### `Character` (discriminated union on `kind`)

```ts
type PC = {
  id: string;
  kind: "pc";
  firstName: string;
  lastName: string;
  class: string;               // e.g. "Fighter", "Wizard", free text
  notes: string;
  factionIds: string[];
  graphPosition?: { x: number; y: number };  // persisted node position
};

type NPC = {
  id: string;
  kind: "npc";
  firstName: string;
  lastName: string;
  location: string;            // current location / home base
  notes: string;
  factionIds: string[];
  graphPosition?: { x: number; y: number };
};

type Character = PC | NPC;
```

### `Relationship` (symmetric)

```ts
type Relationship = {
  id: string;                  // deterministic: `${min(a,b)}::${max(a,b)}`
  a: string;                   // character id
  b: string;                   // character id
  value: number;               // signed integer; see bands below
  notes: string;
  history: Adjustment[];
};
```

The deterministic ID prevents duplicate edges for the same pair and makes the symmetric constraint self-enforcing.

### `Adjustment`

```ts
type Adjustment = {
  at: string;                  // ISO 8601 timestamp
  delta: number;               // signed delta applied in this adjustment
  valueBefore: number;         // value before this adjustment
  valueAfter: number;          // value after this adjustment
  reason:
    | "manual-edit"
    | "degrade-all"
    | `faction:${string}`;     // e.g. "faction:Crown Loyalists"
};
```

### `Faction`

```ts
type Faction = {
  id: string;
  name: string;
  description: string;
  color: string;               // hex color; used for node ring and table chip
};
```

### `FactionEdge` (symmetric)

```ts
type FactionEdge = {
  id: string;                  // deterministic: `${min(a,b)}::${max(a,b)}`
  a: string;                   // faction id
  b: string;                   // faction id
  affinity: number;            // signed integer; [Default] range -3..+3
};
```

Positive `affinity` = allies; negative = rivals. Zero is stored only when explicitly set (a missing edge is also treated as zero).

### `Settings`

```ts
type Settings = {
  bands: Band[];               // ordered positive thresholds; mirrored for negatives
  degrade: {
    amount: number;            // [Default] 1 — subtracted per degrade-all invocation
  };
  propagation: {
    enabled: boolean;          // [Default] true
    nudgePerAffinityPoint: number; // [Default] 2
    triggerOnBand: string;     // [Default] "Friends" — band at-or-above triggers befriend logic
    confirmBeforeApply: boolean;   // [Default] true
  };
  localStorage: {
    autosave: boolean;         // [Default] true
  };
  theme: "system" | "light" | "dark"; // [Default] "system"
};
```

---

## Relationship Value Bands

Bands are **mirrored** across zero. Positive and negative sides share the same threshold magnitude. A `value` of 0 is "Strangers".

| value | Band name | [Default] color token |
|---|---|---|
| ≥ 20 | Close Allies | `emerald-500` |
| 10 – 19 | Friends | `green-400` |
| 1 – 9 | Acquaintances | `lime-300` |
| 0 | Strangers | `slate-400` |
| −1 to −9 | Unfriendly | `amber-400` |
| −10 to −19 | Enemies | `orange-500` |
| ≤ −20 | Nemeses | `red-600` |

Bands are configurable in Settings: the user edits the positive thresholds and names; the negative mirror is computed automatically. Color tokens are also user-editable per band.

---

## App Shell & Navigation

```
┌──────────────────────────────────────────────────────┐
│  Shipping           [Campaign name]     [⬆ Import]   │
│                                         [⬇ Export]   │
│                                         [☀️ Theme]    │
├──────────┬──────────┬──────────┬────────────────────-┤
│  Graph   │  Table   │ Factions │  Settings            │
├──────────┴──────────┴──────────┴────────────────────-┤
│                                                       │
│  (active tab content)                                 │
│                                                       │
├──────────────────────────────────────────────────────┤
│  [+ Character]  [+ NPC]  [+ Relationship]  [⏳ Degrade All]  │
└──────────────────────────────────────────────────────┘
```

- Top bar: app name, campaign name (inline-editable), import/export/theme controls.
- Tab bar: Graph / Table / Factions / Settings.
- Bottom action bar: always visible, context-aware ("+ Relationship" creates a relationship between the two most-recently selected nodes in Graph view, or opens a picker in other views).

---

## Graph View

### Nodes

| Character kind | Shape | Visual indicators |
|---|---|---|
| PC | Rounded rectangle | Solid fill, player icon |
| NPC | Circle | Outlined, NPC icon |

- Faction membership displayed as a **colored ring segment** around the node border. Multiple factions = equal arc segments, each in the faction's color.
- Node label: `FirstName LastName` (full name) with `(Class)` on the second line for PCs; `(Location)` for NPCs.
- **Selected** state: thick border + subtle glow.
- **Isolated** state (no edges): dimmed.

### Edges

- Width: scales linearly with `|value|`. `|value| = 0` renders as a dashed thin line.
- Color: band color (see table above).
- Label: displays numeric `value` in a small pill.
- Curved where two characters share more than one edge (not currently possible, but guard-railed).

### Node Hover Card

Appears on hover (300 ms delay), dismissed on mouse-leave:

```
┌─────────────────────────────────────────┐
│  Aldric Voss  ·  Fighter  (PC)          │
│  Factions: Crown Loyalists              │
│  Notes: "Party's de-facto face…"        │
├─────────────────────────────────────────┤
│  Close Allies (2):  Mira, Sister Tael   │
│  Friends (1):  Kren                     │
│  Acquaintances (3): ...                 │
│  Enemies (1):  Lord Harwick             │
├─────────────────────────────────────────┤
│  Recent changes:                        │
│  −1  degrade-all  2026-04-12            │
│  +5  manual-edit  2026-04-08            │
└─────────────────────────────────────────┘
```

### Edge Hover Popover

Appears on hover of an edge label or edge path:

```
┌─────────────────────────────────────────┐
│  Aldric ↔ Mira                         │
│  Value:  [slider ─●──────]  22          │
│  Band:   Close Allies  ●               │
│  Notes:  "Saved each other…"            │
│  [Edit full details]                    │
└─────────────────────────────────────────┘
```

- Slider and numeric input are directly editable; debounced commit to store on mouse-up/blur.
- "Edit full details" opens the `RelationshipEditor` modal (full history, notes, manual adjustment).

### Toolbar

```
[Pointer] [Add Link] | [Auto-layout] [Fit View] | [Minimap ☑] [Show Labels ☑]
```

- **Add Link mode**: cursor changes to crosshair; click first node (highlighted), click second node → creates a `Relationship` at `value: 0` and opens the editor modal.
- **Auto-layout**: runs `d3-force` simulation; persists resulting positions to `graphPosition` fields.
- Node positions are saved to the store on drag-end.

---

## Table View

Four sub-tabs inside the Table view:

### Characters sub-tab

Columns: Kind | Name | Class/Location | Factions | Notes | Actions

- Kind filter: All / PC / NPC.
- Inline-edit: all text fields except Notes (modal).
- Actions: Edit (modal), Delete (confirm), Open in graph (zooms/selects node).

### Relationships sub-tab

Columns: Character A | Character B | Value | Band | Last Change | Notes | Actions

- Sortable by any column.
- Band column shows a color chip.
- Last Change: shows `delta` and `at` from most recent `Adjustment`.
- Actions: Edit (modal, shows full history), Delete (confirm), Open in graph.

### Factions sub-tab

Columns: Name | Color | Members (PC count / NPC count) | Description | Actions

- Actions: Edit (modal), Delete (confirm — warns if characters have this faction assigned).
- Inline-edit: name, color picker.

### Faction Affinity sub-tab

Displays a matrix or edge list of `FactionEdge` entries.

Matrix view (default for ≤ 8 factions):

```
             Crown  Sylvan  Smugglers
Crown           —    +2       −2
Sylvan         +2     —       −1
Smugglers      −2    −1        —
```

- Click a cell to edit the affinity value (numeric input, range -3..+3 **[Default]**).
- Edge-list view available as a toggle for larger faction counts.

---

## Degrade-All Button

Located in the always-visible bottom action bar.

**Flow:**

1. User clicks "⏳ Degrade All".
2. A confirmation modal opens:
   - Title: "Time Passes…"
   - Body: "Decrease all `N` relationships by `[amount]` toward neutral? Relationships already at 0 will not change."
   - The `amount` field is editable inline (defaults to `Settings.degrade.amount`; does **not** change the stored setting — use Settings to change the permanent default).
3. User clicks Confirm.
4. For every `Relationship` where `value ≠ 0`:
   - `delta = -sign(value) * min(|value|, amount)` (never crosses zero)
   - `value += delta`
   - Append an `Adjustment { at, delta, valueBefore, valueAfter, reason: "degrade-all" }`.
5. Toast notification: "Degraded N relationships."

---

## Factions & Affinity Propagation

### Character–Faction Membership

Characters can belong to zero or more factions. Faction IDs are stored in `Character.factionIds`. A character with no faction IDs is shown with a grey ring.

### FactionEdge Semantics

A `FactionEdge` between factions A and B with `affinity = f` means:

- `f > 0`: A and B are allies (positive ripple).
- `f < 0`: A and B are rivals (negative ripple).
- `|f|` is the magnitude; maximum **[Default]** ±3.

### Propagation Algorithm

Triggered when a `Relationship` value crosses the configured `triggerOnBand` threshold (default: the `Friends` band lower boundary = 10, and the `Enemies` band upper boundary = −10).

```
function propagate(changedEdge: Relationship, newValue: number, store: AppState):
  ProposedAdjustment[]

  let proposals: ProposedAdjustment[] = []
  let triggerSign = sign(newValue)  // +1 or -1

  // characters involved
  let charA = store.characters[changedEdge.a]
  let charB = store.characters[changedEdge.b]

  // for each party in the changed edge (both A and B)
  for each char in [charA, charB]:
    let otherChar = the other character in the edge

    // for each faction this char belongs to
    for each factionId in char.factionIds:
      // find faction edges from this faction
      for each fe in store.factionEdges where fe involves factionId:
        let linkedFactionId = the other faction in fe
        let f = fe.affinity

        // for each character in the linked faction (excluding people already in this edge)
        for each linkedChar in store.characters where linkedFactionId in linkedChar.factionIds
          and linkedChar.id ∉ {changedEdge.a, changedEdge.b}:

          // find or create the relationship between otherChar and linkedChar
          let relId = deterministicId(otherChar.id, linkedChar.id)
          let currentValue = store.relationships[relId]?.value ?? 0

          let delta = triggerSign * f * settings.propagation.nudgePerAffinityPoint
          proposals.push({ relId, otherChar, linkedChar, delta, currentValue,
                           reason: `faction:${factionName(linkedFactionId)}` })

  return deduplicate(proposals)  // merge duplicate relId proposals by summing deltas
```

### Confirmation Modal

When `Settings.propagation.confirmBeforeApply` is true (default), the proposals are shown before application:

```
┌──────────────────────────────────────────────────────────┐
│  Faction Ripple Preview                                  │
│  Aldric befriended Sister Tael (Crown Loyalists)         │
├──────────────────────────────────────────────────────────┤
│  ☑ Aldric ↔ Elara Sylvan   +4  (Strangers → Acquaint.)  │
│  ☑ Aldric ↔ Branwen Sylvan +4  (Unfriendly → Strangers) │
│  ☑ Aldric ↔ Dax Smuggler   −4  (Friends → Acquaint.)    │
├──────────────────────────────────────────────────────────┤
│                          [Cancel]  [Apply Selected (3)]  │
└──────────────────────────────────────────────────────────┘
```

Each row is individually checkable. "Apply Selected" commits only the checked deltas, recording an `Adjustment` per applied change.

### PC-Faction Propagation

The same algorithm handles PC-to-PC ripple. If PC Aldric (Crown Loyalist) becomes close allies with PC Renna (Sylvan Court), and Crown ↔ Sylvan = +2, the other NPCs/PCs in the Sylvan Court get a positive nudge to their relationship with Aldric.

### Display of Propagation Effects

Propagation-sourced adjustments appear in:
- Node hover card "Recent changes" list (reason shows faction name).
- Relationship editor history table.
- Table view "Last Change" column (most recent `Adjustment`).

---

## Import / Export & Persistence

### Export

- Button in top bar: "⬇ Export JSON".
- Serialises the full `AppState` to a JSON file with `Content-Disposition: attachment; filename="shipping-<campaignName>-<date>.json"`.
- The schema version is embedded in the export.

### Import

- Button in top bar: "⬆ Import JSON".
- Opens a file picker (`.json`).
- Parses and **Zod-validates** the payload.
- If `schemaVersion` is older than the current app version, runs registered migration functions in order.
- Confirms overwrite if current state is non-empty (shows character/relationship counts for both current and incoming).
- On confirmation, replaces the full `AppState`.

### Other Persistence Actions

| Button | Behaviour |
|---|---|
| Load sample data | Overwrites state with the bundled `public/sample-data.json` (confirms first if state non-empty) |
| Clear all | Resets to empty state after confirmation |

### `localStorage` Autosave

- On every Zustand store mutation, a debounced (500 ms) write serialises `AppState` to `localStorage` key `shipping:state`.
- On app start, if `shipping:state` exists, it is Zod-validated and loaded (bypassing the sample data load).
- Autosave can be disabled in Settings; when disabled, a banner reminds the user to export manually.

### Schema Migration

`schemaVersion` is an integer. A `migrations` map registers functions:

```ts
migrations: Record<number, (oldState: unknown) => AppState>
```

On import (or on `localStorage` load), if `schemaVersion < CURRENT_VERSION`, run migrations `schemaVersion+1` … `CURRENT_VERSION` in order.

---

## Sample Data

Shipped as `public/sample-data.json`. Loaded on first visit (no `localStorage` key present).

### Factions

| Faction | Color |
|---|---|
| Crown Loyalists | `#d4a017` (gold) |
| Smugglers' Cove | `#2a9d8f` (teal) |
| Sylvan Court | `#52b788` (green) |

Faction edges:

| A | B | Affinity |
|---|---|---|
| Crown Loyalists | Sylvan Court | +2 |
| Crown Loyalists | Smugglers' Cove | −2 |
| Sylvan Court | Smugglers' Cove | −1 |

### PCs (4)

| Name | Class | Factions |
|---|---|---|
| Aldric Voss | Fighter | Crown Loyalists |
| Mira Ashvale | Wizard | Sylvan Court |
| Jasper Crowe | Rogue | Smugglers' Cove |
| Sera Dawnmist | Cleric | (none) |

### NPCs (~10)

| Name | Location | Factions |
|---|---|---|
| Lady Castren | Irongate | Crown Loyalists |
| Commander Rael | Irongate | Crown Loyalists |
| Sister Tael | Temple District | Crown Loyalists |
| Elara Sylvan | Sylvan Glade | Sylvan Court |
| Branwen Thornwood | Sylvan Glade | Sylvan Court |
| Dax Harrow | Smugglers' Cove | Smugglers' Cove |
| Marta Veil | The Docks | Smugglers' Cove |
| Kren the Blacksmith | Market District | (none) |
| Lord Harwick | Throne City | Crown Loyalists |
| The Archivist | Grand Library | Sylvan Court, Crown Loyalists |

### Relationships

A spread covering all bands, so the graph is visually informative on first load (a mix of Close Allies, Friends, Acquaintances, Strangers, Unfriendly, Enemies, and at least one Nemeses pair).

---

## Project Layout

```
shipping/
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI: build + deploy to GitHub Pages
├── .nvmrc                        # node 20
├── Dockerfile                    # local dev image
├── docker-compose.yml            # maps :5173, hot-reload volume
├── index.html                    # Vite entry point
├── vite.config.ts                # base: '/shipping/' for GitHub Pages
├── tailwind.config.ts
├── postcss.config.cjs
├── tsconfig.json
├── tsconfig.node.json
├── package.json
├── pnpm-lock.yaml
├── .prettierrc
├── .eslintrc.cjs
├── public/
│   └── sample-data.json
├── src/
│   ├── main.tsx                  # React root, router
│   ├── App.tsx                   # AppShell + tab routing
│   ├── types/
│   │   └── schema.ts             # Zod schemas + z.infer<> TS types
│   ├── state/
│   │   ├── store.ts              # Zustand store definition
│   │   ├── mutations.ts          # All state mutation functions
│   │   ├── selectors.ts          # Derived data selectors
│   │   └── persistence.ts        # localStorage read/write + debounce
│   ├── domain/
│   │   ├── bands.ts              # valueToBand(), bandColor()
│   │   ├── degrade.ts            # computeDegradeDeltas()
│   │   ├── propagation.ts        # computePropagationProposals()
│   │   └── ids.ts                # deterministicRelationshipId()
│   ├── migrations/
│   │   └── index.ts              # migrate(state, fromVersion): AppState
│   ├── io/
│   │   ├── export.ts             # serializeState()
│   │   └── import.ts             # parseAndValidate(), applyMigrations()
│   ├── components/
│   │   ├── AppShell.tsx          # Header, tab bar, footer action bar
│   │   ├── Tabs.tsx              # Tab switcher
│   │   ├── graph/
│   │   │   ├── GraphView.tsx     # React Flow canvas
│   │   │   ├── CharacterNode.tsx # Custom PC/NPC node
│   │   │   ├── RelationshipEdge.tsx  # Custom edge with value pill
│   │   │   ├── NodeHoverCard.tsx # Hover floating card
│   │   │   └── EdgePopover.tsx   # Hover edge popover with inline edit
│   │   ├── table/
│   │   │   ├── CharactersTable.tsx
│   │   │   ├── RelationshipsTable.tsx
│   │   │   ├── FactionsTable.tsx
│   │   │   └── FactionAffinityTable.tsx
│   │   ├── editors/
│   │   │   ├── CharacterEditor.tsx
│   │   │   ├── RelationshipEditor.tsx  # includes full adjustment history
│   │   │   └── FactionEditor.tsx
│   │   ├── modals/
│   │   │   ├── DegradeConfirmModal.tsx
│   │   │   ├── PropagationPreviewModal.tsx
│   │   │   └── ImportConfirmModal.tsx
│   │   ├── DegradeButton.tsx
│   │   ├── ImportExportButtons.tsx
│   │   ├── Settings.tsx          # Band editor, degrade config, propagation config
│   │   ├── BandChip.tsx          # Colored band badge used across views
│   │   └── ui/                   # Radix primitive wrappers (Button, Dialog, Popover, etc.)
│   └── hooks/
│       ├── useGraphLayout.ts     # d3-force auto-layout
│       └── useDebouncedPersist.ts
├── tests/
│   ├── unit/
│   │   ├── bands.test.ts
│   │   ├── degrade.test.ts
│   │   ├── propagation.test.ts
│   │   └── io.test.ts            # Zod round-trip
│   ├── component/
│   │   ├── CharacterEditor.test.tsx
│   │   ├── DegradeButton.test.tsx
│   │   └── RelationshipEditor.test.tsx
│   └── e2e/
│       └── smoke.spec.ts         # Playwright: import→edit→export
└── docs/
    ├── init.md
    └── design.md                 # this file
```

---

## CI/CD to GitHub Pages

### `vite.config.ts` base

```ts
export default defineConfig({
  base: '/shipping/',
  // ...
})
```

The `base` makes all asset URLs work under the GitHub Pages sub-path `/shipping/`.

### `deploy.yml` workflow

Trigger: push to `main`.

Steps:
1. `actions/checkout@v4`
2. `pnpm/action-setup@v4` with `run_install: false`
3. `actions/setup-node@v4` (node 20, cache: pnpm)
4. `pnpm install --frozen-lockfile`
5. `pnpm test --run` (Vitest unit + component)
6. `pnpm build`
7. `actions/upload-pages-artifact@v3` (path: `dist/`)
8. `actions/deploy-pages@v4`

The workflow needs `permissions: pages: write` and `id-token: write`.

**One-time manual step**: in the GitHub repo Settings → Pages, set the source to "GitHub Actions".

### Branch protection (recommended)

Require CI to pass on `main` before merge. Playwright E2E is run only on PRs to avoid adding deploy time to every push.

---

## Local Docker Development

### `Dockerfile`

```dockerfile
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
```

### `docker-compose.yml`

```yaml
services:
  app:
    build: .
    ports:
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules   # anonymous volume shadows host node_modules
    environment:
      - CHOKIDAR_USEPOLLING=true  # required for reliable HMR inside Docker on macOS
```

Run with `docker compose up`. Hot-module reload is available. Node modules are isolated in the container.

---

## Accessibility, Keyboard Shortcuts & Theming

### Accessibility

- All interactive components use **Radix UI Primitives**, which provide `role`, `aria-*`, and keyboard navigation out of the box.
- Focus-visible ring on all focusable elements.
- Color is never the sole carrier of information (band labels always present alongside color chips).
- Graph view: nodes and edges are keyboard-navigable (React Flow built-in); hover cards are also triggered on focus.

### Keyboard Shortcuts

Global (not active when a text input is focused):

| Key | Action |
|---|---|
| `g` | Switch to Graph tab |
| `t` | Switch to Table tab |
| `f` | Switch to Factions tab |
| `s` | Switch to Settings tab |
| `n` | Open new Character modal |
| `r` | Open new Relationship modal |
| `i` | Trigger Import file picker |
| `e` | Trigger Export |
| `d` | Open Degrade-All confirm modal |
| `?` | Show keyboard shortcut reference |
| `Escape` | Close any open modal / popover |

### Theming

- Light/dark mode via Tailwind's `dark:` variant.
- Default: `system` (follows `prefers-color-scheme`).
- A toggle in the top bar cycles through `system → light → dark`.
- Preference persisted to `localStorage` key `shipping:theme`.
- Band colors use CSS custom properties so they render correctly in both modes.

---

## Testing Strategy

### Unit Tests (Vitest)

| File | Tests |
|---|---|
| `bands.test.ts` | `valueToBand` maps every boundary value and open-ended extremes correctly; negative mirror is symmetric |
| `degrade.test.ts` | Delta never causes `value` to cross zero; `value = 0` produces `delta = 0`; large `amount` clamps at zero |
| `propagation.test.ts` | Positive trigger produces positive deltas for allied factions; negative trigger for rival factions; characters with no faction produce no proposals; proposals for the same pair are merged by summing deltas |
| `io.test.ts` | Full `AppState` survives a serialize → parse → validate round-trip; missing optional fields are coerced to defaults; a v1 state passes through a v2 migration correctly |

### Component Tests (React Testing Library)

| File | Tests |
|---|---|
| `CharacterEditor.test.tsx` | Renders with existing character; submitting updated name dispatches correct mutation; cancel closes modal without mutation |
| `DegradeButton.test.tsx` | Clicking opens confirmation modal; modal shows correct relationship count; confirming dispatches degrade mutation; cancel does not mutate |
| `RelationshipEditor.test.tsx` | Renders history table sorted by `at` desc; slider change updates value; "Apply" dispatches mutation with correct delta |

### E2E Tests (Playwright — smoke)

**`smoke.spec.ts`**:
1. Visit `/shipping/`.
2. App loads with sample data (assert ≥ 4 PCs visible).
3. Open Relationships table, click the first row's "Edit".
4. Change the value by +5, save.
5. Export JSON.
6. Clear all.
7. Import the exported JSON.
8. Assert the modified relationship value equals the value set in step 4.

---

## Assumptions & Defaults Log

All items marked **[Default]** in this document are collected here for easy review:

| # | Setting | Default | Where to change |
|---|---|---|---|
| 1 | Relationship value: no hard clamp | Open-ended; bands cover ≤−20 and ≥20 | `Settings > Bands` |
| 2 | Degrade amount | 1 per invocation | `Settings > Degrade` |
| 3 | Faction affinity scalar range | Integer −3..+3 | No UI guard, enforced by Zod |
| 4 | Nudge per affinity point | 2 | `Settings > Propagation` |
| 5 | Propagation trigger band | "Friends" (≥10) / "Enemies" (≤−10) | `Settings > Propagation` |
| 6 | Confirm before propagation apply | true | `Settings > Propagation` |
| 7 | Propagation enabled | true | `Settings > Propagation` |
| 8 | localStorage autosave | enabled | `Settings > Storage` |
| 9 | Theme | system (follows OS) | Top-bar toggle or `Settings > Theme` |
| 10 | Hash-based routing | Used for GitHub Pages sub-path compatibility | `vite.config.ts` + router config |
| 11 | Graph node position | Persisted to store; "Auto-layout" reruns d3-force | Graph toolbar |

---

*End of design document.*
