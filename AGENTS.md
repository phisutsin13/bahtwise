<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Bahtwise — agent notes

Bilingual (Thai/English) personal finance tracker. Next.js 16 App Router +
Supabase, Tailwind v4, React 19. Money is stored as **integer satang**
(`amountSatang`) everywhere — never introduce floating-point money.

## Commands

- `npm run check` — lint + typecheck + test (run before finishing any change)
- `npm run dev` / `npm run build`
- `npm test` — Vitest (includes RLS via PGlite)

## Conventions

- Two backends behind one interface in `src/lib/repository.ts`:
  `DemoRepository` (localStorage) and `SupabaseRepository`. Add features to the
  `FinanceRepository` interface and implement both.
- Supabase is optional. When unset, the app runs in Demo mode; never require it
  for the app to function.
- All user-facing text goes through `src/i18n/dictionaries.ts` (both `th` and
  `en` keys must stay in sync).
- Postgres schema + RLS live in `supabase/migrations/`. Every user table is
  guarded by `user_id = auth.uid()`; built-in categories are global rows
  (`user_id is null`, non-null `slug`).
- Dev logs use `src/lib/logger.ts`, which redacts identifiers and amounts.
- Keep the auto-generated Next.js block at the top of this file intact; append
  below it.

