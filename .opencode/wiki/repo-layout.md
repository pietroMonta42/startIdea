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
| `app/page.tsx` | **Public landing**: product overview and link to `/esplora`; authenticated visitors are redirected to `/home` by the app shell |
| `app/home/page.tsx` | **Authenticated dashboard**: project summary and shortcuts to Founder resources and project management |
| `app/esplora/page.tsx` | **Public feed** without the full navigation: search, category and stage filters, 3-way sort, `ProjectCard` list |
| `app/founder/page.tsx` | **Founder space**: curated resources and support request form for authenticated users with an active project |
| `app/progetti/page.tsx` | **Project management**: owned projects, idea/launch stage, archive controls, received applications and contact details |
| `app/amministrazione/page.tsx` | **Admin console**: maintain Founder resources and process support requests |
| `app/nuovo/page.tsx` | **New project form**: title, pitch, categories, stage, roles, link, style picker and Vision Markdown preview |
| `app/profilo/page.tsx` | **Profile / Login**: auth screen or logged-in proof-of-work and profile administration |
| `app/progetto/[id]/page.tsx` | **Project detail**: gradient hero, stage, open roles, application form with contact consent, Vision, comments and owner edit/delete |
| `app/auth/callback/route.ts` | OAuth/Magic Link callback: exchanges code for Supabase session |
| `app/manifest.ts` | PWA manifest (standalone, orange theme, SVG icon) |
| `app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.png` | Next.js file-convention icons (auto metadata) — generated from logo SVG |
| `public/sparklab-logo.svg` | SparkLab mark (used by `Logo` component via next/image) |
| `public/icon-512-maskable.png` | PWA maskable icon (referenced by manifest) |

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
| `lib/types.ts` | TypeScript types: `Profile`, `Project`, `ProjectComment`, `Application`, `FounderResource`, `FounderRequest`, enums, label/color maps |
| `lib/store.tsx` | **Global state** (React Context): session, user, projects (seed + DB), comments, applications, Founder resources and requests, stars. Auth via Supabase. CRUD actions and toasts. Fallback demo-mode when no Supabase env. |
| `lib/data.ts` | Seed data: 7 Italian student profiles + 9 demo projects (ThesisAI, MensaGo, StudySwap, …) + 6 seed comments |
| `lib/utils.ts` | Utilities: `cn()`, `timeAgo()`, `gradientStyle()` (inline hex gradients — see agent-playbook caveat), `scrimStyle()`, `PROJECT_STYLES`, `initials()`, `uid()` |
| `lib/supabase/client.ts` | Browser Supabase client singleton |

## `supabase/`

| File | What it is |
|------|------------|
| `supabase/schema.sql` | Full idempotent PostgreSQL schema: profiles, projects, applications, Founder resources and requests, stars, comments; RLS policies, admin helpers and trigger hardening |
| `supabase/reset.sql` | Drops everything (tables/functions/triggers) for a clean slate — run `schema.sql` after |

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
