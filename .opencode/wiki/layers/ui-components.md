---
type: Layer Guide
title: UI Components
tier: layer
tags: [ui, components, tailwind, framer-motion]
resource: components/ui.tsx
---

# UI Components

[← Index](../index.md)

Shared UI primitives. Everything lives in `components/ui.tsx`. No shadcn — hand-rolled with Tailwind v4 + Framer Motion.

## Primitives

| Component | Props | Usage |
|-----------|-------|-------|
| `Button` | `variant` ("primary" \| "secondary" \| "ghost" \| "dark"), `size` ("sm" \| "md" \| "lg"), all `<button>` attrs | Tap-animated button with 4 style variants |
| `Badge` | `children`, `className` | Small rounded pill (11px, bold, tracking-wide) |
| `Avatar` | `name: string`, `size` ("sm" \| "md" \| "lg" \| "xl") | Gradient background + initials derived from name |
| `Modal` | `open`, `onClose`, `title`, `children` | Bottom-sheet on mobile (`rounded-t-3xl`), centered dialog on desktop. Backdrop with blur. Spring animation via Framer Motion AnimatePresence |
| `Input` | All `<input>` attrs | `h-11`, rounded-2xl, border-line, focus:brand-500 ring |
| `Textarea` | All `<textarea>` attrs | Same styling as Input, `py-3` |
| `Skeleton` | `className` | Shimmer animation (skeleton class from globals.css) |
| `FeedSkeleton` | — | 3 placeholder cards with skeleton sub-elements |

## Theming

All primitives use CSS vars defined in `app/globals.css`:
- `--surface` → `bg-surface` — card background
- `--line` → `border-line` — borders
- `--ink` → `text-ink` — primary text
- `--muted` → `text-muted` — secondary text
- `--bg` → `bg-bg` — page background

Brand colors via Tailwind `@theme` tokens: `brand-50` through `brand-700` (orange `#f97316` based).

## Button variants

```
primary: bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600
secondary: border-line bg-surface text-ink hover:bg-bg
ghost: text-muted hover:bg-line/60 hover:text-ink
dark: bg-zinc-900 text-white dark:bg-white dark:text-zinc-900
```

## Modal behavior

- Mobile: slides up from bottom (`y: 60 → 0`), `rounded-t-3xl`, `max-h-[88vh] overflow-y-auto`
- Desktop: `sm:items-center`, `max-w-lg`, `rounded-3xl` on all sides
- Backdrop: `bg-zinc-950/50 backdrop-blur-sm`, click to close

## Notes

- All buttons use `whileTap={{ scale: 0.96 }}` (Framer Motion) — matches iOS feel
- All interactive elements have `cursor-pointer`
- No external UI library; this file is ~200 lines and covers all needs
