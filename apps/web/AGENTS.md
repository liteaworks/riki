# apps/web - AGENTS.md

## Tech stack

- [Nuxt 4](https://nuxt.com)
- [Nuxt UI 4](https://ui.nuxt.com/docs/components)
- [better-auth](https://better-auth.com)
- [Drizzle (Cloudflare D1)](https://orm.drizzle.team/docs)
- [Tiptap](https://tiptap.dev/docs)
- [Comark](https://comark.dev/)
- [@nuxtjs/i18n (vue-i18n)](https://i18n.nuxtjs.org/docs/guide)
- [Tauri shell](https://tauri.app/)

## UI

- Icons only via `appConfig.ui.icons` (`app/theme/icons.ts`). Never hardcode icon strings in components.
- Modals only via `useOverlay` (`overlay.create(LazyXxxModal)` + `.open(props)`); dialog components expose a `close` emit. Never mount modal tags statically.
- Should follow optimistic UI principles.

## Client state and sync

- `$fetch` deliberately does **not** forward cookies during SSR (SSRF / auth-misuse protection). Any store action hitting an auth-gated endpoint with plain `$fetch` must therefore stay client-only: wrapping it in `callOnce` or `onServerPrefetch` turns a 401 into a broken page for signed-out visitors. SSR such an action only behind `useRequestFetch()`, and only after weighing the extra D1 reads on every render.
- A preload (`load`, `pull`, background sync) swallows its failure and leaves `loaded` false so it retries; it must never reject into a render or a page setup. A user-initiated action throws so the caller can toast.
- Shared domain state lives in a Pinia store; a component that renders it must go through the store instance (`store.foo` / `storeToRefs`), never by destructuring state. Destructuring a store yields an unwrapped snapshot and loses reactivity.
- A store whose state comes from browser storage must wrap it in `skipHydrate`, or Pinia hydrates the SSR default over the stored copy on every page load.
- Writes are optimistic: apply the intended state immediately, enqueue the intent, then reconcile with the server. Roll back and rethrow on failure so the caller owns the toast.
- Offline intents queue durably and retry with exponential backoff plus jitter. Surface a "not synced" indicator only when a write has genuinely not landed (queued while offline, or failed) — never on mere queue presence, which flashes on every successful online write.
- Conflicts resolve last-write-wins on `updatedAt`, enforced on both ends. Deletion is `status: 'archived'`; there is no tombstone column.
- The server must clamp a client `updatedAt` to server time. A device with a wrong clock would otherwise pin a note in the future, and since the client advances its sync point to the newest timestamp it has seen, every later delta pull returns nothing and sync stops silently for good.
- A sync response must account for every id it was sent: applied, rejected (not yours), and skipped (discarded by last-write-wins). Anything unaccounted for leaves the outbox retrying forever and pins a permanent "unsynced" badge on a write the server already decided about.
- Deletion is `status: 'archived'`; there is no tombstone column.
- Drafts are per user and per note, written on a debounce, restored on reopen, and discarded on save. A discard must also cancel any debounced write still in flight, or unmounting resurrects the saved note as a stale draft.
- Polling pulls ask for deltas (`?since=`) and only advance the sync point past a response they know is complete.

## Cloudflare

- D1 hard limits: **50 queries per Worker invocation** and **100 bound parameters per query** on the free plan (1,000 queries on paid). Free tier also caps 5M rows read and 100k rows written per day, and since 2026-09-01 exceeding the daily limits makes queries fail outright.
- Never loop a per-row query helper inside a request handler; one request handles one resource. D1 allows 100 bound parameters per query and 50 queries per Worker invocation on the free plan.
- One `db.batch([...])` per atomic multi-statement write. Helpers that loop internally break this.
- Free tier also caps 5M rows read and 100k rows written per day, and since 2026-09-01 exceeding the daily limits makes queries fail outright. Read costs count, so do not poll a full page on a timer.

## Reuse

- Before writing a helper, check whether the shape already exists. Identical logic in two places is a defect, not a coincidence.
- `useToast`, `useOverlay` and `$fetch` are the primitives. Do not wrap a framework primitive in a single-purpose helper — a `notifyFailure` that can only report failures is a narrowing, not a reusable abstraction, and it cannot be called from a store because it needs `useI18n`. Call the primitive directly.
- Extract to `shared/utils/` only when both client and server need it; `app/utils/` is client-only, `server/utils/` is server-only.

## Performance

- Merging a fetched page into a reactive list is O(n) in the size of both, not O(n·m): build a `Map` by id once instead of scanning per row.
- Replace a reactive collection in one assignment after mutating a copy, rather than pushing row by row.
- Do not re-fetch a full page on a timer; ask for changes since the last known point.

## Comments

- Comment the _why_, never the _what_. A comment that restates the next line is noise; delete it.
- Keep a comment only when the code would plausibly be "corrected" into a bug without it: non-obvious constraints, protocol invariants, security guards, and the reason a seemingly redundant line exists.
- Prefer deleting a comment over rewording it. If the code cannot say it, the code is wrong.

## i18n

- Every user-facing string goes in `i18n/locales/*.json`.

## Server and shared

- `shared/` holds pure zod schemas and types only — no drizzle runtime imports. Enums are const objects plus `keyof typeof`; drizzle enum columns consume pre-exported Values tuples.
- Every handler starts with `const user = await requireUser(event)` (`server/utils/session.ts` → 401). Scope all queries by `userId`; missing and not-owned both return 404 so existence never leaks.
- Validate with `readBodyZod` / `readQueryZod` (`server/utils/validation.ts`, explicit 400). Resolve tag names with `resolveTagIdsForNames` (`server/utils/note-tags.ts`). No silent failures, no inline glue duplication.
- No `db.transaction` on libsql — one `db.batch([...])` per atomic multi-statement write. Order statements defensively (e.g. delete links before notes) instead of relying on FK pragmas.
- REST: POST returns 201 + `Location` + row; PATCH returns the updated row; DELETE returns `{ id }`. A deleted note is archived via `PATCH { status: 'archived' }`; `DELETE` stays a hard delete.
- Every endpoint must fit that contract. An endpoint that exists only to serve one client's internal transport is not an API — build that client on the documented routes instead. `POST /api/notes` accepts an optional client-minted `id`, which is what makes a create retryable, and `PATCH /api/notes/:id` takes an optional `updatedAt` for last-write-wins.

## Editor vs renderer

- Tiptap `UEditor` (single modal instance) is the only writer; Comark `<Markdown>` is the reader for lists. Never mount editors in lists — ProseMirror instances are heavy, static VNodes are cheap and SSR-friendly.
- Stored note content is strict `:tag{label="…"}` MDC. All editor/storage translation lives in `app/utils/tiptap-tag.ts` and nowhere else. Prefer one-time data migrations over permanent runtime compat shims.
