"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Flame, GitBranch, Lightbulb, MessageCircle, Sparkles, Star, TrendingUp, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn, gradientStyle, scrimStyle, timeAgo } from "@/lib/utils";
import { Logo } from "@/components/app-shell";

const STEPS = [
  {
    icon: Lightbulb,
    title: "Pubblica l'idea",
    text: "Scrivi il pitch in 140 caratteri, aggiungi un README e i ruoli che cerchi. Niente pitch deck, niente formalità.",
  },
  {
    icon: Star,
    title: "Raccogli stelle",
    text: "La community valida le idee con le stelle. Le migliori salgono in classifica e attirano i talenti giusti.",
  },
  {
    icon: Users,
    title: "Trova il team",
    text: "Chi ha le competenze vede le tue stole aperte e si candida con un messaggio mirato. Tu scegli chi sale a bordo.",
  },
];

const VALUES = [
  { icon: Compass, label: "Co-founding", text: "Non cerchiamo dipendenti. Cerchiamo co-founder." },
  { icon: Sparkles, label: "Proof of work", text: "Il CV è il portfolio di progetti reali che costruisci qui." },
  { icon: GitBranch, label: "Open by default", text: "Le idee sono pubbliche. L'esecuzione fa la differenza, non il segreto." },
];

export default function HomePage() {
  const { user, authReady, projects, starCount, commentsFor, profiles } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (authReady && user) router.replace("/esplora");
  }, [authReady, user, router]);

  const stats = useMemo(() => {
    const totalStars = projects.reduce((acc, p) => acc + starCount(p), 0);
    const totalComments = projects.reduce((acc, p) => acc + commentsFor(p.id).length, 0);
    return { projects: projects.length, stars: totalStars, comments: totalComments };
  }, [projects, starCount, commentsFor]);

  const featured = useMemo(
    () => [...projects].sort((a, b) => starCount(b) - starCount(a)).slice(0, 3),
    [projects, starCount]
  );

  return (
    <div className="flex flex-col gap-10 pt-2">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-5 py-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 220 }}
          className="rounded-[28%] shadow-xl shadow-brand-500/20 ring-1 ring-line"
          style={{ background: "var(--surface)" }}
        >
          <Logo size={84} />
        </motion.div>

        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">SparkLab</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-brand-500">Il punto di gravità dell&apos;innovazione italiana</p>
        </div>

        <p className="max-w-md text-base leading-relaxed text-muted">
          La community dove studenti con idee incontrano studenti con competenze. Pubblica la tua startup, raccogli stelle, trova il tuo co-founder.
        </p>

        <div className="flex w-full max-w-xs flex-col gap-2.5">
          <Link
            href="/profilo"
            className="group flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-500 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600"
          >
            Entra nella community
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/esplora"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-sm font-semibold text-ink transition-colors hover:bg-bg"
          >
            <Compass className="h-4 w-4" />
            Esplora le idee
          </Link>
        </div>
      </motion.div>

      {/* Steps */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex flex-col gap-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted">Come funziona</h2>
        <div className="flex flex-col gap-2.5">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="flex gap-3.5 rounded-3xl border border-line bg-surface p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display font-bold text-ink">{i + 1}. {s.title}</p>
                <p className="mt-0.5 text-sm leading-snug text-muted">{s.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Values */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="flex flex-col gap-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted">La direzione</h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.label} className="flex flex-col gap-2 rounded-3xl border border-line bg-surface p-4">
              <v.icon className="h-5 w-5 text-brand-500" />
              <p className="font-display text-sm font-bold text-ink">{v.label}</p>
              <p className="text-xs leading-snug text-muted">{v.text}</p>
            </div>
          ))}
        </div>
        <p className="px-1 pt-2 text-center text-xs leading-relaxed text-muted">
          SparkLab nasce per ridurre la distanza tra un&apos;idea e un team. Niente funding, niente CV: si parte dalle prove di lavoro.
          <br />In produzione, pulita, italiana.
        </p>
      </motion.div>

      {/* Live community stats */}
      {stats.projects > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="flex flex-col gap-3">
          <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted">La community ora</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Flame, label: "Startup attive", value: stats.projects },
              { icon: Star, label: "Stelle date", value: stats.stars },
              { icon: MessageCircle, label: "Commenti", value: stats.comments },
            ].map((s) => (
              <div key={s.label} className="rounded-3xl border border-line bg-surface p-4 text-center shadow-sm">
                <s.icon className="mx-auto h-5 w-5 text-brand-500" />
                <p className="mt-1.5 font-display text-2xl font-bold text-ink">{s.value}</p>
                <p className="text-[11px] font-semibold text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* In evidenza — top 3 progetti live */}
      {featured.length >= 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <TrendingUp className="h-4 w-4 text-brand-500" />
            <h2 className="font-display text-sm font-bold text-ink">In evidenza</h2>
            <span className="text-xs text-muted">· le idee più stellate di sempre</span>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 no-scrollbar">
            {featured.map((p, i) => {
              const owner = profiles.find((pr) => pr.id === p.owner_id);
              return (
                <Link
                  key={p.id}
                  href={`/progetto/${p.id}`}
                  className="group w-[78%] shrink-0 overflow-hidden rounded-3xl border border-line bg-surface shadow-sm transition-shadow hover:shadow-xl hover:shadow-zinc-950/5 sm:w-[31%]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden" style={gradientStyle(p, { dots: true })}>
                    <span className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl" style={{ backgroundColor: "rgba(255,255,255,0.18)" }} />
                    <span className="pointer-events-none absolute inset-0" style={scrimStyle()} />
                    <span className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                      <span className="text-base leading-none">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {starCount(p)}
                    </span>
                    <h3 className="absolute inset-0 z-10 flex items-center justify-center px-4 text-center font-display text-2xl font-bold tracking-tight text-white drop-shadow-md transition-transform duration-500 group-hover:scale-[1.04]">
                      {p.title}
                    </h3>
                  </div>
                  <div className="p-3.5">
                    <p className="truncate font-bold text-ink">{p.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {owner ? `${owner.full_name.split(" ")[0]} · ` : ""}
                      {timeAgo(p.created_at)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="px-1 pt-1">
            <Link
              href="/esplora"
              className="group inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400"
            >
              Vedi tutte le idee
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}