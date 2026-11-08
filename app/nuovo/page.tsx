"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Lightbulb, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { ProjectRoleInput } from "@/lib/types";
import { ALL_CATEGORIES, categoryLabel } from "@/lib/data";
import { cn, gradientStyle, isValidHttpUrl, normalizeExternalUrl, PROJECT_STYLES } from "@/lib/utils";
import { Button, FeedSkeleton, Input, Textarea } from "@/components/ui";
import { FieldLabel, selectClass } from "@/components/form-bits";
import { RoleCard, RoleForm } from "@/components/role-form";

const DRAFT_KEY = "sparklab-new-project-draft-v2";
const STEPS = ["Idea", "Progetto", "Team"] as const;

interface Draft {
  step: number;
  title: string;
  pitch: string;
  categories: string[];
  location: string;
  university: string;
  problem: string;
  solution: string;
  progress: string;
  stage: "idea" | "launch";
  link: string;
  theme: number;
  roles: ProjectRoleInput[];
}

const EMPTY_DRAFT: Draft = {
  step: 0, title: "", pitch: "", categories: [], location: "", university: "",
  problem: "", solution: "", progress: "", stage: "idea", link: "", theme: 0, roles: [],
};

export default function NuovoPage() {
  const { user, authReady, addProject, toast } = useStore();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [ready, setReady] = useState(false);
  const [adding, setAdding] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const skipSave = useRef(false);

  // Ripristina la bozza salvata in locale (una sola volta, solo lato client).
  useEffect(() => {
    let restored: Draft | null = null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) restored = { ...EMPTY_DRAFT, ...JSON.parse(raw) };
    } catch {
      restored = null;
    }
    if (restored) setDraft(restored);
    setReady(true);
  }, []);

  // Salva la bozza a ogni modifica.
  useEffect(() => {
    if (!ready || skipSave.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage non disponibile: la bozza resta solo in memoria */
    }
  }, [draft, ready]);

  if (!authReady || !ready) return <FeedSkeleton />;

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-500/10">
          <Lightbulb className="h-8 w-8 text-brand-500" />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">Hai un&apos;idea da lanciare?</h1>
        <p className="max-w-xs text-sm text-muted">Crea prima il tuo profilo: ci vogliono 20 secondi.</p>
        <Link href="/profilo"><Button size="lg">Vai al Profilo</Button></Link>
      </div>
    );
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const toggleCategory = (c: string) =>
    set("categories", draft.categories.includes(c) ? draft.categories.filter((x) => x !== c) : draft.categories.length < 3 ? [...draft.categories, c] : draft.categories);

  const validate = (step: number): string | null => {
    if (step === 0) {
      if (draft.title.trim().length < 3) return "Il nome del progetto è troppo corto";
      if (draft.pitch.trim().length < 10) return "La tagline deve dire qualcosa di concreto (almeno 10 caratteri)";
      if (draft.categories.length === 0) return "Scegli almeno un settore";
      if (!draft.location.trim()) return "Aggiungi la città";
    }
    if (step === 1) {
      if (draft.problem.trim().length < 10) return "Descrivi il problema (almeno 10 caratteri)";
      if (draft.solution.trim().length < 10) return "Descrivi la soluzione (almeno 10 caratteri)";
      if (draft.link.trim() && !isValidHttpUrl(draft.link)) return "Il link del progetto non è valido";
    }
    if (step === 2 && draft.roles.length === 0) return "Aggiungi almeno una posizione aperta";
    return null;
  };

  const goNext = () => {
    const error = validate(draft.step);
    if (error) return toast(error);
    set("step", draft.step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goBack = () => {
    set("step", draft.step - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const publish = async () => {
    for (const s of [0, 1, 2]) {
      const error = validate(s);
      if (error) {
        set("step", s);
        return toast(error);
      }
    }
    setPublishing(true);
    const id = await addProject(
      {
        title: draft.title.trim(),
        short_pitch: draft.pitch.trim(),
        location: draft.location.trim(),
        university: draft.university.trim() || null,
        link: draft.link.trim() ? normalizeExternalUrl(draft.link) : null,
        stage: draft.stage,
        tags: draft.categories,
        readme_markdown: "",
        problem: draft.problem.trim(),
        solution: draft.solution.trim(),
        progress: draft.progress.trim(),
        theme: draft.theme,
      },
      draft.roles
    );
    setPublishing(false);
    if (!id) return;
    skipSave.current = true;
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    toast("Idea pubblicata!");
    router.push(`/progetto/${id}`);
  };

  const step = draft.step;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-500">
          <Lightbulb className="h-3.5 w-3.5" />
          Pubblica un&apos;idea
        </div>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink">La tua startup, in chiaro.</h1>
        <p className="mt-1 text-sm text-muted">Tre passaggi rapidi. La bozza si salva da sola su questo dispositivo.</p>
      </motion.div>

      {/* Barra di avanzamento */}
      <nav aria-label="Avanzamento" className="flex flex-col gap-2">
        <div className="flex gap-1.5">
          {STEPS.map((label, i) => (
            <div key={label} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <motion.div className="h-full bg-brand-500" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.3 }} />
            </div>
          ))}
        </div>
        <ol className="grid grid-cols-3 text-xs font-bold">
          {STEPS.map((label, i) => (
            <li key={label} className={cn("flex items-center gap-1.5", i === 1 && "justify-center", i === 2 && "justify-end", i <= step ? "text-brand-600 dark:text-brand-400" : "text-muted")}>
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[10px]", i < step ? "bg-brand-500 text-white" : i === step ? "border border-brand-500" : "border border-line")}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 sm:p-7">
        {step === 0 && (
          <>
            <label className="block">
              <FieldLabel hint={`${draft.title.length}/30`}>Nome del progetto</FieldLabel>
              <Input value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Es. ThesisAI" maxLength={30} />
            </label>
            <label className="block">
              <FieldLabel hint={`${draft.pitch.length}/140`}>Tagline breve</FieldLabel>
              <Textarea rows={2} value={draft.pitch} onChange={(e) => set("pitch", e.target.value.slice(0, 140))} placeholder="Una frase: cosa fai e per chi" />
            </label>
            <div>
              <FieldLabel hint="massimo 3">Settore</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={draft.categories.includes(category)}
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      "cursor-pointer rounded-full border px-3.5 py-2 text-sm font-semibold transition-all",
                      draft.categories.includes(category) ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-surface text-muted hover:text-ink"
                    )}
                  >
                    {categoryLabel(category)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>Città</FieldLabel>
                <Input value={draft.location} onChange={(e) => set("location", e.target.value)} placeholder="Es. Milano" />
              </label>
              <label className="block">
                <FieldLabel hint="facoltativo">Ateneo</FieldLabel>
                <Input value={draft.university} onChange={(e) => set("university", e.target.value)} placeholder="Es. Politecnico di Milano" />
              </label>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <label className="block">
              <FieldLabel>Il problema</FieldLabel>
              <Textarea rows={4} maxLength={2000} value={draft.problem} onChange={(e) => set("problem", e.target.value)} placeholder="Quale problema risolvi? Chi lo vive ogni giorno?" />
            </label>
            <label className="block">
              <FieldLabel>La soluzione</FieldLabel>
              <Textarea rows={4} maxLength={2000} value={draft.solution} onChange={(e) => set("solution", e.target.value)} placeholder="Come funziona la tua idea?" />
            </label>
            <label className="block">
              <FieldLabel hint="facoltativo">Stato di avanzamento</FieldLabel>
              <Textarea rows={3} maxLength={2000} value={draft.progress} onChange={(e) => set("progress", e.target.value)} placeholder="Dove siete arrivati? Cosa manca per l'MVP?" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>Fase</FieldLabel>
                <select value={draft.stage} onChange={(e) => set("stage", e.target.value as "idea" | "launch")} className={selectClass}>
                  <option value="idea">Idea</option>
                  <option value="launch">Lancio</option>
                </select>
              </label>
              <label className="block">
                <FieldLabel hint="facoltativo">Link del progetto</FieldLabel>
                <Input type="url" inputMode="url" value={draft.link} onChange={(e) => set("link", e.target.value)} placeholder="https://…" />
              </label>
            </div>
            <div>
              <FieldLabel>Stile dell&apos;idea</FieldLabel>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                {PROJECT_STYLES.map((s, i) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => set("theme", i)}
                    className={cn("flex cursor-pointer flex-col gap-1.5 rounded-2xl border p-2 transition-all", draft.theme === i ? "border-amber-400 ring-2 ring-amber-400/40" : "border-line hover:border-muted")}
                    aria-label={s.label}
                  >
                    <span className="h-9 w-full rounded-xl" style={gradientStyle({ id: `__style__${i}`, theme: i })} />
                    <span className="truncate text-center text-[10px] font-bold text-ink">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Chi stai cercando?</h2>
              <p className="mt-0.5 text-sm text-muted">Aggiungi almeno una posizione aperta. Potrai modificarle o chiuderle in seguito dalla pagina del progetto.</p>
            </div>
            {draft.roles.length > 0 && (
              <div className="flex flex-col gap-3">
                {draft.roles.map((r, i) => (
                  <RoleCard key={`${r.title}-${i}`} role={r} onDelete={() => set("roles", draft.roles.filter((_, j) => j !== i))} />
                ))}
              </div>
            )}
            {adding || draft.roles.length === 0 ? (
              <div className="rounded-2xl border border-line bg-bg p-4">
                <RoleForm
                  submitLabel="Aggiungi posizione"
                  onError={toast}
                  onCancel={draft.roles.length > 0 ? () => setAdding(false) : undefined}
                  onSubmit={(role) => {
                    set("roles", [...draft.roles, role]);
                    setAdding(false);
                  }}
                />
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Aggiungi un&apos;altra posizione</Button>
            )}
          </>
        )}

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {step > 0 ? (
            <Button variant="secondary" size="lg" onClick={goBack}><ArrowLeft className="h-4 w-4" /> Indietro</Button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <Button size="lg" onClick={goNext}>Avanti <ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button size="lg" onClick={publish} disabled={publishing}>{publishing ? "Pubblico…" : "🚀 Pubblica il progetto"}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
