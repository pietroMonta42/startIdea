---
type: Overview
title: Project Overview
tier: core
---

# Project Overview

[← Index](./index.md)

**startIdea** is a PWA co-founding platform for Italian university students. Think: Y Combinator meets GitHub profiles meets Fiverr, but for student startups.

## Architecture

```
Browser (PWA)
  ├── Next.js App Router (React 19, TypeScript)
  │     ├── app/     → 6 routes (Home, Esplora, Nuovo, Profilo, Progetto/[id], /auth/callback)
  │     ├── components/ → UI primitives + app shell
  │     └── lib/     → store, types, seed data, utils, supabase client
  ├── Supabase (PostgreSQL)
  │     ├── Auth    → OAuth (GitHub/Google) + Magic Link
  │     ├── Tables  → profiles, projects, project_stars, project_comments, applications
  │     └── RLS     → per-row policies; admin can delete any profile/project
  └── proxy.ts      → session refresh middleware (Next.js proxy)
```

## Core flows

| Flow | Entry | Key files |
|------|-------|-----------|
| Browse projects | `/` (Home) | `app/page.tsx`, `components/project-card.tsx` |
| Explore leaderboard | `/esplora` | `app/esplora/page.tsx` |
| Login / Profile | `/profilo` | `app/profilo/page.tsx`, `lib/store.tsx` |
| Publish idea | `/nuovo` | `app/nuovo/page.tsx` |
| Project detail | `/progetto/[id]` | `app/progetto/[id]/page.tsx` |
| Star / Comment / Apply | Any project page | `lib/store.tsx` actions |
| Admin GDPR | Profilo tab | `app/profilo/page.tsx` (admin panel) |

## Hybrid data model

The app works in two modes:
1. **Supabase configured** (env vars set): real auth + real DB data. Demo seed projects shown alongside.
2. **No Supabase** (build/machine without env): demo-only mode — 9 Italian projects pre-loaded for browsing. Mutations not persisted.

The store (`lib/store.tsx`) handles both transparently via `isSupabaseConfigured` check.
