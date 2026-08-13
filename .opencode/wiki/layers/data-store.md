---
type: Layer Guide
title: Data Store & State
tier: layer
tags: [store, state, supabase, auth, data]
resource: lib/store.tsx
---

# Data Store & State

[← Index](../index.md)

Global state management via React Context (`lib/store.tsx`). Everything flows through the `useStore()` hook.

## Architecture

```
lib/store.tsx (AppProvider → useStore)
  │
  ├── Auth (supabase.auth)
  │     ├── getSession() → session, user
  │     ├── onAuthStateChange → auto-refresh
  │     ├── signInOAuth(provider)
  │     ├── signInOtp(email, metadata)
  │     └── signOut()
  │
  ├── Public data (read by anyone)
  │     ├── profiles (from DB, all users)
  │     ├── dbProjects (from DB, all projects)
  │     └── comments (from DB, all comments)
  │
  ├── User-scoped data (read by self + relevant owners)
  │     ├── starredIds (DB project_stars for current user)
  │     ├── applications (mine + received on my projects)
  │     └── localStarIds (ephemeral stars on demo projects, localStorage)
  │
  ├── Demo data (always present, immutable)
  │     ├── SEED_PROJECTS (9 Italian startups)
  │     ├── SEED_PROFILES (7 student profiles)
  │     └── SEED_COMMENTS (6 example comments)
  │
  └── Merged views (store selectors)
        ├── projects = [...demoProjects, ...dbProjects]
        ├── starCount(p) = demo? seedStars+local : p.stars_count
        └── commentsFor(id) = demo? seedComments : DB comments
```

## Key selectors (read from useStore)

| Selector | Returns | Notes |
|----------|---------|-------|
| `authReady` | boolean | Use as loading guard for auth-dependent pages |
| `user` | Profile \| null | Current user's DB profile row |
| `isAdmin` | boolean | From profiles.is_admin column |
| `projects` | Project[] | Merged: demo + DB (each row carries optional `theme` int → `gradientStyle(project)`) |
| `profileById(id)` | Profile \| undefined | Searches DB first, then demo map |
| `projectById(id)` | Project \| undefined | Searches merged list |
| `hasStarred(id)` | boolean | Checks DB stars + local ephemeral |
| `starCount(p)` | number | Unified star count |
| `commentsFor(id)` | ProjectComment[] | Demo or DB depending on project |
| `isDemoProject(id)` | boolean | ID starts with "pr-" and not in DB |

## Key actions (write through useStore)

| Action | Signature | Guard |
|--------|-----------|-------|
| `addProject(p)` | → Promise<string \| null> | Auth required; passes `theme` int to DB |
| `updateProject(id, patch)` | → Promise<void> | RLS: owner or admin |
| `deleteProject(id)` | → Promise<void> | RLS: owner or admin |
| `toggleStar(id)` | void | Auth for DB projects, local for demo |
| `addComment(id, content)` | → Promise<void> | Auth required, not on demo |
| `addApplication(id, role, msg)` | → Promise<void> | Auth required, not on demo |
| `updateProfile(patch)` | → Promise<void> | RLS: own profile only |
| `signInOAuth(provider)` | → Promise<void> | — |
| `signInOtp(email, meta)` | → Promise<void> | — |
| `signOut()` | → Promise<void> | — |
| `deleteProfileAdmin(id)` | → Promise<void> | RLS: admin only |

## Project theme + style

The merged `projects` array rows map `theme` from the DB `projects.theme` column (default 0). Projects table in `supabase/schema.sql` has `theme integer not null default 0`. `PROJECT_STYLES` in `lib/utils.ts` indexes the style (Tramonto, Fusione, Abisso, Foresta, Magma, Nebula). `gradientStyle(project)` falls back to a deterministic gradient from `project.id` when `theme` is unset (seed projects).

## Supabase guard

`isSupabaseConfigured` controls whether network calls run. When false (no env vars), the store:
- Sets `authReady` + `hydrated` immediately
- Skips all DB loaders and mutations
- Shows only demo seed projects
- Demo stars persist via localStorage

This means the app **always** builds and runs — with or without Supabase env.

## Toast system

`toast(msg)` renders a centered notification at the bottom of the viewport (Framer Motion animated).
Toasts auto-dismiss after 2.8s. Used by all actions for success/error feedback.
