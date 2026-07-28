"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Handshake,
  Lightbulb,
  LogOut,
  Mail,
  Rocket,
  Send,
  Star,
  Users,
} from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}
import { useStore } from "@/lib/store";
import { Availability, ROLE_COLORS, ROLE_LABELS, RoleBadge } from "@/lib/types";
import { cn, gradientFor, initials, timeAgo } from "@/lib/utils";
import { Avatar, Badge, Button, FeedSkeleton, Input } from "@/components/ui";
import { Logo } from "@/components/app-shell";

const PILLARS = [
  { icon: Lightbulb, title: "Idee in chiaro", text: "Pubblica la tua idea come un README. Le stelle della community la portano in cima." },
  { icon: Users, title: "Co-founder matching", text: "Niente CV: ti candidi con il tuo profilo di competenze e un mini-pitch." },
  { icon: Rocket, title: "Prima si fa, poi si funda", text: "Costruisci l'MVP con il team, la trazione arriva prima degli investitori." },
];

const AVAILABILITY: { id: Availability; dot: string; label: string }[] = [
  { id: "available", dot: "bg-emerald-500", label: "Disponibile" },
  { id: "consulting", dot: "bg-amber-500", label: "Solo consulenza" },
  { id: "busy", dot: "bg-red-500", label: "Impegnato" },
];

