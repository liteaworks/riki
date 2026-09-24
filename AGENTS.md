# AGENTS.md

Monorepo-wide rules. App-level rules live in `apps/web/AGENTS.md`.

## Package management

- pnpm workspaces. Never npm/yarn.
- Declare every directly-imported package in the importing package's `package.json`, even if it is hoisted through another dependency (pnpm is strict; transitive imports break on upgrade). Align the version range with the provider package so the store keeps a single copy.

## Checks

- `pnpm lint` (oxlint) must pass.
- `pnpm fmt` / `pnpm fmt:check` (oxfmt: tabs, no semicolons, single quotes). Write compact code; break lines only when they exceed width or nesting demands it.
- `tsc --noEmit` inside `apps/web` is the only check that catches type errors — lint and build do not typecheck. Run it after touching `.ts` files.
- `pnpm build` is expensive. Run it only after dependency changes or cross-cutting wiring changes, never as a routine check.
- Say what you could not verify. State that explicitly instead of claiming confidence.

## Code

- One concern per change. No drive-by refactors.
- No code comments unless the why is non-obvious.
