# CLAUDE.md

Guidance for working in this repo. See `pozi-map-plan.md` for the full phased plan — it is
the source of truth for scope, decisions, and phase boundaries.

## What this is

A small production-quality Web GIS app for the Pozi coding challenge: enter a
place/address/landmark, show it on a map, surface info about it, and make the whole app
URL-driven (deep-linkable / shareable). Assessment weights clean maintainable code, git
history, and maintainability over feature count.

## Stack

- React 19 + TypeScript + Vite
- Leaflet via `react-leaflet`, OSM tiles (added Phase 2)
- **Zod v4** for all runtime validation at boundaries
- Vitest + React Testing Library + jsdom (unit)
- Playwright (E2E, added Phase 2)
- ESLint + Prettier; Node 22 (pinned via `.nvmrc` / `.node-version`)

## Architecture

Feature-sliced UI over a framework-agnostic logic layer.

```
src/
├── components/            global, feature-agnostic UI
├── features/<feature>/    {components, hooks, utils, validators} + co-located tests
│   └── map, search, place-info, url-sync
├── services/              framework-agnostic — NO react imports (ESLint-enforced)
│   └── api/, geocoding/, cache/, throttle.ts
├── config/               app.config.ts, providers.tsx (single swap point)
└── types/                shared domain Zod schemas + z.infer (geo.ts, place.ts)
```

**Dependency rule (ESLint `no-restricted-imports` in `eslint.config.js`):**
`services/**` and `types/**` may not import `react`, `react-dom`, `features/**`, or
`components/**`. Direction is `features → config → services → types`. `api/**` never
imports `geocoding/**`.

**Swap points (keep them one-file):** geocoding provider (`config/providers.tsx`), cache
backend (`services/cache/memoryCache.ts` behind `CacheStore`), tile source
(`features/map/map.config.ts`), region default (`config/app.config.ts`).

## Conventions

- Zod schemas live next to their consumer (feature `validators/`, or beside the API
  client), never in a central folder. Shared domain schemas go in `src/types/`; every
  other schema builds on them.
- Types come from `z.infer` — never hand-written alongside a schema.
- Every module has a co-located `*.test.ts(x)`.
- Raw API DTOs never leave `services/` — map to domain types (`Place`) first.
- External links go through `components/ExternalLink.tsx` (`rel="noopener noreferrer"`,
  `target="_blank"`).
- Geocoding: Nominatim only. Respect its policy — debounce (~400ms, min 3 chars),
  throttle ≤1 req/s, `AbortController`, in-session cache, `User-Agent`/`Referer`.
- Geo bias: Australia-first, global fallback with a visible notice.

## Testing

- Every phase ships unit tests for the logic it adds. Pure functions / hooks / services
  must cover **every edge case** (empty/missing/malformed input, boundaries, error and
  cancellation paths) — not just the happy path. One render smoke test per component.
- No line-coverage gate; the bar is "every identified edge case has a test".
- Component tests mock the map library and assert our wrappers call the right SDK
  methods (`flyTo`, `fitBounds`, `setView`) — they do not inspect the canvas.
- E2E specs stub Nominatim `/search` and tile requests via route interception; CI never
  hits OSM infra. One `@live` smoke spec exists but is excluded from CI.
- A phase is not done until `npm run test` (and from Phase 3, `npm run test:e2e`) passes
  and every edge case for that phase's logic has a test.

## Commands

| Command              | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Vite dev server                          |
| `npm run build`      | Type-check + production build            |
| `npm run test`       | Unit tests once                          |
| `npm run test:watch` | Unit tests in watch mode                 |
| `npm run coverage`   | Unit tests + coverage report             |
| `npm run lint`       | ESLint                                   |
| `npm run format`     | Prettier write                           |
| `npm run check`      | Prettier check + ESLint + tsc + Vitest (pre-commit hook) |

## Git

- Repo and working branch already exist — do **not** run `git init` or create branches.
- The **user** makes all commits. Do not run `git commit`.
