"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lightbulb, MapPin, Plus, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { ALL_TAGS } from "@/lib/data";
import { cn } from "@/lib/utils";
import Markdown from "@/components/markdown";
import { Badge, Button, FeedSkeleton, Input, Textarea } from "@/components/ui";

const README_TEMPLATE = `## Il Problema

Descrivi il problema che vuoi risolvere. Chi lo vive ogni giorno?

## La Soluzione

Come funziona la tua idea? Elenca le feature principali:

- Feature 1
- Feature 2
- Feature 3

## Il Mercato

Chi sono i primi utenti? Come cresce?

## Stato attuale

Dove siete arrivati? Cosa manca per l'MVP?`;

export default function NuovoPage() {
  const { user, authReady, addProject, toast } = useStore();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState("");
  const [readme, setReadme] = useState(README_TEMPLATE);
  const [preview, setPreview] = useState(false);

  if (!authReady) return <FeedSkeleton />;

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-500/10">
          <Lightbulb className="h-8 w-8 text-brand-500" />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">Hai un&apos;idea da lanciare?</h1>
        <p className="max-w-xs text-sm text-muted">
          Crea prima il tuo profilo: ci vogliono 20 secondi, niente password.
        </p>
        <Link href="/profilo">
          <Button size="lg">Vai al Profilo</Button>
        </Link>
      </div>
    );
  }

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : prev.length < 3 ? [...prev, t] : prev));

  const addRole = () => {
    const r = roleInput.trim();
    if (!r || roles.includes(r)) return;
    setRoles([...roles, r]);
    setRoleInput("");
  };

  const submit = async () => {
    if (!user) return toast("Accedi per pubblicare");
    if (title.trim().length < 3) return toast("Il titolo è troppo corto");
    if (pitch.trim().length < 10) return toast("Il pitch deve dire qualcosa di concreto");
    if (!location.trim()) return toast("Aggiungi la tua città");
    if (tags.length === 0) return toast("Scegli almeno un tag");
    if (roles.length === 0) return toast("Aggiungi almeno un ruolo che cerchi");
    const id = await addProject({
      title: title.trim(),
      short_pitch: pitch.trim(),
      location: location.trim(),
      tags,
      open_roles: roles,
      readme_markdown: readme,
    });
    if (!id) return;
    toast("Idea pubblicata! Benvenuto nel Batch 2026");
    router.push(`/progetto/${id}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-500">
          <Lightbulb className="h-3.5 w-3.5" />
          Pubblica un&apos;idea
        </div>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink">
          La tua startup, in chiaro.
        </h1>
        <p className="mt-1 text-sm text-muted">
          Le idee senza esecuzione valgono zero. Pubblicala, raccogli stelle, trova chi la costruisce con te.
        </p>
      </motion.div>

      <div className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 sm:p-7">
        {/* Titolo */}
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Nome del progetto</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. ThesisAI" maxLength={30} />
        </label>

        {/* Pitch */}
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted">
            Elevator pitch
            <span className={cn("font-mono", pitch.length > 140 && "text-red-500")}>{pitch.length}/140</span>
          </span>
          <Textarea
            rows={2}
            value={pitch}
            onChange={(e) => setPitch(e.target.value.slice(0, 140))}
            placeholder="Spiega l'idea in una frase. Se non ci riesci, l'idea non è ancora chiara."
          />
        </label>

        {/* Città */}
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Città / Ateneo</span>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Es. Bologna" className="pl-10" maxLength={30} />
          </div>
        </label>

        {/* Tags */}
        <div>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Settori (max 3)</span>
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={cn(
                  "cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                  tags.includes(t)
                    ? "border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                    : "border-line bg-surface text-muted hover:text-ink"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Ruoli */}
        <div>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Chi stai cercando?</span>
          <div className="flex gap-2">
            <Input
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRole())}
              placeholder='Es. "Frontend Developer"'
            />
            <Button variant="secondary" onClick={addRole} aria-label="Aggiungi ruolo" className="shrink-0">
              <Plus className="h-4.5 w-4.5" />
            </Button>
          </div>
          {roles.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {roles.map((r) => (
                <Badge key={r} className="gap-1.5 border border-brand-500/30 bg-brand-500/10 py-1.5 pl-3.5 pr-2 text-brand-600 dark:text-brand-400">
                  {r}
                  <button onClick={() => setRoles(roles.filter((x) => x !== r))} className="cursor-pointer rounded-full p-0.5 hover:bg-brand-500/20" aria-label={`Rimuovi ${r}`}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* README */}
        <div>
          <span className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted">
            README del progetto (Markdown)
            <button onClick={() => setPreview(!preview)} className="flex cursor-pointer items-center gap-1 font-semibold normal-case tracking-normal text-brand-600 dark:text-brand-400">
              {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {preview ? "Modifica" : "Anteprima"}
            </button>
          </span>
          {preview ? (
            <div className="rounded-2xl border border-line bg-bg p-4">
              <Markdown>{readme}</Markdown>
            </div>
          ) : (
            <Textarea rows={12} value={readme} onChange={(e) => setReadme(e.target.value)} className="font-mono text-[13px] leading-relaxed" />
          )}
          <p className="mt-1.5 text-[11px] text-muted">
            Supporta Markdown: **grassetto**, ## titoli, - elenchi, [link](url)
          </p>
        </div>

        <Button size="lg" className="mt-1 w-full" onClick={submit}>
          🚀 Pubblica nel Batch 2026
        </Button>
      </div>
    </div>
  );
}
