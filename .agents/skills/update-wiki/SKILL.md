---
name: update-wiki
description: Updates the project agent wiki in .opencode/wiki/ when repo structure, components, or recurring patterns change. Use when the user asks to update the wiki, after discovering structural drift, or when adding a new page/component/store action. Do not crawl the full wiki — edit only affected page(s).
---

# Update Wiki

Maintain `.opencode/wiki/` as a **general-purpose navigation map** — not a bug log.

**Less context = fewer tokens.** Update only what changed; do not re-read or verify every wiki page.

## Scope contract (always first)

Before editing, state:

```
Scope: update only <target-page.md> [+ index.md if new page/tier].
Do not read other wiki pages unless a cross-link must change.
Output: ≤50 lines — what changed and why.
```

## When to update

| Update wiki | Do not update wiki |
|-------------|-------------------|
| **Recurring** navigation pattern (2+ tasks same area) | One-off bug fix with no reusable routing |
| New page, component, or store action file | Branch/PR/ticket numbers in wiki body |
| New Supabase table or RLS policy | Single investigation notes |
| Renamed paths, moved modules | Duplicate content already on another page |
| Symptom misroutes agents twice | Temporary local env quirks |
| Wiki page contradicts current repo layout | "Document everything" bulk passes |

**Default:** skip wiki update unless the change helps **future** agents navigate faster.

## Workflow (minimal reads)

```
Task Progress:
- [ ] Confirm pattern is recurring or structural (not ticket-specific)
- [ ] Identify target file(s) — read ONLY those + index if needed
- [ ] Edit minimally — paths, tables, one-line flows
- [ ] Set/update YAML frontmatter (type required; bump timestamp if present)
- [ ] Add cross-links ([← Index], Related) on changed page only
- [ ] Update root index.md if new page or tier change
- [ ] Update read-wiki/pages.md inventory if new page
- [ ] Do not bloat — link instead of copy
```

## File placement (startIdea-specific)

| Content type | Target file |
|--------------|-------------|
| New page/route (e.g. `/settings`) | `repo-layout.md` + root `index.md` Quick facts |
| New component | `layers/ui-components.md` or `repo-layout.md` |
| New store action/selector | `layers/data-store.md` |
| New DB table/policy | `supabase/schema.sql` (idempotent) + `layers/data-store.md` |
| New seed project/profile | `lib/data.ts` |
| Symptom routing | `bug-triage.md` keyword table |
| Agent conventions / anti-patterns | `agent-playbook.md` |
| 2+ related domain pages | `domains/` subfolder + `domains/index.md` |
| CSS theme change | `app/globals.css` + note in `agent-playbook.md` |

Full authoring rules → [guidelines.md](guidelines.md)

## New page checklist

1. Create `.opencode/wiki/<name>.md` with YAML frontmatter (`type`, `title`, `tier` minimum)
2. Body: `[← Index](./index.md)` or `[← Index](../index.md)` at top (adjust depth)
3. Add to root `index.md` "All wiki files" + "Start here" tables
4. Add row to `read-wiki/pages.md`
5. Link from 1–2 related pages only (Related section)
6. Keep under ~150 lines; split into subfolder + index if longer

## Page template

```markdown
---
type: Layer Guide
title: Title
description: One-line scope.
tier: layer
tags: []
resource: path/to/code
timestamp: 2026-07-28T00:00:00Z
---

# Title

[← Index](./index.md)

One-paragraph scope.

---

## Section
(tables, paths, flows)

---

## Related
- [other-page.md](./other-page.md)
```

## Anti-patterns

- No bug IDs, branch names, or "fixed in PR X"
- No long code dumps — path + pattern only
- No duplicating paragraphs across files — use links
- No full-wiki crawl before or after a small edit
- No vague updates ("refresh the wiki") — name the target page
- No concept frontmatter on subfolder `index.md`
- Do not put long prose in `index.md` — listings and Quick facts only
