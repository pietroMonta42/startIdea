"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Handshake,
  KeyRound,
  Lightbulb,
  LogIn,
  LogOut,
  Mail,
  Pencil,
  Send,
  Shield,
  Star,
  Trash2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Availability, Profile, ROLE_COLORS, ROLE_LABELS, RoleBadge } from "@/lib/types";
import { cn, gradientStyle, initials, timeAgo } from "@/lib/utils";
import { Avatar, Badge, Button, FeedSkeleton, Input, Modal, Textarea } from "@/components/ui";
import { Logo } from "@/components/app-shell";

const AVAILABILITY: { id: Availability; dot: string; label: string }[] = [
  { id: "available", dot: "bg-emerald-500", label: "Disponibile" },
  { id: "consulting", dot: "bg-amber-500", label: "Solo consulenza" },
  { id: "busy", dot: "bg-red-500", label: "Impegnato" },
];

function LoginScreen() {
  const { signInOtp, signInWithEmail, signUpWithEmail, toast } = useStore();
  const [mode, setMode] = useState<"magic" | "password">("password");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [role, setRole] = useState<RoleBadge>("tech_dev");

  const sendOtp = () => {
    if (!email.includes("@")) return toast("Inserisci una mail valida");
    if (name.trim().length < 3) return toast("Inserisci il tuo nome");
    signInOtp(email.trim(), { full_name: name.trim(), role, university: university.trim() });
  };

  const submitPassword = () => {
    if (!email.includes("@")) return toast("Inserisci una mail valida");
    if (password.length < 6) return toast("La password deve avere almeno 6 caratteri");
    if (isSignUp) {
      if (name.trim().length < 3) return toast("Inserisci il tuo nome");
      signUpWithEmail(email.trim(), password, { full_name: name.trim(), role, university: university.trim() });
    } else {
      signInWithEmail(email.trim(), password);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 pt-3 text-center"
      >
        <Logo size={56} />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Entra nella community</h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "password"
              ? isSignUp ? "Crea il tuo account con email e password." : "Bentornato. Accedi con la tua password."
              : "Niente password: ricevi un magic link via email."}
          </p>
        </div>
      </motion.div>

      {/* Mode toggle */}
      <div className="flex gap-1.5 rounded-full border border-line bg-surface p-1.5">
        <button
          onClick={() => setMode("password")}
          className={cn(
            "relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-bold transition-colors",
            mode === "password" ? "text-white" : "text-muted hover:text-ink"
          )}
        >
          {mode === "password" && (
            <motion.span layoutId="auth-mode-pill" className="absolute inset-0 rounded-full bg-brand-500" transition={{ type: "spring", damping: 28, stiffness: 320 }} />
          )}
          <KeyRound className="relative h-4 w-4" />
          <span className="relative">Password</span>
        </button>
        <button
          onClick={() => setMode("magic")}
          className={cn(
            "relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-bold transition-colors",
            mode === "magic" ? "text-white" : "text-muted hover:text-ink"
          )}
        >
          {mode === "magic" && (
            <motion.span layoutId="auth-mode-pill" className="absolute inset-0 rounded-full bg-brand-500" transition={{ type: "spring", damping: 28, stiffness: 320 }} />
          )}
          <Mail className="relative h-4 w-4" />
          <span className="relative">Magic Link</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl border border-line bg-surface p-5 sm:p-7"
      >
        <div className="flex flex-col gap-3">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />

          {mode === "password" && (
            <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min. 6 caratteri)" type="password" />
          )}

          {isSignUp && mode === "password" && (
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome e cognome" />
          )}

          {(mode === "magic" || (mode === "password" && isSignUp)) && (
            <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="Università (es. Politecnico di Milano)" />
          )}

          {(mode === "magic" || (mode === "password" && isSignUp)) && (
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
          )}

          {mode === "password" ? (
            <Button size="lg" className="mt-1 w-full" onClick={submitPassword}>
              <LogIn className="h-4 w-4" /> {isSignUp ? "Crea account" : "Accedi"}
            </Button>
          ) : (
            <Button size="lg" className="mt-1 w-full" onClick={sendOtp}>
              <Mail className="h-4 w-4" /> Inviami il magic link
            </Button>
          )}

          {mode === "password" && (
            <button
              onClick={() => setIsSignUp((s) => !s)}
              className="cursor-pointer text-center text-sm font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400"
            >
              {isSignUp ? "Hai già un account? Accedi →" : "Nuovo qui? Crea un account →"}
            </button>
          )}
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
        <div className="dot-grid h-24" style={gradientStyle(user.full_name, { dots: true })} />
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
                  user.availability === a.id ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-surface text-muted hover:text-ink"
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
              <motion.span layoutId="profile-tab" className="absolute inset-0 rounded-full bg-brand-500" transition={{ type: "spring", damping: 28, stiffness: 320 }} />
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
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-display font-bold text-white" style={gradientStyle(p)}>{initials(p.title).slice(0, 1)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{p.title}</p>
                  <p className="truncate text-xs text-muted">{timeAgo(p.created_at)} · {p.location}</p>
                </div>
                <span className="flex items-center gap-1 text-sm font-bold text-ink"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {starCount(p)}</span>
              </div>
            </Link>
          ))}
        </div>
      ))}

      {tab === "salvati" && (saved.length === 0 ? (
        <EmptyState icon={<Star className="h-8 w-8 text-amber-400" />} title="Nessuna stella data" text="Lascia una stella ai progetti che ti ispirano: li ritrovi qui." cta={{ href: "/", label: "Esplora il feed" }} />
      ) : (
        <div className="flex flex-col gap-3">
          {saved.map((p) => (
            <Link key={p.id} href={`/progetto/${p.id}`}>
              <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-bg">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-display font-bold text-white" style={gradientStyle(p)}>{initials(p.title).slice(0, 1)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{p.title}</p>
                  <p className="truncate text-xs text-muted">{p.short_pitch}</p>
                </div>
                <span className="flex items-center gap-1 text-sm font-bold text-ink"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {starCount(p)}</span>
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