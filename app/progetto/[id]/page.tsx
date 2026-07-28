"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, BriefcaseBusiness, Check, FileText, MapPin, Send, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/types";
import { cn, gradientFor, timeAgo } from "@/lib/utils";
import Markdown from "@/components/markdown";
import { StarButton } from "@/components/project-card";
import { Avatar, Badge, Button, FeedSkeleton, Modal, Textarea } from "@/components/ui";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const { hydrated, projectById, profileById, commentsFor, addComment, user, toast, applicationsFor, myApplication, addApplication } = store;

  const [comment, setComment] = useState("");
  const [applyOpen, setApplyOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  if (!hydrated) return <FeedSkeleton />;

  const project = projectById(id);
  if (!project) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="font-display text-xl font-bold text-ink">Progetto non trovato</p>
        <Link href="/" className="font-semibold text-brand-600 dark:text-brand-400">
          ← Torna alla Home
        </Link>
      </div>
    );
  }

  const owner = profileById(project.owner_id);
  const comments = commentsFor(project.id);
  const applications = applicationsFor(project.id);
  const mine = myApplication(project.id);
  const isOwner = user?.id === project.owner_id;

  const submitComment = () => {
    if (!user) return toast("Accedi per commentare");
    if (!comment.trim()) return;
    addComment(project.id, comment.trim());
    setComment("");
  };

  const submitApplication = () => {
    if (!role) return toast("Scegli un ruolo");
    if (message.trim().length < 10) return toast("Scrivi un mini-pitch di almeno 10 caratteri");
    addApplication(project.id, role, message.trim());
    setApplyOpen(false);
    setRole(null);
    setMessage("");
    toast("Candidatura inviata al founder");
  };

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="flex w-fit items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Indietro
      </Link>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("dot-grid relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 sm:p-10", gradientFor(project.id))}
      >
        <span className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        <span className="pointer-events-none absolute -bottom-14 -left-8 h-52 w-52 rounded-full bg-black/10 blur-2xl" />

        <div className="relative flex flex-wrap items-center gap-2">
          {project.tags.map((t) => (
            <Badge key={t} className="bg-white/20 text-white backdrop-blur-sm">{t}</Badge>
          ))}
        </div>

        <h1 className="relative mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {project.title}
        </h1>
        <p className="relative mt-3 max-w-xl text-[15px] leading-relaxed text-white/90">
          {project.short_pitch}
        </p>

        <div className="relative mt-6 flex flex-wrap items-center gap-3">
          <StarButton project={project} size="lg" onDark />
          <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
            <MapPin className="h-4 w-4" /> {project.location} · {timeAgo(project.created_at)}
          </div>
        </div>
      </motion.section>

      {/* Ruoli aperti */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-3xl border border-line bg-surface p-5 sm:p-6"
      >
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="h-5 w-5 text-brand-500" />
          <h2 className="font-display text-lg font-bold text-ink">Ruoli aperti</h2>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.open_roles.map((r) => (
            <Badge key={r} className="border border-brand-500/30 bg-brand-500/10 px-3.5 py-1.5 text-xs text-brand-600 dark:text-brand-400">
              {r}
            </Badge>
          ))}
        </div>
        <div className="mt-4">
          {isOwner ? (
            <p className="text-sm text-muted">Sei il founder di questo progetto.</p>
          ) : mine ? (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <Check className="h-4.5 w-4.5" /> Ti sei candidato come {mine.target_role} · in attesa di risposta
            </div>
          ) : (
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => {
                if (!user) return toast("Accedi dal tab Profilo per candidarti");
                setApplyOpen(true);
              }}
            >
              Candida il tuo aiuto
            </Button>
          )}
        </div>
      </motion.section>

      {/* Candidature ricevute (solo owner) */}
      {isOwner && (
        <section className="rounded-3xl border border-brand-500/30 bg-brand-500/5 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-500" />
            <h2 className="font-display text-lg font-bold text-ink">
              Candidature ricevute ({applications.length})
            </h2>
          </div>
          {applications.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Nessuna candidatura per ora. Condividi il progetto!</p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {applications.map((a) => {
                const applicant = profileById(a.applicant_id);
                return (
                  <div key={a.id} className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
                    <Avatar name={applicant?.full_name ?? "?"} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink">
                        {applicant?.full_name} <span className="font-semibold text-brand-600 dark:text-brand-400">· {a.target_role}</span>
                      </p>
                      <p className="mt-1 text-sm text-muted">{a.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* README */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="rounded-3xl border border-line bg-surface p-5 sm:p-7"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-500" />
          <h2 className="font-display text-lg font-bold text-ink">README</h2>
        </div>
        <div className="mt-2 border-t border-line pt-2">
          <Markdown>{project.readme_markdown}</Markdown>
        </div>
      </motion.section>

      {/* Team */}
      {owner && (
        <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-500" />
            <h2 className="font-display text-lg font-bold text-ink">Team</h2>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Avatar name={owner.full_name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink">{owner.full_name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge className={ROLE_COLORS[owner.role_badge]}>{ROLE_LABELS[owner.role_badge]}</Badge>
                {owner.university && <span className="text-xs text-muted">{owner.university}</span>}
              </div>
            </div>
            <Badge className="bg-brand-500/10 text-brand-600 dark:text-brand-400">Founder</Badge>
          </div>
        </section>
      )}

      {/* Community */}
      <section id="community" className="scroll-mt-20 rounded-3xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">
          Community <span className="text-sm font-semibold text-muted">({comments.length})</span>
        </h2>
        <p className="mt-0.5 text-xs text-muted">Domande, feedback e spunti per il founder — in stile Hacker News.</p>

        <div className="mt-4 flex flex-col gap-4">
          {comments.map((c, i) => {
            const author = profileById(c.author_id);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex gap-3"
              >
                <Avatar name={author?.full_name ?? "?"} size="sm" />
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-bg p-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-ink">{author?.full_name ?? "Utente"}</span>
                    {author && <Badge className={cn(ROLE_COLORS[author.role_badge], "px-2 py-0 text-[10px]")}>{ROLE_LABELS[author.role_badge]}</Badge>}
                    <span className="text-[11px] text-muted">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink/85">{c.content}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-5 flex gap-2.5">
          {user ? (
            <>
              <Avatar name={user.full_name} size="sm" />
              <div className="flex flex-1 gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
                  placeholder="Fai una domanda o dai un feedback…"
                  className="h-10 flex-1 rounded-full border border-line bg-bg px-4 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
                />
                <Button size="md" className="h-10 w-10 shrink-0 rounded-full p-0" onClick={submitComment} aria-label="Invia commento">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <Link href="/profilo" className="w-full">
              <div className="rounded-2xl border border-dashed border-line p-3.5 text-center text-sm font-semibold text-muted transition-colors hover:text-ink">
                Accedi per partecipare alla discussione →
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Apply modal */}
      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title={`Candidati per ${project.title}`}>
        <p className="text-sm text-muted">
          Il founder vedrà il tuo profilo e questo messaggio. Niente CV formali: conta quello che sai fare.
        </p>
        <p className="mt-4 mb-2 text-xs font-bold uppercase tracking-wider text-muted">Per quale ruolo?</p>
        <div className="flex flex-wrap gap-2">
          {project.open_roles.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                role === r
                  ? "border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                  : "border-line bg-surface text-muted hover:text-ink"
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <p className="mt-4 mb-2 text-xs font-bold uppercase tracking-wider text-muted">Il tuo mini-pitch</p>
        <Textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Chi sei, cosa hai già costruito, perché questa idea ti gasa…"
        />
        <Button size="lg" className="mt-4 w-full" onClick={submitApplication}>
          Invia candidatura
        </Button>
      </Modal>
    </div>
  );
}
