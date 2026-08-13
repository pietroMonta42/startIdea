"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Search, Sparkles, Star } from "lucide-react";
import { useStore } from "@/lib/store";
import { ALL_TAGS } from "@/lib/data";
import { cn } from "@/lib/utils";
import ProjectCard from "@/components/project-card";
import { FeedSkeleton } from "@/components/ui";

type Sort = "top" | "comments" | "recent";

export default function EsploraPage() {
  const { projects, hydrated, starCount, commentsFor } = useStore();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("Tutte");
  const [sort, setSort] = useState<Sort>("top");

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
    list = [...list].sort((a, b) => {
      if (sort === "recent") return +new Date(b.created_at) - +new Date(a.created_at);
      if (sort === "comments") return commentsFor(b.id).length - commentsFor(a.id).length;
      return starCount(b) - starCount(a);
    });
    return list;
  }, [projects, query, tag, sort, starCount, commentsFor]);

  const featured = useMemo(
    () => [...projects].sort((a, b) => starCount(b) - starCount(a)).slice(0, 3),
    [projects, starCount]
  );

  const totalStars = useMemo(() => projects.reduce((acc, p) => acc + starCount(p), 0), [projects, starCount]);
  const totalComments = useMemo(() => projects.reduce((acc, p) => acc + commentsFor(p.id).length, 0), [projects, commentsFor]);

  const sorts: { id: Sort; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "top", label: "Stelle", icon: Star },
    { id: "comments", label: "Commenti", icon: MessageCircle },
    { id: "recent", label: "Recenti", icon: Sparkles },
  ];

  const filtering = query.trim() || tag !== "Tutte";

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-500">
          <Sparkles className="h-3.5 w-3.5" />
          Esplora
        </div>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink">Le idee della community</h1>
        <p className="mt-1 text-sm text-muted">
          {projects.length} startup · ordina per stelle, commenti o data
        </p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per nome, settore, ruolo…"
          className="h-12 w-full rounded-2xl border border-line bg-surface pl-11 pr-4 text-sm text-ink shadow-sm outline-none transition-shadow placeholder:text-muted/70 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
        />
      </motion.div>

      {/* Sort toggle (3-way) */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.14 }} className="flex gap-1.5 rounded-full border border-line bg-surface p-1.5">
        {sorts.map((s) => (
          <button
            key={s.id}
            onClick={() => setSort(s.id)}
            className={cn(
              "relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-bold transition-colors",
              sort === s.id ? "text-white" : "text-muted hover:text-ink"
            )}
          >
            {sort === s.id && (
              <motion.span layoutId="sort-pill" className="absolute inset-0 rounded-full bg-brand-500" transition={{ type: "spring", damping: 28, stiffness: 320 }} />
            )}
            <s.icon className="relative h-4 w-4" />
            <span className="relative">{s.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Tag chips */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => setTag(t)}
            className={cn(
              "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-all",
              tag === t
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-line bg-surface text-muted hover:text-ink"
            )}
          >
            {t}
          </button>
        ))}
      </motion.div>

      {/* Feed header */}
      {filtering && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-muted">
            {filtered.length} risultat{filtered.length === 1 ? "o" : "i"} per{" "}
            {tag !== "Tutte" ? `#${tag}` : `"${query.trim()}"`}
          </p>
          <button
            onClick={() => { setQuery(""); setTag("Tutte"); setSort("top"); }}
            className="text-xs font-bold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400"
          >
            Reset filtri
          </button>
        </div>
      )}

      {/* Feed */}
      {!hydrated ? (
        <FeedSkeleton />
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line py-16 text-center">
          <Search className="h-10 w-10 text-muted/50" />
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