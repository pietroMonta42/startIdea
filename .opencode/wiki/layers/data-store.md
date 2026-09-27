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
  │     ├── onAuthStateChange → auto-refresh + clears stale user data on account switch
  │     ├── signInOtp(email, metadata)          # Magic Link; clears local session before sending
  │     ├── signInWithEmail(email, password)    # primary auth (Confirm email OFF in prod)
  │     ├── signUpWithEmail(email, pwd, meta)
  │     ├── signInOAuth(provider)               # exists in code, buttons removed from UI (needs provider config)
  │     └── signOut()
  │
  ├── Public data (read by anyone)
  │     ├── profiles (from DB, all users; optional role_custom, profile_color, university/context)
  │     ├── dbProjects (active projects publicly; owners can also read their archived projects)
  │     └── comments (from DB, all comments)
  │
  ├── User-scoped data (read by self + relevant owners)
  │     ├── starredIds (DB project_stars for current user)
  │     ├── applications (mine + received on my projects; contact data is visible only to applicant and owner)
  │     ├── founderResources (RLS: published resources for users with active projects; all for admins)
  │     └── founderRequests (own requests; all requests for admins)
  │     └── localStarIds (ephemeral stars on demo projects, localStorage)
  │
  ├── Demo data (gated by NEXT_PUBLIC_DEMO_MODE)
  │     ├── SEED_PROJECTS (9 Italian startups)  # hidden in prod: auto-off when Supabase configured
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
| `projects` | Project[] | Merged: demo + DB (`stage`: idea/launch, `is_active`, optional link and `theme`) |
| `canAccessFounder` | boolean | Current user owns at least one active project |
| `profileById(id)` | Profile \| undefined | Searches DB first, then demo map |
| `projectById(id)` | Project \| undefined | Searches merged list |
| `hasStarred(id)` | boolean | Checks DB stars + local ephemeral |
| `starCount(p)` | number | Unified star count |
| `commentsFor(id)` | ProjectComment[] | Demo or DB depending on project |
| `isDemoProject(id)` | boolean | ID starts with "pr-" and not in DB |

## Key actions (write through useStore)

| Action | Signature | Guard |
|--------|-----------|-------|
| `addProject(p)` | → Promise<string \| null> | Auth required; persists stage, active/archive state, link and `theme` |
| `updateProject(id, patch)` | → Promise<void> | RLS: owner or admin; supports stage and archive state |
| `deleteProject(id)` | → Promise<void> | RLS: owner or admin |
| `toggleStar(id)` | void | Auth for DB projects, local for demo |
| `addComment(id, content)` | → Promise<void> | Auth required, not on demo |
| `addApplication(id, role, msg, contact)` | → Promise<boolean> | Auth required, not on demo; requires at least one consented contact method |
| `updateApplicationStatus(id, status)` | → Promise<void> | Project owner; only status and timestamp can be updated |
| `submitFounderRequest(request)` | → Promise<boolean> | Auth required; request must reference user's active project and include consent/contact |
| `createFounderResource(resource)` / `updateFounderResource(id, patch)` | → Promise<void> | Admin only by RLS |
| `updateFounderRequest(id, patch)` | → Promise<void> | Admin only by RLS |
| `updateProfile(patch)` | → Promise<void> | RLS: own profile only; supports role_custom, profile_color and optional university/context |
| `signInOAuth(provider)` | → Promise<void> | — (UI buttons removed; needs Supabase provider config) |
| `signInOtp(email, meta)` | → Promise<void> | — (built-in SMTP: max 2 emails/hour) |
| `signInWithEmail(email, pwd)` | → Promise<void> | — (primary login) |
| `signUpWithEmail(email, pwd, meta)` | → Promise<void> | Confirm email OFF in prod → instant session |
| `signOut()` | → Promise<void> | — (button in desktop sidebar bottom + mobile profile header) |
| `deleteProfileAdmin(id)` | → Promise<void> | RLS: admin only |

## Profile and project style

Profiles store a `profile_color` hex value (default `#f97316`). The profile editor offers predefined gradients plus a free color picker; the hex value is used for the profile banner and avatar. `role_badge` accepts `other` with an optional `role_custom` label. The existing `university` column is optional and can contain work status or another affiliation.

The merged `projects` array rows map `theme` from the DB `projects.theme` column (default 0). Projects table in `supabase/schema.sql` has `theme integer not null default 0`. `PROJECT_STYLES` in `lib/utils.ts` indexes the style (Tramonto, Fusione, Abisso, Foresta, Magma, Nebula). `gradientStyle(project)` falls back to a deterministic gradient from `project.id` when `theme` is unset (seed projects).

Project `tags` remain the database field for compatibility, but the UI calls them categories. `ALL_CATEGORIES` in `lib/data.ts` includes legacy values plus Italian categories such as Casa e affitti, PropTech, Finanza personale, Dati e analisi, Risparmio and Servizi quotidiani.

Projects also carry `stage` (`idea` or `launch`) and `is_active`; Explore filters inactive projects and can filter by stage. `applications` store contact email/phone and consent; RLS limits these fields to the applicant and project owner. Founder-only resource and support-request data is in `founder_resources` and `founder_requests`, guarded by active-project and admin policies.

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