function LoginScreen() {
  const { login, toast } = useStore();
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [role, setRole] = useState<RoleBadge>("tech_dev");

  const go = () => {
    if (name.trim().length < 3) return toast("Inserisci il tuo nome");
    login(name.trim(), role, university.trim() || "Università");
    toast(`Benvenuto nella community, ${name.trim().split(" ")[0]}!`);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="dot-grid relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600 p-7 sm:p-10"
      >
        <span className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 animate-float rounded-full bg-white/15 blur-2xl" />
        <span className="pointer-events-none absolute -bottom-14 -left-8 h-52 w-52 rounded-full bg-black/10 blur-2xl" />
        <Logo size={48} />
        <h1 className="relative mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
          Il punto di gravità dell&apos;innovazione italiana.
        </h1>
        <p className="relative mt-3 max-w-md text-[15px] leading-relaxed text-white/90">
          Migliaia di studenti hanno idee. Altrettanti hanno le competenze per realizzarle.
          Qui, finalmente, si incontrano.
        </p>
      </motion.div>

      {/* Pillars */}
      <div className="grid gap-3 sm:grid-cols-3">
        {PILLARS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="rounded-3xl border border-line bg-surface p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10">
              <p.icon className="h-5 w-5 text-brand-500" />
            </div>
            <p className="mt-3 font-display text-sm font-bold text-ink">{p.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{p.text}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick signup */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-3xl border border-line bg-surface p-5 sm:p-7"
      >
        <h2 className="font-display text-xl font-bold text-ink">Entra nella community</h2>
        <p className="mt-1 text-sm text-muted">20 secondi, niente password. Il tuo profilo è il tuo proof of work.</p>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <button
            onClick={() => toast("Login con GitHub in arrivo con Supabase")}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-3 text-sm font-bold text-ink transition-colors hover:bg-bg"
          >
            <GithubIcon className="h-4.5 w-4.5" /> Continua con GitHub
          </button>
          <button
            onClick={() => toast("Magic link in arrivo con Supabase")}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-3 text-sm font-bold text-ink transition-colors hover:bg-bg"
          >
            <Mail className="h-4.5 w-4.5" /> Continua con Email
          </button>
        </div>

        <div className="my-4 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-muted">
          <span className="h-px flex-1 bg-line" /> oppure al volo <span className="h-px flex-1 bg-line" />
        </div>

        <div className="flex flex-col gap-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome e cognome" />
          <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="Università (es. Politecnico di Milano)" />
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Il tuo superpotere</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(ROLE_LABELS) as RoleBadge[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "cursor-pointer rounded-2xl border px-3 py-2.5 text-sm font-bold transition-all",
                    role === r
                      ? "border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                      : "border-line bg-surface text-muted hover:text-ink"
                  )}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
          <Button size="lg" className="mt-1 w-full" onClick={go}>
            Crea il mio profilo
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileView() {
  const { user, projects, stars, applications, logout, setAvailability, starCount } = useStore();
  const [tab, setTab] = useState<"progetti" | "salvati" | "candidature">("progetti");

  const mine = useMemo(() => projects.filter((p) => p.owner_id === user!.id), [projects, user]);
  const saved = useMemo(() => projects.filter((p) => stars.includes(p.id)), [projects, stars]);
  const myApps = useMemo(
    () => applications.filter((a) => a.applicant_id === user!.id),
    [applications, user]
  );
  const received = useMemo(
    () => applications.filter((a) => projects.some((p) => p.id === a.project_id && p.owner_id === user!.id)),
    [applications, projects, user]
  );

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header card */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-line bg-surface"
      >
        <div className={cn("dot-grid h-24 bg-gradient-to-br", gradientFor(user.full_name))} />
        <div className="px-5 pb-5 sm:px-7">
          <div className="-mt-10 flex items-end justify-between">
            <Avatar name={user.full_name} size="xl" className="ring-4 ring-surface" />
            <Button variant="secondary" size="sm" onClick={logout} className="mb-1">
              <LogOut className="h-3.5 w-3.5" /> Esci
            </Button>
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold text-ink">{user.full_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className={ROLE_COLORS[user.role_badge]}>{ROLE_LABELS[user.role_badge]}</Badge>
            {user.university && <span className="text-xs text-muted">{user.university}</span>}
          </div>

          {/* Availability */}
          <div className="mt-4 flex flex-wrap gap-2">
            {AVAILABILITY.map((a) => (
              <button
                key={a.id}
                onClick={() => setAvailability(a.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-all",
                  user.availability === a.id
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                    : "border-line bg-surface text-muted hover:text-ink"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", a.dot)} />
                {a.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-bg py-3.5 text-center">
            {[
              { n: mine.length, l: "Progetti creati" },
              { n: mine.reduce((acc, p) => acc + starCount(p), 0), l: "Stelle ricevute" },
              { n: myApps.length, l: "Candidature" },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-display text-xl font-bold text-ink">{s.n}</p>
                <p className="text-[11px] font-semibold text-muted">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Tabs */}
      <div className="flex gap-1.5 rounded-full border border-line bg-surface p-1.5">
        {(
          [
            { id: "progetti", label: "Progetti", icon: FolderKanban, n: mine.length },
            { id: "salvati", label: "Salvati", icon: Star, n: saved.length },
            { id: "candidature", label: "Candidature", icon: Send, n: myApps.length + received.length },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-bold transition-colors",
              tab === t.id ? "text-white" : "text-muted hover:text-ink"
            )}
          >
            {tab === t.id && (
              <motion.span
                layoutId="profile-tab"
                className="absolute inset-0 rounded-full bg-zinc-900 dark:bg-brand-500"
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
              />
            )}
            <t.icon className="relative h-4 w-4" />
            <span className="relative hidden sm:inline">{t.label}</span>
            <span className="relative text-xs opacity-70">{t.n}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "progetti" &&
        (mine.length === 0 ? (
          <EmptyState
            icon={<Lightbulb className="h-8 w-8 text-brand-500" />}
            title="Nessun progetto ancora"
            text="Pubblica la tua prima idea e inizia a raccogliere stelle."
            cta={{ href: "/nuovo", label: "Pubblica un'idea" }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {mine.map((p) => (
              <ProfileProjectRow key={p.id} id={p.id} title={p.title} sub={`${timeAgo(p.created_at)} · ${p.location}`} right={<StarRow n={starCount(p)} />} />
            ))}
          </div>
        ))}

      {tab === "salvati" &&
        (saved.length === 0 ? (
          <EmptyState
            icon={<Star className="h-8 w-8 text-brand-500" />}
            title="Nessuna stella data"
            text="Lascia una stella ai progetti che ti ispirano: li ritrovi qui."
            cta={{ href: "/", label: "Esplora il feed" }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {saved.map((p) => (
              <ProfileProjectRow key={p.id} id={p.id} title={p.title} sub={p.short_pitch} right={<StarRow n={starCount(p)} />} />
            ))}
          </div>
        ))}

      {tab === "candidature" && (
        <div className="flex flex-col gap-5">
          {received.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                <Handshake className="h-4 w-4 text-brand-500" /> Ricevute ({received.length})
              </h3>
              <div className="flex flex-col gap-2.5">
                {received.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-line bg-surface p-4">
                    <p className="text-sm font-bold text-ink">{a.target_role}</p>
                    <p className="mt-1 text-sm text-muted">{a.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
              <Send className="h-4 w-4 text-brand-500" /> Inviate ({myApps.length})
            </h3>
            {myApps.length === 0 ? (
              <EmptyState
                icon={<Send className="h-8 w-8 text-brand-500" />}
                title="Nessuna candidatura"
                text="Trova un progetto che ti gasa e candidati per un ruolo aperto."
                cta={{ href: "/esplora", label: "Vedi la classifica" }}
              />
            ) : (
              <div className="flex flex-col gap-2.5">
                {myApps.map((a) => {
                  const proj = projects.find((p) => p.id === a.project_id);
                  return (
                    <Link key={a.id} href={`/progetto/${a.project_id}`}>
                      <div className="rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-bg">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-ink">{proj?.title ?? "Progetto"}</p>
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400">in attesa</Badge>
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-brand-600 dark:text-brand-400">{a.target_role}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted">{a.message}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StarRow({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-1 text-sm font-bold text-ink">
      <Star className="h-4 w-4 fill-brand-500 text-brand-500" /> {n}
    </span>
  );
}

function ProfileProjectRow({ id, title, sub, right }: { id: string; title: string; sub: string; right: React.ReactNode }) {
  return (
    <Link href={`/progetto/${id}`}>
      <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-bg">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-display font-bold text-white", gradientFor(id))}>
          {initials(title).slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-ink">{title}</p>
          <p className="truncate text-xs text-muted">{sub}</p>
        </div>
        {right}
      </div>
    </Link>
  );
}

function EmptyState({ icon, title, text, cta }: { icon: React.ReactNode; title: string; text: string; cta: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line py-12 text-center">
      {icon}
      <p className="font-display font-bold text-ink">{title}</p>
      <p className="max-w-xs text-sm text-muted">{text}</p>
      <Link href={cta.href} className="mt-1">
        <Button>{cta.label}</Button>
      </Link>
    </div>
  );
}

export default function ProfiloPage() {
  const { user, hydrated } = useStore();
  if (!hydrated) return <FeedSkeleton />;
  return user ? <ProfileView /> : <LoginScreen />;
}
