# AGENTS.md

Monorepo-wide rules. App-level rules live in `apps/web/AGENTS.md`.

## Package management

- pnpm workspaces. Never npm/yarn.
- Declare every directly-imported package in the importing package's `package.json`, even if it is hoisted through another dependency (pnpm is strict; transitive imports break on upgrade). Align the version range with the provider package so the store keeps a single copy.

## Checks

- `pnpm lint` (oxlint) must pass. It does not report unused variables or type errors inside `.vue` files.
- `pnpm fmt` / `pnpm fmt:check` (oxfmt: tabs, no semicolons, single quotes). Write compact code; break lines only when they exceed width or nesting demands it.
- `pnpm --filter @riki/web typecheck` (`nuxt typecheck`, runs vue-tsc) is the only check that covers `.vue`. Plain `tsc --noEmit` does not: `tsconfig.app.json` includes `../app/**/*`, which matches `.ts`/`.js` but not single-file components. Run typecheck after touching any `.ts` or `.vue` file.
- `pnpm build` is expensive. Run it only after dependency changes or cross-cutting wiring changes, never as a routine check.
- Say what you could not verify. State that explicitly instead of claiming confidence.

## Code

- One concern per change. No drive-by refactors.
- No code comments unless the why is non-obvious.

## Comments

- A comment must be useful to a professional contributor reading the code later. If deleting it would cost a reader nothing, delete it.
- Most code needs no comment at all. The default is silence, not documentation.
- Never restate the code. A comment that repeats the next line, or paraphrases a type signature, is worse than nothing: it goes stale and then lies.
- Never narrate history. "This used to flash on every write" belongs in the commit message, not the file.
- Terse. One line is almost always enough. Do not pad a sentence across three lines to look thorough.
- Do not litter a function. Several comments inside one function mean the code is doing too much - extract or rename instead.
- Avoid one comment per line, or a comment above every statement. Blank-line grouping and good names carry intent; comments are for what names cannot.
- Keep a comment only for what a reader would otherwise "fix" into a bug: a non-obvious constraint, a protocol or format invariant, a security guard, or the reason an apparently redundant line exists.

### Comment smells

Commit the following on sight. Each is noise that costs a reader time and rots silently.

- **The restatement** - `// Increment the counter` above `counter++`.
- **The type echo** - `// val is string | number` where the signature already says so.
- **The narration** - `// Loop over the rows` above a `for` loop.
- **The diary** - `// This used to call the old API before v2` describing something that no longer exists.
- **The essay** - several lines of prose stacked above one short statement, inflating the file and burying the code.
- **The annotated ritual** - a comment above every line of an obvious block, so the real signal is lost.
- **The restated policy** - a comment paraphrasing a rule that already lives in AGENTS.md, which then drifts out of sync with it.
- **The confident narration** - "handles the edge case" with no statement of which edge case.
- **The empty catch apologist** - `// ignore errors` where the code should explain why ignoring is correct, or should not be ignoring.
