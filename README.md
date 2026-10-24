# sitka

Playboard's dashboard: a static SvelteKit site (Cloudflare Pages) where players manage their servers: console, code,
backups and options. Its only backend is [aspen](../aspen)'s API, at `VITE_API_URL` (see `.env.example`).

```sh
bun install
bun run dev        # http://localhost:5173
bun run test       # unit tests (vitest)
bun run check      # TypeScript (strict) and Svelte, through svelte-check
bun run lint       # eslint with typescript-eslint's strict type-checked rules
bun run build      # static site in build/
```

- `src/lib/api.ts`: every API call; `src/lib/types.ts`: what aspen answers with.
- `src/lib/session.svelte.ts`: the logged-in player and their instances, kept current by aspen's live updates
  (`/api/events`), with polling while that connection is down.
- Tests sit next to the code (`*.test.ts`); `src/test-setup.ts` fakes `localStorage` and `WebSocket` for them,
  `src/test-fetch.ts` the API.

CI (`.github/workflows/ci.yml`) runs the type check, eslint, the tests and the build on every push. How it fits with the rest is in
[../docs/architecture.md](../docs/architecture.md).
