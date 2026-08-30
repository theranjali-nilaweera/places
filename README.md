# Places

A small Web GIS app built for the Pozi coding challenge: search for a place, address, or
landmark, see it on a map, read useful information about it, and share or reopen any view
through the URL.

## Features

- **Search** any place, address, or landmark, powered by OpenStreetMap's
  [Nominatim](https://nominatim.org/) geocoder.
- **Australia-first results.** Queries are biased to Australia by default
  (`src/config/app.config.ts` → `defaultCountryCodes`); change that one array to
  re-target or go global.
- **Results list.** Matches appear in a dismissible panel; selecting one frames it on
  the map without closing the list.
- **Place-info panel.** For the selected place: name, classification, a formatted
  address, and any available links — website, phone (`tel:`), opening hours, Wikidata.
  Shows "No additional details available" when the source has none.
- **Map.** Leaflet + OpenStreetMap raster tiles, opening on the Australian mainland.
- **URL as an input channel** — see [URL parameters](#url-parameters).
- **Rate-limit friendly.** A 400 ms input debounce plus a client-side 1 req/s limiter
  keep within
  [Nominatim's usage policy](https://operations.osmfoundation.org/policies/nominatim/).

## Prerequisites

- **Node 22** — pinned in `.nvmrc` / `.node-version`. With
  [fnm](https://github.com/Schniz/fnm):

  ```sh
  fnm install && fnm use
  ```

  Add `fnm --use-on-cd` to your shell to switch automatically on `cd`.

- **npm 10+** (ships with Node 22).

## Getting started

```sh
npm install       # also installs the git pre-commit hook — see Contributing
npm run dev       # http://localhost:5173
```

Production build:

```sh
npm run build
npm run preview   # serves the build on http://localhost:4173
```

## URL parameters

The app reads the query string **once on load** and normalises the address bar. Nothing
is written back while you use the app, other than clearing the stale `?search=` value on
your first edit.

| Parameter | Example | Effect |
| --- | --- | --- |
| `search` | `?search=Melbourne%20Town%20Hall` | Prefills the search box and runs the search on load. The first result is auto-selected and framed on the map. |
| `lat`, `lon`, `z` | `?lat=-37.8136&lon=144.9631&z=15` | Sets the **initial map view**. All three are required. |

Rules:

- `search` takes precedence — if it is usable, `lat` / `lon` / `z` are ignored.
- Malformed, out-of-range, or partial parameters are dropped silently; the app still
  loads.
- With no usable parameter the address bar is normalised to `?search=` so the channel
  stays discoverable.

## Project layout

```text
src/
  components/   Shared UI (ErrorBoundary, ExternalLink)
  features/     Feature slices — map, search, place-info, url-sync
                each with components / hooks / utils / validators
  services/     Framework-agnostic logic: HTTP client, Nominatim client,
                geocoding service, rate limiter. No React (ESLint-enforced).
  config/       Provider wiring and app-wide defaults
  types/        Shared domain schemas (Zod) + inferred types
e2e/            Playwright specs (run against the real app + live Nominatim)
```

**One-file swap points:**

| Change | File |
| --- | --- |
| Geocoding provider (self-hosted Nominatim, commercial API, stub) | `src/config/geocoding.ts` |
| Tile provider / initial map view | `src/features/map/map.config.ts` |
| Region bias, result limit, debounce | `src/config/app.config.ts` |

The `src/services` layer never imports React or the UI layers; an ESLint rule in
`eslint.config.js` enforces that so the logic stays portable.

## Testing

| Command | Scope |
| --- | --- |
| `npm run test` | Unit + component tests (Vitest + Testing Library) |
| `npm run test:watch` | Same, watch mode |
| `npm run coverage` | Unit tests with a V8 coverage report |
| `npm run test:e2e` | End-to-end (Playwright, Chromium) |
| `npm run test:e2e:ui` | Playwright interactive UI |

The E2E suite runs against the **production build** (`vite preview` on port 4173) and
hits **real services** — the live Nominatim API and real OSM tiles, with no request
interception. It runs single-worker with generous timeouts to respect the 1 req/s
policy. The first run needs the browser binary:

```sh
npx playwright install chromium
```

## Quality checks

| Command | What it runs |
| --- | --- |
| `npm run lint` | ESLint (flat config, incl. the services/UI import boundary) |
| `npm run typecheck` | `tsc` project build, no emit |
| `npm run format` / `format:check` | Prettier write / verify |
| `npm run check` | `format:check` + `lint` + `typecheck` + unit tests |

## Contributing

`npm install` installs a **pre-commit hook** (via `simple-git-hooks`) that runs:

```sh
npm run check && npm run test:e2e
```

so every commit is linted, type-checked, unit-tested, and E2E-tested. The E2E stage
calls the live Nominatim API, so commits need network access. To bypass the hook for a
work-in-progress commit:

```sh
git commit --no-verify
```

## Assumptions

- **Australia only.** Results are biased to Australia (`countrycodes=au`). If an AU
  search returns nothing, the app does **not** fall back to a global search — that is
  intentional for now.
- **No geocoding cache.** Every distinct query goes to Nominatim; the 400 ms input
  debounce plus the client-side 1 req/s limiter are treated as sufficient.
- **Public Nominatim instance.** Subject to its rate limits and offered with no uptime
  guarantee. A production deployment would self-host Nominatim or use a commercial
  provider — swap point: `src/config/geocoding.ts`.
- **Browser identification via `Referer`.** Browsers strip the `User-Agent` header, so it
  is only set for Node / E2E runs.
- **E2E hits live services.** Playwright specs use no request interception; they need
  network access and can be slow or flaky when Nominatim is under load.
- **Single locale.** English UI, no internationalisation.

## TODO

- **Write state back to the URL.** Today the URL is read-only on load — the bare minimum.
  A search, a result selection, and the map pan/zoom should each update the query string
  so a view stays shareable _after_ interaction, not just via a hand-crafted link.
- **Open the map marker popup automatically** when a result is selected or a search runs
  from the URL, so the pin's detail is visible without a second click.
- **Collapsible / full-screen panels on small screens.** The layout is relatively responsive, but there's a lot that can be done to avoid hindering the map view when a result is selected.
  For example the search, results, and detail panels should collapse when not needed and expand to
  full screen with a dismiss control on narrow viewports.
- **Results list accessibility.** Add `listbox`/`option` semantics, keyboard navigation
  (arrow keys + Enter), and focus management when a result is chosen.
- **Type-ahead suggestions** as the user types, within the same rate-limit budget.
- **Result disambiguation deep link** (e.g. `?selected=<osm_type>/<osm_id>`) so a shared
  link can point at a specific match rather than "the first result".

## Deployment

Live: <https://places-5rkfusps3-tj-e2c2.vercel.app>

`npm run build` produces a static bundle in `dist/` that can be served from any static
host.

## Attribution

- Map data & geocoding © [OpenStreetMap](https://www.openstreetmap.org/copyright)
  contributors, via the [Nominatim](https://nominatim.org/) API.
- Map rendering by [Leaflet](https://leafletjs.com/).
