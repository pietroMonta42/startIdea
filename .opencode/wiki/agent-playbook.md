---
type: Playbook
title: Agent Playbook
tier: core
---

# Agent Playbook

[← Index](./index.md)

Conventions and decision trees for editing this codebase safely.

## Where to edit what

| You want to… | Edit this file | Notes |
|--------------|---------------|-------|
| Change UI of a page | `app/<page>/page.tsx` | Each page is self-contained with its own JSX |
| Add a new page | Create `app/<slug>/page.tsx` | Follow existing page as template: `"use client"`, import `useStore`, motion wrappers |
| Change a shared component | `components/<file>.tsx` | UI primitives → `ui.tsx`; cards → `project-card.tsx`; layout → `app-shell.tsx` |
| Change card appearance | `components/project-card.tsx` | `ProjectCard` + `StarButton` sub-component |
| Add new data action (e.g. "like") | `lib/store.tsx` | Add to Store interface + actions + loaders; add RLS policy in `supabase/schema.sql` |
| Change auth flow | `lib/store.tsx` (actions) + `app/profilo/page.tsx` (UI) + `app/auth/callback/route.ts` + `proxy.ts` | Auth touches 4 files |
| Change Supabase schema | `supabase/schema.sql` | Schema is idempotent: can re-run safely |
| Change seed/project demo data | `lib/data.ts` | Also update `Store` interface if adding fields |
| Fix a type error | `lib/types.ts` then `lib/store.tsx` row mappers | Types cascade to all components |
| Change visual theme (colors, fonts) | `app/globals.css` | CSS vars (`--bg`, `--surface`, `--ink`, `--muted`, `--line`) + Tailwind `@theme` tokens |
| Add a gradient hero/banner | `lib/utils.ts` → `gradientStyle()` + `scrimStyle()` | **Never use Tailwind `from-*-600` gradient classes — see caveat below** |

## Decision trees

### "User reports a bug on page X"

1. Open `app/<page>/page.tsx` — is the bug in UI logic or data?
2. If data: check `lib/store.tsx` — does the relevant action/loader exist? Is it gated behind `isSupabaseConfigured`?
3. If Supabase: test the raw SQL in Supabase dashboard to verify RLS/policies.
4. If demo-only bug: reproduce with env vars removed (demo mode).

### "We need to add a new feature"

1. Does it need a new table? → `supabase/schema.sql` (idempotent ALTER/CREATE)
2. Does it need new types? → `lib/types.ts`
3. Does it need new store actions? → `lib/store.tsx` (interface + actions + loaders)
4. Does it need a new page? → `app/<slug>/page.tsx`
5. Does it need new UI primitives? → `components/ui.tsx`
6. Re-run: `npm run build`

## Anti-patterns

- **Never** import from `lib/data.ts` directly in pages — always go through `useStore()` selectors
- **Never** call `supabase` directly in components — use store actions (they handle auth guards, optimistic updates, refetches)
- **Never** put raw SQL mutation in `lib/store.tsx` — use `supabase.from().insert/update/delete`
- **Never** hardcode demo data IDs — they're prefixed `pr-` and checked by `isDemoProject()`
- **Never** assume Supabase is configured — check `isSupabaseConfigured` before network calls; demo mode always works

## Tailwind v4 gradient caveat

Tailwind v4 only emits CSS color variables (`--color-orange-600`, etc.) for tokens **actually referenced**. Gradient utility classes like `from-orange-600 via-rose-600 to-pink-600` reference `var(--color-orange-600)` which is **not emitted** unless used elsewhere → the gradient silently collapses to transparent (card hero shows page background, dark/light, instead of the project color).

**Always use inline style for gradients**:
- `style={gradientStyle(project, { dots: true })}` — hex gradient + optional dot overlay
- `style={scrimStyle()}` — dark-to-transparent scrim behind hero title (use on every gradient hero for white-text legibility)
- `gradientStyle(name)` for avatars / deterministic non-project gradients

Only **brand** tokens (`brand-400` → `brand-700`) are reliably emitted because they're defined in `@theme`. The FAB "+" can use `from-brand-400 to-brand-600` safely. Do not use other palette stops (`-500`, `-600`) as Tailwind gradient classes anywhere.

## TypeScript path aliases

```ts
import { ... } from "@/lib/store";    // OK
import { ... } from "@/components/ui"; // OK
import { ... } from "@/lib/types";     // OK
import { ... } from "@/lib/utils";     // OK
import { ... } from "@/lib/data";      // AVOID in pages — use useStore
```
