"use client";

import Link from "next/link";
import { ArrowRight, Crown, FolderKanban, Plus, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, Button, FeedSkeleton } from "@/components/ui";

export default function DashboardPage() {
  const { authReady, user, projects, canAccessFounder } = useStore();

  if (!authReady || !user) return <FeedSkeleton />;
  const myProjects = projects.filter((project) => project.owner_id === user.id);
  const activeProjects = myProjects.filter((project) => project.is_active !== false);

  return (
    <div className="flex flex-col gap-7">
      <header className="pt-2">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-500">La tua area</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Bentornato, {user.full_name.split(" ")[0]}</h1>
        <p className="mt-2 text-sm text-muted">Dai forma alle tue idee e trova le persone giuste per realizzarle.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-line bg-surface p-4">
          <FolderKanban className="h-5 w-5 text-brand-500" />
          <p className="mt-3 font-display text-2xl font-bold text-ink">{activeProjects.length}</p>
          <p className="text-xs font-semibold text-muted">Progetti attivi</p>
        </div>
        <Link href="/esplora" className="rounded-3xl border border-line bg-surface p-4 transition-colors hover:bg-bg">
          <Sparkles className="h-5 w-5 text-brand-500" />
          <p className="mt-3 font-display text-lg font-bold text-ink">Esplora</p>
          <p className="text-xs font-semibold text-muted">Scopri idee e progetti</p>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/progetti" className="group rounded-3xl border border-line bg-surface p-5 transition-colors hover:bg-bg">
          <FolderKanban className="h-6 w-6 text-brand-500" />
          <h2 className="mt-3 font-display text-lg font-bold text-ink">Gestisci i tuoi progetti</h2>
          <p className="mt-1 text-sm text-muted">Modifica fase, archivia idee e gestisci le candidature.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600 dark:text-brand-400">Apri Progetti <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
        </Link>
        <Link href="/founder" className="group rounded-3xl border border-line bg-surface p-5 transition-colors hover:bg-bg">
          <Crown className="h-6 w-6 text-brand-500" />
          <h2 className="mt-3 font-display text-lg font-bold text-ink">Spazio Founder</h2>
          <p className="mt-1 text-sm text-muted">Strumenti selezionati e un canale diretto con SparkLab.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600 dark:text-brand-400">{canAccessFounder ? "Entra nello spazio" : "Scopri come accedere"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
        </Link>
      </div>

      <section className="rounded-3xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">I tuoi progetti</h2>
            <p className="mt-1 text-sm text-muted">{myProjects.length ? `${myProjects.length} progetti pubblicati` : "Non hai ancora pubblicato un progetto."}</p>
          </div>
          <Link href="/nuovo" aria-label="Pubblica un progetto" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600"><Plus className="h-5 w-5" /></Link>
        </div>
        {myProjects.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {myProjects.slice(0, 3).map((project) => (
              <Link key={project.id} href={`/progetto/${project.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 hover:bg-bg">
                <span className="min-w-0 truncate text-sm font-semibold text-ink">{project.title}</span>
                <Badge className={project.is_active === false ? "bg-line text-muted" : "bg-brand-500/10 text-brand-600 dark:text-brand-400"}>{project.is_active === false ? "Archiviato" : project.stage === "launch" ? "Lancio" : "Idea"}</Badge>
              </Link>
            ))}
          </div>
        )}
        <Link href="/progetti" className="mt-4 inline-flex text-sm font-bold text-brand-600 dark:text-brand-400">Gestisci tutti i progetti →</Link>
      </section>

      {!myProjects.length && <Link href="/nuovo"><Button size="lg" className="w-full">Pubblica la tua prima idea</Button></Link>}
    </div>
  );
}
