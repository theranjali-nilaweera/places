# Pozi

A small Web GIS app: search for a place, address or landmark, see it on a map, read
useful information about it, and drive the whole thing from the URL.

Built for the Pozi coding challenge.

## Prerequisites

- **Node 22** (pinned in `.nvmrc` / `.node-version`). With [fnm](https://github.com/Schniz/fnm):

  ```sh
  fnm use          # or: fnm install && fnm use
  ```

  Enable `fnm --use-on-cd` in your shell to switch automatically.

- npm 10+

## Getting started

```sh
npm install
npm run dev          # start the dev server (http://localhost:5173)
```

## Scripts

| Script                 | What it does                            |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Vite dev server with HMR                |
| `npm run build`        | Type-check and build for production     |
| `npm run preview`      | Serve the production build locally      |
| `npm run test`         | Run the unit test suite once (Vitest)   |
| `npm run test:watch`   | Unit tests in watch mode                |
| `npm run coverage`     | Unit tests with a coverage report       |
| `npm run lint`         | ESLint                                  |
| `npm run format`       | Format the codebase with Prettier       |

## Architecture

- `src/features/<feature>/` — feature-sliced UI (`components`, `hooks`, `utils`, `validators`).
- `src/services/` — framework-agnostic logic (API client, domain services, cache).
  An ESLint rule forbids it from importing React or the UI layers.
- `src/types/` — shared domain schemas (Zod) and their inferred types.

See the plan for the full breakdown.

## URL API

_Documented in a later phase._
