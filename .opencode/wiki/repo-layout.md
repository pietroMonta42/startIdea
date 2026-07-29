---
type: Navigation
title: Repo Layout
tier: core
---

# Repo Layout

[← Index](./index.md)

Top-level folder map. For deep-dive on specific areas, see layer and domain pages.

## `app/` — Next.js App Router pages

| File / Folder | What it is |
|---------------|------------|
| `app/layout.tsx` | Root layout: fonts (Inter, Space Grotesk), metadata, viewport, providers |
| `app/globals.css` | Tailwind v4: `@theme` tokens, CSS vars (bg, surface, ink, muted, line), dark mode via `.dark` class |
| `app/page.tsx` | **Home feed**: search bar, tag chips, sort toggle, project card grid |
| `app/esplora/page.tsx` | **Leaderboard**: podium (top 3), weekly/all-time toggle, ranked list |
| `app/nuovo/page.tsx` | **New project form**: title, pitch (140), tags, roles, markdown README with live preview |
| `app/profilo/page.tsx` | **Profile / Login**: auth screen (GitHub, Google, Magic Link) or logged-in proof-of-work + admin panel |
| `app/progetto/[id]/page.tsx` | **Project detail**: gradient hero, open roles, apply modal, README, comments, owner edit/delete |
| `app/auth/callback/route.ts` | OAuth/Magic Link callback: exchanges code for Supabase session |
| `app/manifest.ts` | PWA manifest (standalone, orange theme, SVG icon) |
| `app/icon.svg` | App icon |

## `components/` — Shared UI

| File | What it is |
|------|------------|
| `components/ui.tsx` | Pure UI primitives: `Button`, `Badge`, `Avatar`, `Modal`, `Input`, `Textarea`, `Skeleton`, `FeedSkeleton` |
| `components/app-shell.tsx` | Layout shell: `Logo`, `ThemeToggle`, `SideNav` (desktop), `MobileHeader`, `BottomNav` (mobile with FAB), service worker registration |
| `components/project-card.tsx` | Project feed card + `StarButton` sub-component with animated toggle |
| `components/markdown.tsx` | Markdown renderer (react-markdown wrapper with custom styled components) |

## `lib/` — Business logic

| File | What it is |
|------|------------|
| `lib/types.ts` | TypeScript types: `Profile`, `Project`, `ProjectComment`, `Application`, enums, label/color maps |
| `lib/store.tsx` | **Global state** (React Context): session, user, projects (seed + DB), comments, applications, stars. Auth via Supabase. All CRUD actions. Toast notifications. Fallback demo-mode when no Supabase env. |
| `lib/data.ts` | Seed data: 7 Italian student profiles + 9 demo projects (ThesisAI, MensaGo, StudySwap, …) + 6 seed comments |
| `lib/utils.ts` | Utilities: `cn()` (clsx), `timeAgo()` (Italian relative time), `gradientFor()` (deterministic card gradients), `initials()`, `uid()` |
| `lib/supabase/client.ts` | Browser Supabase client singleton |

## `supabase/`

| File | What it is |
|------|------------|
| `supabase/schema.sql` | Full idempotent PostgreSQL schema: 5 tables, 2 triggers (`handle_new_user`, `sync_stars_count`), RLS policies, `is_admin` function |

## Root config

| File | What it is |
|------|------------|
| `proxy.ts` | Next.js 16 proxy (née middleware) — session refresh via Supabase cookies |
| `next.config.ts` | Headers for `sw.js` (no-cache, correct Content-Type) and `manifest.webmanifest` |
| `package.json` | Next 16, React 19, Framer Motion, Tailwind v4, lucide-react, next-themes, react-markdown, @supabase/ssr |
| `tsconfig.json` | Strict TypeScript, `@/*` path alias, bundler resolution |
| `.env.example` | Required env vars template |
| `plan.md` | Original technical plan (Italian) — architecture, DB schema, UX flow |
| `vision.md` | Vision document (Italian) — product philosophy |
