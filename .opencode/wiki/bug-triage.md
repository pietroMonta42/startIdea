---
type: Triage
title: Bug Triage
tier: core
---

# Bug Triage

[← Index](./index.md)

Symptom → area routing. Add rows via `update-wiki` when the same symptom misroutes agents twice.

| Symptom | Check first | Then grep |
|---------|-------------|-----------|
| Login not working / session lost | `lib/store.tsx` (auth actions, onAuthStateChange), `proxy.ts` (session refresh), `app/auth/callback/route.ts` | `signIn`, `signOut`, `getSession`, `onAuthStateChange` |
| Project not appearing in feed | `lib/store.tsx` (loadPublic, dbProjects state), `supabase/schema.sql` (RLS on projects) | `projects`, `dbProjects`, `loadPublic` |
| Star not saving | `lib/store.tsx` (toggleStar action — check demo vs real path), `supabase/schema.sql` (project_stars RLS, sync_stars_count trigger) | `toggleStar`, `project_stars`, `starredIds` |
| Card looks wrong / gradient broken | `lib/utils.ts` (gradientFor, GRADIENTS array), `app/globals.css` (dot-grid, aspect) | `GRADIENTS`, `gradientFor`, `dot-grid` |
| Dark/Light mode broken | `app/globals.css` (CSS vars for :root / .dark), `components/app-shell.tsx` (ThemeProvider, ThemeToggle) | `--bg`, `--surface`, `--line`, `dark:`, `ThemeProvider` |
| Markdown not rendering | `components/markdown.tsx` (ReactMarkdown components map) | `ReactMarkdown`, `components` props |
| Form doesn't submit / validation toast | `app/nuovo/page.tsx` (submit), `lib/store.tsx` (addProject action) | `submit`, `addProject`, `toast` |
| Admin panel missing / delete fails | `lib/store.tsx` (isAdmin flag, deleteProfileAdmin), `supabase/schema.sql` (is_admin column, admin RLS policies) | `isAdmin`, `is_admin`, `admin` |
| Build error (env/Supabase) | `lib/supabase/client.ts` (placeholders when env missing), `lib/store.tsx` (isSupabaseConfigured guards) | `NEXT_PUBLIC_SUPABASE`, `isSupabaseConfigured` |
| PWA not installing / icon wrong | `app/manifest.ts`, `app/icon.svg`, `public/sw.js`, `next.config.ts` (sw.js headers) | `manifest`, `icon`, `sw.js`, `serviceWorker` |
| SEO / metadata wrong | `app/layout.tsx` (metadata, viewport exports), individual pages | `metadata`, `title` |

## Classic navigation errors

| Confusing pair | Key difference |
|---------------|---------------|
| `lib/data.ts` vs `lib/store.tsx` | `data.ts` = static seed (never imported in pages). `store.tsx` = live state (always import via `useStore`) |
| `components/ui.tsx` vs shadcn | We **don't** use shadcn; `ui.tsx` is hand-rolled with same aesthetic |
| `proxy.ts` vs middleware | Next 16 renamed middleware → proxy. Same behavior: session refresh on every request |
| `starCount` vs `stars_count` | `starCount` = store selector (includes local ephemeral + DB). `stars_count` = DB column (maintained by trigger) |
