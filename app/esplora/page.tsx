"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Flame, Rocket, Star, Trophy, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn, gradientFor, initials, timeAgo } from "@/lib/utils";
import { Badge, FeedSkeleton } from "@/components/ui";

type Range = "week" | "all";

export default function EsploraPage() {
  const { projects, hydrated, starCount, applications } = useStore();
  const [range, setRange] = useState<Range>("week");

  const ranked = useMemo(() => {
    const weekAgo = Date.now() - 7 * 864e5;
    const list =
      range === "week" ? projects.filter((p) => +new Date(p.created_at) > weekAgo) : projects;
    return [...list].sort((a, b) => starCount(b) - starCount(a));
  }, [projects, range, starCount]);

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  if (!hydrated) return <FeedSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-500">
          <Trophy className="h-3.5 w-3.5" />
          Esplora
        </div>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink">Classifica</h1>
        <p className="mt-1 text-sm text-muted">Le idee più stellate dalla community</p>
      </motion.div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { icon: Rocket, label: "Startup attive", value: projects.length },
          { icon: Users, label: "Talenti", value: 120 + projects.length * 3 },
          { icon: Star, label: "Candidature", value: applications.length + 34 },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl border border-line bg-surface p-4 text-center">
            <s.icon className="mx-auto h-5 w-5 text-brand-500" />
            <p className="mt-1.5 font-display text-2xl font-bold text-ink">{s.value}</p>
            <p className="text-[11px] font-semibold text-muted">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Range toggle */}
      <div className="flex gap-1.5 rounded-full border border-line bg-surface p-1.5">
        {(
          [
            { id: "week", label: "Questa settimana", icon: Flame },
            { id: "all", label: "Di sempre", icon: Crown },
          ] as const
        ).map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={cn(
              "relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-bold transition-colors",
              range === r.id ? "text-white" : "text-muted hover:text-ink"
            )}
          >
            {range === r.id && (
              <motion.span
                layoutId="range-pill"
                className="absolute inset-0 rounded-full bg-zinc-900 dark:bg-brand-500"
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
              />
            )}
            <r.icon className="relative h-4 w-4" />
            <span className="relative">{r.label}</span>
          </button>
        ))}
      </div>

      {ranked.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line py-14 text-center">
          <p className="font-display font-bold text-ink">Nessun progetto in questo periodo</p>
          <p className="mt-1 text-sm text-muted">Pubblica la tua idea e prendi la vetta.</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className="grid grid-cols-3 items-end gap-3">
            {[podium[1], podium[0], podium[2]].map(
              (p, i) =>
                p && (
                  <Link key={p.id} href={`/progetto/${p.id}`} className="group">
                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.08, type: "spring", damping: 24 }}
                      className={cn(
                        "flex flex-col items-center rounded-3xl border border-line bg-surface p-4 text-center transition-shadow group-hover:shadow-lg",
                        i === 1 && "border-brand-500/40 bg-gradient-to-b from-brand-500/10 to-surface pb-6"
                      )}
                    >
                      <span className="text-2xl">{i === 1 ? "🥇" : i === 0 ? "🥈" : "🥉"}</span>
                      <div
                        className={cn(
                          "mt-2 flex items-center justify-center rounded-2xl bg-gradient-to-br font-display font-bold text-white",
                          gradientFor(p.id),
                          i === 1 ? "h-16 w-16 text-2xl" : "h-12 w-12 text-lg"
                        )}
                      >
                        {initials(p.title).slice(0, 1)}
                      </div>
                      <p className={cn("mt-2 line-clamp-1 font-display font-bold text-ink", i === 1 ? "text-base" : "text-sm")}>
                        {p.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-muted">
                        <Star className="h-3 w-3 fill-brand-500 text-brand-500" /> {starCount(p)}
                      </p>
                    </motion.div>
                  </Link>
                )
            )}
          </div>

          {/* Rest of ranking */}
          {rest.length > 0 && (
            <div className="overflow-hidden rounded-3xl border border-line bg-surface">
              {rest.map((p, i) => (
                <Link key={p.id} href={`/progetto/${p.id}`}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                    className="flex items-center gap-3.5 border-b border-line p-4 transition-colors last:border-0 hover:bg-bg"
                  >
                    <span className="w-6 text-center font-display text-lg font-bold text-muted/60">{i + 4}</span>
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-display text-sm font-bold text-white",
                        gradientFor(p.id)
                      )}
                    >
                      {initials(p.title).slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-ink">{p.title}</p>
                      <p className="truncate text-xs text-muted">
                        {p.location} · {timeAgo(p.created_at)}
                      </p>
                    </div>
                    {p.tags[0] && <Badge className="hidden bg-line/70 text-muted sm:inline-flex">{p.tags[0]}</Badge>}
                    <span className="flex items-center gap-1 text-sm font-bold text-ink">
                      <Star className="h-4 w-4 fill-brand-500 text-brand-500" />
                      {starCount(p)}
                    </span>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
