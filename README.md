# sitka

Playboard's dashboard: a static SvelteKit site (Cloudflare Pages) where players manage their servers: console, code,
backups and options. Its only backend is [aspen](../aspen)'s API, at `VITE_API_URL` (see `.env.example`).

```sh
bun install
bun run dev        # http://localhost:5173
bun run test       # unit tests (vitest)
bunx eslint .
bun run build      # static site in build/
```

- `src/lib/api.js`: every API call.
- `src/lib/session.svelte.js`: the logged-in player and their instances, kept current by aspen's live updates
  (`/api/events`), with polling while that connection is down.
- Tests sit next to the code (`*.test.js`); `src/test-setup.js` fakes `localStorage` and `WebSocket` for them.

CI (`.github/workflows/ci.yml`) runs eslint, the tests and the build on every push. How it fits with the rest is in
[../docs/architecture.md](../docs/architecture.md).
