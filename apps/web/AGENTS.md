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

## i18n

- Every user-facing string goes in `i18n/locales/*.json`.

## Server and shared

- `shared/` holds pure zod schemas and types only — no drizzle runtime imports. Enums are const objects plus `keyof typeof`; drizzle enum columns consume pre-exported Values tuples.
- Every handler starts with `const user = await requireUser(event)` (`server/utils/session.ts` → 401). Scope all queries by `userId`; missing and not-owned both return 404 so existence never leaks.
- Validate with `readBodyZod` / `readQueryZod` (`server/utils/validation.ts`, explicit 400). Resolve tag names with `resolveTagIdsForNames` (`server/utils/note-tags.ts`). No silent failures, no inline glue duplication.
- No `db.transaction` on libsql — one `db.batch([...])` per atomic multi-statement write. Order statements defensively (e.g. delete links before notes) instead of relying on FK pragmas.
- REST: POST returns 201 + `Location` + row; PATCH returns the updated row; DELETE returns `{ id }`.

## Editor vs renderer

- Tiptap `UEditor` (single modal instance) is the only writer; Comark `<Markdown>` is the reader for lists. Never mount editors in lists — ProseMirror instances are heavy, static VNodes are cheap and SSR-friendly.
- Stored note content is strict `:tag{label="…"}` MDC. All editor/storage translation lives in `app/utils/tiptap-tag.ts` and nowhere else. Prefer one-time data migrations over permanent runtime compat shims.
