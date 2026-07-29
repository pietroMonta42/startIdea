---
okf_version: "0.1"
---

# startIdea — Agent Wiki Index

High-level navigation map for AI agents.
**Goal:** find the right area quickly; avoid deep repo crawls.

> Keep this wiki **general**. Task/PR context holds ticket-specific detail.
> **Grow incrementally** — invoke `update-wiki` when patterns repeat, not per ticket.


## Start here (pick one)

| If you need to… | Read |
|-----------------|------|
| 30-second mental model | [project-overview.md](./project-overview.md) |
| Top-level folders | [repo-layout.md](./repo-layout.md) |
| Rules before editing | [agent-playbook.md](./agent-playbook.md) |
| Symptom → area routing | [bug-triage.md](./bug-triage.md) |
| UI primitives (Button, Modal, etc.) | [layers/ui-components.md](./layers/ui-components.md) |
| Data flow & state | [layers/data-store.md](./layers/data-store.md) |


## By layer

| Layer | Primary pages |
|-------|---------------|
| Frontend (Next.js App Router) | `app/` pages, `components/` |
| State & data | `lib/store.tsx`, `lib/data.ts`, `lib/supabase/` |
| Styling | Tailwind v4 in `app/globals.css` |
| Auth & backend | `lib/supabase/`, `proxy.ts`, `supabase/schema.sql` |


## Quick facts

| Item | Value |
|------|-------|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript 5, React 19 |
| CSS | Tailwind CSS v4 (`@theme` tokens in globals.css) |
| Animations | Framer Motion (card entrance, star burst, page transitions) |
| UI Language | Italian (UI, seed data, time-ago strings) |
| Brand | `#f97316` orange primary, Space Grotesk display + Inter body |
| Auth | Supabase SSR: OAuth (GitHub/Google) + Magic Link email |
| DB | PostgreSQL via Supabase + RLS policies |
| Hosting | Vercel |
| PWA | Standalone mode, service worker (offline cache), SVG icon |


## All wiki files

| File | Scope |
|------|-------|
| [index.md](./index.md) | This hub |
| [project-overview.md](./project-overview.md) | Architecture + what the app does |
| [repo-layout.md](./repo-layout.md) | Folder-by-folder map |
| [agent-playbook.md](./agent-playbook.md) | When to edit what, anti-patterns |
| [bug-triage.md](./bug-triage.md) | Symptom → file routing |
| [layers/ui-components.md](./layers/ui-components.md) | Shared UI primitives |
| [layers/data-store.md](./layers/data-store.md) | State, seed, Supabase data flow |
