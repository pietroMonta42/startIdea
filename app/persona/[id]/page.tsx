"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, GraduationCap, BriefcaseBusiness, Heart, Lock, MapPin, Pencil, UserCheck, UserPlus, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { Profile, ROLE_COLORS, ROLE_LABELS } from "@/lib/types";
import { Avatar, Badge, Button, FeedSkeleton, Modal, Textarea } from "@/components/ui";
import { AvailabilityBadge, LookingForBadges } from "@/components/profile-badges";
import { FieldLabel } from "@/components/form-bits";

export default function PersonaPage() {
  const { id } = useParams<{ id: string }>();
  const { user, authReady, connectionWith, requestConnection, respondConnection, removeConnection, fetchProfileDetail } = useStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [message, setMessage] = useState("");

  const connection = connectionWith(id);
  const connectionStatus = connection?.status;
  const userId = user?.id;

  // Ricarica il dettaglio quando cambia la relazione (un collegamento accettato sblocca il profilo completo).
  useEffect(() => {
    if (!authReady) return;
    let alive = true;
    fetchProfileDetail(id).then((p) => {
      if (!alive) return;
      setProfile(p);
      setLoaded(true);
    });
    return () => { alive = false; };
  }, [id, authReady, userId, connectionStatus, fetchProfileDetail]);

  if (!authReady || !loaded) return <FeedSkeleton />;

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="font-display text-xl font-bold text-ink">Persona non trovata</p>
        <Link href="/esplora?tab=people" className="font-semibold text-brand-600 dark:text-brand-400">← Torna alle persone</Link>
      </div>
    );
  }

  const isSelf = user?.id === profile.id;
  const full = Boolean(profile.is_full) || isSelf;
  const incoming = connection && connection.addressee_id === user?.id;
  const color = profile.profile_color ?? "#f97316";
  const firstName = profile.full_name.split(" ")[0];

  const send = async () => {
    if (await requestConnection(profile.id, message)) {
      setConnectOpen(false);
      setMessage("");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <Link href="/esplora?tab=people" className="flex w-fit items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Persone
      </Link>

      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl border border-line bg-surface">
        <div
          className="dot-grid h-20 sm:h-24"
          style={{
            backgroundColor: color,
            backgroundImage: `radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 55%, #111827))`,
            backgroundSize: "18px 18px, auto",
          }}
        />
        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-10 flex items-end justify-between gap-3">
            <Avatar name={profile.full_name} size="xl" color={profile.profile_color} className="ring-4 ring-surface" />
            {isSelf && (
              <Link href="/profilo"><Button variant="secondary" size="sm"><Pencil className="h-3.5 w-3.5" /> Modifica</Button></Link>
            )}
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold text-ink">{profile.full_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className={ROLE_COLORS[profile.role_badge]}>
              {profile.role_badge === "other" ? profile.role_custom || ROLE_LABELS.other : ROLE_LABELS[profile.role_badge]}
            </Badge>
            <AvailabilityBadge value={profile.availability} />
          </div>
          {(profile.university || profile.city) && (
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {profile.university && <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />{profile.university}</span>}
              {profile.city && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{profile.city}</span>}
            </p>
          )}
          {profile.bio && <p className="mt-3 text-sm leading-relaxed text-ink/85">{profile.bio}</p>}
          {(profile.looking_for?.length ?? 0) > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5"><LookingForBadges values={profile.looking_for} /></div>
          )}
          {profile.skills.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">Skill</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => <Badge key={s} className="bg-line/70 text-muted">{s}</Badge>)}
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* Profilo completo: solo team e collegati */}
      {full ? (
        <section className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-brand-500" />
            <h2 className="font-display text-lg font-bold text-ink">{isSelf ? "Visibile solo a team e collegati" : "Profilo completo"}</h2>
          </div>
          {(profile.interests?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted"><Heart className="h-3.5 w-3.5" /> Interessi</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests!.map((i) => <Badge key={i} className="bg-brand-500/10 text-brand-600 dark:text-brand-400">{i}</Badge>)}
              </div>
            </div>
          )}
          {(profile.linkedin_url || profile.portfolio_url) ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noreferrer noopener" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-line bg-bg px-4 text-sm font-semibold text-ink transition-colors hover:border-brand-500">
                  <BriefcaseBusiness className="h-4 w-4" /> LinkedIn
                </a>
              )}
              {profile.portfolio_url && (
                <a href={profile.portfolio_url} target="_blank" rel="noreferrer noopener" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-line bg-bg px-4 text-sm font-semibold text-ink transition-colors hover:border-brand-500">
                  <ExternalLink className="h-4 w-4" /> GitHub / Portfolio
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted">{isSelf ? "Aggiungi interessi e link dalle impostazioni del profilo." : `${firstName} non ha aggiunto altri dettagli.`}</p>
          )}
        </section>
      ) : (
        <section className="flex flex-col items-start gap-3 rounded-3xl border border-dashed border-line p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted" />
            <h2 className="font-display text-lg font-bold text-ink">Profilo completo riservato</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Interessi, LinkedIn e portfolio di {firstName} sono visibili solo a chi fa parte del suo team o si collega con lui. Email e telefono non sono mai pubblici: si condividono solo con il consenso della persona.
          </p>

          {!user ? (
            <Link href="/profilo" className="w-full sm:w-auto"><Button className="w-full sm:w-auto">Accedi per collegarti</Button></Link>
          ) : connection?.status === "accepted" ? null : connection && !incoming ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <span className="text-sm font-semibold text-muted">
                {connection.status === "pending" ? "Richiesta inviata · in attesa di risposta" : "La richiesta non è stata accettata"}
              </span>
              <Button variant="ghost" size="sm" onClick={() => removeConnection(connection.id)}><X className="h-3.5 w-3.5" /> Annulla richiesta</Button>
            </div>
          ) : connection && incoming ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button className="flex-1" onClick={() => respondConnection(connection.id, true)}><UserCheck className="h-4 w-4" /> Accetta e condividi il tuo profilo</Button>
              {connection.status === "pending" && <Button variant="secondary" onClick={() => respondConnection(connection.id, false)}>Rifiuta</Button>}
            </div>
          ) : (
            <Button className="w-full sm:w-auto" onClick={() => setConnectOpen(true)}><UserPlus className="h-4 w-4" /> Collegati</Button>
          )}
        </section>
      )}

      {!isSelf && full && connection?.status === "accepted" && (
        <Button variant="ghost" size="sm" className="w-fit text-muted" onClick={() => removeConnection(connection.id)}>Rimuovi collegamento</Button>
      )}

      <Modal open={connectOpen} onClose={() => setConnectOpen(false)} title={`Collegati con ${firstName}`}>
        <p className="text-sm leading-relaxed text-muted">
          Se {firstName} accetta, vedrete reciprocamente il profilo completo: interessi, LinkedIn e portfolio. Nessun recapito privato viene condiviso.
        </p>
        <label className="mt-4 block">
          <FieldLabel hint={`${message.length}/280`}>Messaggio (facoltativo)</FieldLabel>
          <Textarea rows={3} maxLength={280} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Presentati in una riga…" />
        </label>
        <Button size="lg" className="mt-4 w-full" onClick={send}>Invia richiesta</Button>
      </Modal>
    </div>
  );
}
