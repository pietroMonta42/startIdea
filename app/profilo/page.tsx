"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Handshake,
  Lightbulb,
  LogOut,
  Mail,
  Pencil,
  Rocket,
  Send,
  Shield,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Availability, Profile, ROLE_COLORS, ROLE_LABELS, RoleBadge } from "@/lib/types";
import { cn, gradientFor, initials, timeAgo } from "@/lib/utils";
import { Avatar, Badge, Button, FeedSkeleton, Input, Modal, Textarea } from "@/components/ui";
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

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function LoginScreen() {
  const { signInOAuth, signInOtp, toast } = useStore();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [role, setRole] = useState<RoleBadge>("tech_dev");

  const sendOtp = () => {
    if (!email.includes("@")) return toast("Inserisci una mail valida");
    if (name.trim().length < 3) return toast("Inserisci il tuo nome");
    signInOtp(email.trim(), { full_name: name.trim(), role, university: university.trim() });
  };

  return (
    <div className="flex flex-col gap-8">
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

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-3xl border border-line bg-surface p-5 sm:p-7"
      >
        <h2 className="font-display text-xl font-bold text-ink">Entra nella community</h2>
        <p className="mt-1 text-sm text-muted">Login reale sicuro. Niente password: GitHub, Google o magic link via email.</p>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <button onClick={() => signInOAuth("github")} className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-3 text-sm font-bold text-ink transition-colors hover:bg-bg">
            <GithubIcon className="h-4.5 w-4.5" /> Continua con GitHub
          </button>
          <button
            onClick={() => toast("Configura il provider Google in Supabase → Authentication → Providers")}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-3 text-sm font-bold text-ink transition-colors hover:bg-bg"
          >
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
              <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84Z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
            </svg>
            Continua con Google
          </button>
        </div>

        <div className="my-4 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-muted">
          <span className="h-px flex-1 bg-line" /> oppure magic link <span className="h-px flex-1 bg-line" />
        </div>

        <div className="flex flex-col gap-3">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (riceverai un link magico)" type="email" />
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
                    role === r ? "border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/25" : "border-line bg-surface text-muted hover:text-ink"
                  )}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
          <Button size="lg" className="mt-1 w-full" onClick={sendOtp}>
            <Mail className="h-4 w-4" /> Inviami il magic link
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileView() {
  const { user, session, profiles, projects, applications, signOut, setAvailability, starCount, isAdmin, hasStarred, deleteProfileAdmin } = useStore();
  const [tab, setTab] = useState<"progetti" | "salvati" | "candidature">("progetti");
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null);

  if (!user) return null;

  const myProjects = projects.filter((p) => p.owner_id === user.id);
  const saved = projects.filter((p) => hasStarred(p.id));
  const myApps = applications.filter((a) => a.applicant_id === user.id);
  const received = applications.filter((a) => projects.some((p) => p.id === a.project_id && p.owner_id === user.id));

  return (
    <div className="flex flex-col gap-6">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-line bg-surface"
      >
        <div className={cn("dot-grid h-24 bg-gradient-to-br", gradientFor(user.full_name))} />
        <div className="px-5 pb-5 sm:px-7">
          <div className="-mt-10 flex items-end justify-between">
            <Avatar name={user.full_name} size="xl" className="ring-4 ring-surface" />
            <div className="flex gap-2 self-start pt-2">
              {isAdmin && <Badge className="bg-brand-500 text-white"><Shield className="h-3 w-3" /> Admin</Badge>}
              <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}><Pencil className="h-3.5 w-3.5" /> Modifica</Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-red-500 hover:bg-red-500/10"><LogOut className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold text-ink">{user.full_name}</h1>
          {session?.user?.email && <p className="text-xs text-muted">{session.user.email}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className={ROLE_COLORS[user.role_badge]}>{ROLE_LABELS[user.role_badge]}</Badge>
            {user.university && <span className="text-xs text-muted">{user.university}</span>}
          </div>

          {user.bio && <p className="mt-3 text-sm leading-relaxed text-muted">{user.bio}</p>}
          {user.skills?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {user.skills.map((s) => <Badge key={s} className="bg-line/70 text-muted">{s}</Badge>)}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {AVAILABILITY.map((a) => (
              <button
                key={a.id}
                onClick={() => setAvailability(a.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-all",
                  user.availability === a.id ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900" : "border-line bg-surface text-muted hover:text-ink"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", a.dot)} />
                {a.label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-bg py-3.5 text-center">
            {[
              { n: myProjects.length, l: "Progetti creati" },
              { n: myProjects.reduce((acc, p) => acc + starCount(p), 0), l: "Stelle ricevute" },
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
            { id: "progetti", label: "Progetti", icon: FolderKanban, n: myProjects.length },
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
              <motion.span layoutId="profile-tab" className="absolute inset-0 rounded-full bg-zinc-900 dark:bg-brand-500" transition={{ type: "spring", damping: 28, stiffness: 320 }} />
            )}
            <t.icon className="relative h-4 w-4" />
            <span className="relative hidden sm:inline">{t.label}</span>
            <span className="relative text-xs opacity-70">{t.n}</span>
          </button>
        ))}
      </div>

      {tab === "progetti" && (myProjects.length === 0 ? (
        <EmptyState icon={<Lightbulb className="h-8 w-8 text-brand-500" />} title="Nessun progetto ancora" text="Pubblica la tua prima idea e inizia a raccogliere stelle." cta={{ href: "/nuovo", label: "Pubblica un'idea" }} />
      ) : (
        <div className="flex flex-col gap-3">
          {myProjects.map((p) => (
            <Link key={p.id} href={`/progetto/${p.id}`}>
              <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-bg">
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-display font-bold text-white", gradientFor(p.id))}>{initials(p.title).slice(0, 1)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{p.title}</p>
                  <p className="truncate text-xs text-muted">{timeAgo(p.created_at)} · {p.location}</p>
                </div>
                <span className="flex items-center gap-1 text-sm font-bold text-ink"><Star className="h-4 w-4 fill-brand-500 text-brand-500" /> {starCount(p)}</span>
              </div>
            </Link>
          ))}
        </div>
      ))}

      {tab === "salvati" && (saved.length === 0 ? (
        <EmptyState icon={<Star className="h-8 w-8 text-brand-500" />} title="Nessuna stella data" text="Lascia una stella ai progetti che ti ispirano: li ritrovi qui." cta={{ href: "/", label: "Esplora il feed" }} />
      ) : (
        <div className="flex flex-col gap-3">
          {saved.map((p) => (
            <Link key={p.id} href={`/progetto/${p.id}`}>
              <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-bg">
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-display font-bold text-white", gradientFor(p.id))}>{initials(p.title).slice(0, 1)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{p.title}</p>
                  <p className="truncate text-xs text-muted">{p.short_pitch}</p>
                </div>
                <span className="flex items-center gap-1 text-sm font-bold text-ink"><Star className="h-4 w-4 fill-brand-500 text-brand-500" /> {starCount(p)}</span>
              </div>
            </Link>
          ))}
        </div>
      ))}

      {tab === "candidature" && (
        <div className="flex flex-col gap-5">
          {received.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink"><Handshake className="h-4 w-4 text-brand-500" /> Ricevute ({received.length})</h3>
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
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink"><Send className="h-4 w-4 text-brand-500" /> Inviate ({myApps.length})</h3>
            {myApps.length === 0 ? (
              <EmptyState icon={<Send className="h-8 w-8 text-brand-500" />} title="Nessuna candidatura" text="Trova un progetto che ti gasa e candidati per un ruolo aperto." cta={{ href: "/esplora", label: "Vedi la classifica" }} />
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

      {/* Admin panel GDPR */}
      {isAdmin && (
        <section className="rounded-3xl border border-brand-500/30 bg-brand-500/5 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-500" />
            <h2 className="font-display text-lg font-bold text-ink">Admin · GDPR & Privacy</h2>
          </div>
          <p className="mt-1 text-xs text-muted">Gestione account e contenuti secondo il regolamento UE. L&apos;eliminazione qui cancella profilo, progetti, commenti e candidature collegati. Per rimuovere definitivamente l&apos;utente auth, esegui in SQL Editor: <code className="rounded bg-line/70 px-1 py-0.5 text-[11px]">delete from auth.users where id=&apos;&lt;id&gt;&apos;;</code></p>
          <div className="mt-4 flex flex-col gap-2.5">
            {profiles.filter((p) => p.id !== user.id).map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
                <Avatar name={p.full_name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{p.full_name} {p.is_admin && <span className="text-brand-500">· admin</span>}</p>
                  <p className="truncate text-xs text-muted">{ROLE_LABELS[p.role_badge]} · {p.university ?? "—"}</p>
                </div>
                <button onClick={() => setConfirmDelete(p)} className="flex cursor-pointer items-center gap-1 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-500/20" aria-label="Elimina account">
                  <Trash2 className="h-3.5 w-3.5" /> Elimina
                </button>
              </div>
            ))}
            {profiles.length <= 1 && <p className="text-sm text-muted">Nessun altro utente registrato per ora.</p>}
          </div>
        </section>
      )}

      {/* Edit profile modal */}
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />

      {/* Admin delete confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Elimina account (GDPR?)">
        {confirmDelete && (
          <div>
            <p className="text-sm text-muted">Stai per eliminare l&apos;account di <b className="text-ink">{confirmDelete.full_name}</b> e tutti i suoi progetti, commenti e candidature. Questa azione è irreversibile.</p>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>Annulla</Button>
              <Button variant="dark" className="flex-1 bg-red-500 hover:bg-red-600" onClick={async () => { await deleteProfileAdmin(confirmDelete.id); setConfirmDelete(null); }}>Elimina definitivamente</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function EditProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, updateProfile } = useStore();
  const [name, setName] = useState("");
  const [role, setRole] = useState<RoleBadge>("tech_dev");
  const [university, setUniversity] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");

  useEffect(() => {
    if (open && user) {
      setName(user.full_name);
      setRole(user.role_badge);
      setUniversity(user.university ?? "");
      setBio(user.bio ?? "");
      setSkills((user.skills ?? []).join(", "));
    }
  }, [open, user]);

  if (!user) return null;
  return (
    <Modal open={open} onClose={onClose} title="Modifica profilo">
      <div className="flex flex-col gap-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome e cognome" />
        <div>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Ruolo</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(ROLE_LABELS) as RoleBadge[]).map((r) => (
              <button key={r} onClick={() => setRole(r)} className={cn("cursor-pointer rounded-2xl border px-3 py-2 text-xs font-bold transition-all", role === r ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-surface text-muted hover:text-ink")}>{ROLE_LABELS[r]}</button>
            ))}
          </div>
        </div>
        <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="Università" />
        <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills (separate da virgola)" />
        <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" />
        <Button size="lg" onClick={async () => { await updateProfile({ full_name: name, role_badge: role, university, bio, skills: skills.split(",").map((s) => s.trim()).filter(Boolean) }); onClose(); }}>Salva</Button>
      </div>
    </Modal>
  );
}

function EmptyState({ icon, title, text, cta }: { icon: React.ReactNode; title: string; text: string; cta: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line py-12 text-center">
      {icon}
      <p className="font-display font-bold text-ink">{title}</p>
      <p className="max-w-xs text-sm text-muted">{text}</p>
      <Link href={cta.href} className="mt-1"><Button>{cta.label}</Button></Link>
    </div>
  );
}

export default function ProfiloPage() {
  const { user, authReady } = useStore();
  if (!authReady) return <FeedSkeleton />;
  return user ? <ProfileView /> : <LoginScreen />;
}