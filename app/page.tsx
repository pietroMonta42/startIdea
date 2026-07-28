"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownWideNarrow, Search, SearchX, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { ALL_TAGS } from "@/lib/data";
import { cn } from "@/lib/utils";
import ProjectCard from "@/components/project-card";
import { FeedSkeleton } from "@/components/ui";

type Sort = "recent" | "top";

export default function HomePage() {
  const { projects, hydrated } = useStore();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("Tutte");
  const [sort, setSort] = useState<Sort>("recent");

  const tags = useMemo(() => {
    const used = new Set(projects.flatMap((p) => p.tags));
    return ["Tutte", ...ALL_TAGS.filter((t) => used.has(t))];
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = projects.filter((p) => {
      const matchTag = tag === "Tutte" || p.tags.includes(tag);
      const matchQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.short_pitch.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.open_roles.some((r) => r.toLowerCase().includes(q)) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return matchTag && matchQuery;
    });
    list = [...list].sort((a, b) =>
      sort === "recent"
        ? +new Date(b.created_at) - +new Date(a.created_at)
        : b.stars_count - a.stars_count
    );
    return list;
  }, [projects, query, tag, sort]);

  return (
    <div className="flex flex-col gap-5">
      {/* Hero header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-500">
          <Sparkles className="h-3.5 w-3.5" />
          Community studenti builder
        </div>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Batch 2026
        </h1>
        <p className="mt-1 text-sm text-muted">
          {projects.length} startup attive · aggiornato oggi
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2.5"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per nome, settore, ruolo…"
            className="h-12 w-full rounded-2xl border border-line bg-surface pl-11 pr-4 text-sm text-ink shadow-sm outline-none transition-shadow placeholder:text-muted/70 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setSort((s) => (s === "recent" ? "top" : "recent"))}
          className={cn(
            "flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border shadow-sm transition-colors",
            sort === "top"
              ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "border-line bg-surface text-muted hover:text-ink"
          )}
          title={sort === "recent" ? "Ordina per stelle" : "Ordina per data"}
        >
          <ArrowDownWideNarrow className="h-5 w-5" />
        </motion.button>
      </motion.div>

      {/* Tag chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5"
      >
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => setTag(t)}
            className={cn(
              "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-all",
              tag === t
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                : "border-line bg-surface text-muted hover:text-ink"
            )}
          >
            {t}
          </button>
        ))}
      </motion.div>

      {/* Feed */}
      {!hydrated ? (
        <FeedSkeleton />
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line py-16 text-center"
        >
          <SearchX className="h-10 w-10 text-muted/50" />
          <p className="font-display font-bold text-ink">Nessun progetto trovato</p>
          <p className="max-w-xs text-sm text-muted">
            Prova a cambiare ricerca o filtro… oppure pubblica tu la prossima grande idea.
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
