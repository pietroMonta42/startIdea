---
name: read-wiki
description: Navigates the project agent wiki under .opencode/wiki/ to orient quickly before code changes. Use when starting work in this repo, locating components, routing symptoms to files, or when the user mentions the wiki or asks where something lives. Skip when the user already names a concrete file or folder.
---

# Read Wiki

Orient before searching code. **Less context = fewer tokens.**

Wiki root: `.opencode/wiki/`

## Scope contract (always first)

Before reading anything, state the scope in one line:

```
Scope: read only <wiki-page-or-skip>. Do not scan other wiki pages or repo files.
Output: ≤50 lines — product, layer, start path, next grep target.
```

| User gave… | Wiki action |
|------------|-------------|
| Concrete file path | **Skip wiki** — open that file only |
| Symptom only | Read `bug-triage.md` — pick **one** branch, stop |
| "New to repo" / no path | Skim root `index.md` Quick facts only + **one** Start-here page |
| Component/feature name | Read **one** layer/domain page from routing table below |

**Never** linearly read all wiki files. **Never** read wiki when the task already scopes a file.

## Quick start (max 2 reads)

1. If needed: skim [index.md](../../.opencode/wiki/index.md) **Quick facts table only**.
2. Pick **one** page from routing table (or bug-triage decision tree).
3. Read **only** that page. Stop when you have folder path + search keyword.

Page inventory (no content) → [pages.md](pages.md)

## Routing (startIdea-specific)

| Need | Read first |
|------|------------|
| New to repo | [project-overview.md](../../.opencode/wiki/project-overview.md) |
| Top-level layout | [repo-layout.md](../../.opencode/wiki/repo-layout.md) |
| Where to edit safely | [agent-playbook.md](../../.opencode/wiki/agent-playbook.md) |
| Symptom → file | [bug-triage.md](../../.opencode/wiki/bug-triage.md) |
| UI primitives (Button, Modal, etc.) | [layers/ui-components.md](../../.opencode/wiki/layers/ui-components.md) |
| Data flow / state / auth | [layers/data-store.md](../../.opencode/wiki/layers/data-store.md) |
| Page-specific logic | `app/<slug>/page.tsx` — use repo-layout to find the right slug |
| Supabase schema | `supabase/schema.sql` — or read schema.sql directly |
| CSS / theme | `app/globals.css` |

## Navigation (index-first)

- Read root [index.md](../../.opencode/wiki/index.md) before deep-diving.
- Concept pages have YAML frontmatter with required `type`.

## Reading rules

- **One page at a time** — stop when you have a folder path and search keyword.
- **Do not** linearly read all wiki files or crawl the wiki on every task.
- **Do not** treat wiki as bug context — task/PR holds ticket-specific detail.
- **Cross-links** — follow at most **one** hop unless still lost.
- After wiki read, prefer **one targeted grep** in the mapped path over repo-wide search.

## When wiki is enough vs when to search code

| Wiki answers | Code search needed |
|--------------|-------------------|
| Which file handles X | Exact line/function within that file |
| What component to use | Component prop signatures not documented |
| Data flow / state shape | Specific store implementation line |
| Symptom → file routing | New code since last wiki update |

If wiki and code disagree, trust code and note a wiki update (see [update-wiki](../update-wiki/SKILL.md)).

## Output after reading (≤50 lines)

Before editing, state briefly:

1. **Area** (page / component / store / schema)
2. **Start path** (concrete file)
3. **Next action** (one grep/search command in that scope)

Then proceed with code search in that scope only.
