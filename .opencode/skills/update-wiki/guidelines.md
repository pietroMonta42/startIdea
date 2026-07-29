# Wiki Authoring Guidelines

## Principles

1. **Start minimal, grow incrementally** — bootstrap is thin; expand via `update-wiki` when patterns repeat.
2. **General, not specific** — patterns and paths; task context stays in chat/PR.
3. **Modular** — many small files; root `index.md` is the hub.
4. **Token-efficient** — tables and bullet paths over prose; ≤50 lines of agent output per wiki touch.
5. **Cross-linked** — every concept links back to index + 2–6 related pages.
6. **Scoped edits** — update only the page(s) affected; never crawl the full wiki to audit or sync.
7. **Structured metadata** — YAML frontmatter with required `type`; optional `tags`, `resource`, `timestamp`.

## YAML frontmatter

Required on every concept page:

```yaml
type: Layer Guide    # required
title: Page Name     # recommended
tier: layer          # core | layer | domain
```

Add when useful: `description`, `tags`, `resource` (primary code path), `timestamp` (ISO 8601).

Bootstrap stubs may use only `type`, `title`, `tier` — enrich on first substantive `update-wiki`.

## Tiers (root index.md)

| Tier | Purpose | Examples |
|------|---------|----------|
| Core | Read first | overview, repo-layout, playbook, bug-triage |
| Layer | Technology axis | `layers/ui-components.md`, `layers/data-store.md` |
| Domain | Recurring product area | `domains/*` per-product or per-feature guides |

Add a **Domain** page only when a topic needs its own routing and would make a Layer page too long.

## index.md rules

- **Root** `index.md`: optional `okf_version` frontmatter only; Start here, By layer, Quick facts, All wiki files.
- **Subfolder** `index.md`: **no frontmatter**; bullet list of concepts in that folder.
- Never use `index.md` as a concept document filename.

## Maintenance triggers

Update wiki when:

- Same symptom or folder misroutes agents **twice**
- New file in `app/`, `components/`, or `lib/`
- New Supabase table or RLS policy
- Renamed or moved module
- New recurring bug pattern

Skip wiki update for routine feature work inside existing folders unless navigation changed.
