"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Flame,
  Inbox as InboxIcon,
  MessageCircle,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Application, Message, Profile } from "@/lib/types";
import { Avatar, Badge, Button, FeedSkeleton, Input } from "@/components/ui";
import { cn, timeAgo } from "@/lib/utils";

type Tab = "messages" | "applications";

export default function InboxPage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <InboxContent />
    </Suspense>
  );
}

function InboxContent() {
  const {
    user,
    session,
    authReady,
    messages,
    unreadMessagesCount,
    sendMessage,
    markMessagesAsRead,
    applications,
    projects,
    profiles,
    builders,
    updateApplicationStatus,
  } = useStore();

  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "applications" ? "applications" : "messages";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const selectedChatUserId = searchParams.get("chat");
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper per trovare profilo
  const getProfile = (id: string): Profile | undefined => {
    return profiles.find((p) => p.id === id) || builders.find((b) => b.id === id);
  };

  // Tutte le persone con cui l'utente ha scambiato messaggi o ha un mutual_match/candidatura accettata
  const chatPartners = useMemo(() => {
    if (!user) return [];
    const partnersMap = new Map<string, { profile?: Profile; lastMessage?: Message; unreadCount: number }>();

    // Aggiungi chi ha un mutual match con noi (applications inviate o ricevute accettate)
    const myProjectsIds = new Set(projects.filter((p) => p.owner_id === user.id).map((p) => p.id));
    const matchedApps = applications.filter((a) => a.status === "mutual_match" || a.status === "accepted");

    for (const app of matchedApps) {
      let partnerId: string | null = null;
      if (app.applicant_id === user.id) {
        // Sono il candidato, il partner è l'owner del progetto
        const pr = projects.find((p) => p.id === app.project_id);
        if (pr) partnerId = pr.owner_id;
      } else if (myProjectsIds.has(app.project_id)) {
        // Sono l'owner, il partner è il candidato
        partnerId = app.applicant_id;
      }
      if (partnerId && partnerId !== user.id && !partnersMap.has(partnerId)) {
        partnersMap.set(partnerId, {
          profile: getProfile(partnerId),
          unreadCount: 0,
        });
      }
    }

    // Aggiungi chiunque abbia messaggi
    for (const m of messages) {
      const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      if (!otherId || otherId === user.id) continue;
      const existing = partnersMap.get(otherId) || { profile: getProfile(otherId), unreadCount: 0 };
      if (!existing.lastMessage || new Date(m.created_at) > new Date(existing.lastMessage.created_at)) {
        existing.lastMessage = m;
      }
      if (m.recipient_id === user.id && !m.read_at) {
        existing.unreadCount += 1;
      }
      partnersMap.set(otherId, existing);
    }

    return Array.from(partnersMap.entries()).map(([id, data]) => ({
      id,
      ...data,
    })).sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [user, messages, applications, projects, profiles, builders]);

  // Seleziona la chat corrente
  const activeChatPartner = useMemo(() => {
    if (!selectedChatUserId) return null;
    return getProfile(selectedChatUserId) || {
      id: selectedChatUserId,
      full_name: "Builder",
      role_badge: "tech_dev" as const,
      skills: [],
      availability: "exploring" as const,
      avatar_url: null,
      bio: null,
      created_at: "",
    };
  }, [selectedChatUserId, profiles, builders]);

  // Messaggi filtrati per la chat attiva
  const activeThread = useMemo(() => {
    if (!user || !selectedChatUserId) return [];
    return messages.filter(
      (m) =>
        (m.sender_id === user.id && m.recipient_id === selectedChatUserId) ||
        (m.sender_id === selectedChatUserId && m.recipient_id === user.id)
    );
  }, [user, selectedChatUserId, messages]);

  // Segna come letti quando si apre la chat
  useEffect(() => {
    if (selectedChatUserId && user) {
      markMessagesAsRead(selectedChatUserId);
    }
  }, [selectedChatUserId, user, markMessagesAsRead, activeThread.length]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !selectedChatUserId) return;
    const txt = chatInput.trim();
    setChatInput("");
    await sendMessage(selectedChatUserId, txt);
  };

  // Candidature ricevute e inviate
  const myProjectsIds = useMemo(() => (user ? new Set(projects.filter((p) => p.owner_id === user.id).map((p) => p.id)) : new Set()), [user, projects]);
  const receivedApplications = useMemo(() => applications.filter((a) => myProjectsIds.has(a.project_id)), [applications, myProjectsIds]);
  const sentApplications = useMemo(() => (user ? applications.filter((a) => a.applicant_id === user.id) : []), [applications, user]);

  if (!authReady) return <FeedSkeleton />;

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-500/10">
          <InboxIcon className="h-8 w-8 text-brand-500" />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">Accedi per usare l&apos;Inbox</h1>
        <p className="max-w-xs text-sm text-muted">
          Gestisci candidature ricevute, inviate e chatta con i tuoi co-founder.
        </p>
        <Link href="/profilo">
          <Button size="lg">Accedi al Profilo</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-500">
          <InboxIcon className="h-3.5 w-3.5" />
          Centro Messaggi
        </div>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink">Inbox</h1>
        <p className="mt-1 text-sm text-muted">
          Chat 1:1 post-match, candidature ricevute e stato delle tue richieste.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-line pb-2">
        <button
          onClick={() => {
            setActiveTab("messages");
            if (selectedChatUserId) router.replace("/inbox");
          }}
          className={cn(
            "relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors",
            activeTab === "messages" ? "text-ink" : "text-muted hover:text-ink"
          )}
        >
          {activeTab === "messages" && (
            <motion.span layoutId="inbox-tab-pill" className="absolute inset-0 rounded-xl bg-line/80" />
          )}
          <MessageCircle className="relative h-4 w-4" />
          <span className="relative">Messaggi</span>
          {unreadMessagesCount > 0 && (
            <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
              {unreadMessagesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("applications");
            if (selectedChatUserId) router.replace("/inbox?tab=applications");
          }}
          className={cn(
            "relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors",
            activeTab === "applications" ? "text-ink" : "text-muted hover:text-ink"
          )}
        >
          {activeTab === "applications" && (
            <motion.span layoutId="inbox-tab-pill" className="absolute inset-0 rounded-xl bg-line/80" />
          )}
          <Flame className="relative h-4 w-4" />
          <span className="relative">Candidature ({receivedApplications.length + sentApplications.length})</span>
        </button>
      </div>

      {/* Content Tab: Messages */}
      {activeTab === "messages" && (
        <div className="grid h-[620px] overflow-hidden rounded-3xl border border-line bg-surface md:grid-cols-12">
          {/* Thread list (colonna sinistra) */}
          <div
            className={cn(
              "h-full flex-col border-r border-line md:col-span-5 md:flex",
              selectedChatUserId ? "hidden md:flex" : "flex"
            )}
          >
            <div className="border-b border-line p-4">
              <h2 className="font-display font-bold text-ink">Conversazioni</h2>
              <p className="text-xs text-muted">Chat 1:1 con i co-founder con cui hai fatto match</p>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-line/60">
              {chatPartners.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted">
                  <MessageCircle className="mb-2 h-8 w-8 text-muted/40" />
                  <p className="font-display text-sm font-bold text-ink">Nessuna conversazione ancora</p>
                  <p className="mt-1 text-xs">Accetta una candidatura o candidati a un progetto per avviare una chat 1:1.</p>
                </div>
              ) : (
                chatPartners.map((item) => {
                  const isSelected = selectedChatUserId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => router.push(`/inbox?chat=${item.id}`)}
                      className={cn(
                        "flex w-full cursor-pointer items-start gap-3 p-3.5 text-left transition-colors hover:bg-bg/60",
                        isSelected && "bg-brand-500/10 hover:bg-brand-500/15"
                      )}
                    >
                      <Avatar name={item.profile?.full_name ?? "Utente"} size="md" color={item.profile?.profile_color} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-bold text-ink">{item.profile?.full_name ?? "Builder"}</p>
                          {item.lastMessage && (
                            <span className="text-[10px] text-muted">{timeAgo(item.lastMessage.created_at)}</span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {item.lastMessage ? item.lastMessage.content : "Match effettuato 🔥 Inizia a chattare!"}
                        </p>
                      </div>
                      {item.unreadCount > 0 && (
                        <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                          {item.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Thread (colonna destra) */}
          <div
            className={cn(
              "h-full flex-col md:col-span-7 md:flex",
              selectedChatUserId ? "flex" : "hidden md:flex"
            )}
          >
            {selectedChatUserId && activeChatPartner ? (
              <>
                {/* Chat Topbar */}
                <div className="flex items-center justify-between border-b border-line p-3.5 sm:px-5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => router.push("/inbox")}
                      className="rounded-full p-1.5 text-muted hover:bg-line md:hidden"
                      aria-label="Indietro alla lista"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <Avatar name={activeChatPartner.full_name} size="sm" color={activeChatPartner.profile_color} />
                    <div>
                      <Link href={`/persona/${activeChatPartner.id}`} className="font-display text-sm font-bold text-ink hover:underline">
                        {activeChatPartner.full_name}
                      </Link>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Match attivo</p>
                    </div>
                  </div>
                  <Link href={`/persona/${activeChatPartner.id}`}>
                    <Button variant="secondary" size="sm">Vedi profilo</Button>
                  </Link>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {activeThread.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-muted">
                      <Sparkles className="mb-2 h-7 w-7 text-brand-500" />
                      <p className="font-display text-sm font-bold text-ink">Inizia la conversazione!</p>
                      <p className="mt-1 max-w-xs text-xs">
                        Scambiatevi idee, organizzate una prima call e definite i prossimi passi del progetto.
                      </p>
                    </div>
                  ) : (
                    activeThread.map((m) => {
                      const isMe = m.sender_id === user.id;
                      return (
                        <div
                          key={m.id}
                          className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                              isMe
                                ? "bg-brand-500 text-white"
                                : "border border-line bg-bg text-ink"
                            )}
                          >
                            <p className="whitespace-pre-line leading-relaxed">{m.content}</p>
                          </div>
                          <span className="mt-1 px-1 text-[10px] text-muted">
                            {timeAgo(m.created_at)}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-line p-3">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Scrivi un messaggio…"
                    className="flex-1"
                  />
                  <Button type="submit" size="md" disabled={!chatInput.trim()} aria-label="Invia">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted">
                <MessageCircle className="mb-3 h-10 w-10 text-muted/30" />
                <p className="font-display font-bold text-ink">Seleziona una conversazione</p>
                <p className="mt-1 max-w-xs text-xs">
                  Scegli un compagno di team dalla lista a sinistra per aprire la chat.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Tab: Applications */}
      {activeTab === "applications" && (
        <div className="flex flex-col gap-8">
          {/* Candidature Ricevute (come founder) */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold text-ink">
              Candidature Ricevute ({receivedApplications.length})
            </h2>
            {receivedApplications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
                Nessuna candidatura ricevuta finora per i tuoi progetti.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {receivedApplications.map((a) => {
                  const applicant = getProfile(a.applicant_id);
                  const proj = projects.find((p) => p.id === a.project_id);
                  const isMatched = a.status === "mutual_match" || a.status === "accepted";
                  const isRejected = a.status === "rejected";

                  return (
                    <div
                      key={a.id}
                      className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex gap-3">
                        <Avatar name={applicant?.full_name ?? "Candidato"} size="md" color={applicant?.profile_color} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/persona/${a.applicant_id}`} className="font-display text-sm font-bold text-ink hover:underline">
                              {applicant?.full_name ?? "Candidato"}
                            </Link>
                            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                              · {a.target_role}
                            </span>
                            {proj && (
                              <Link href={`/progetto/${proj.id}`} className="text-xs text-muted hover:underline">
                                su {proj.title}
                              </Link>
                            )}
                            {isMatched && (
                              <Badge className="bg-brand-500 text-white text-[10px]">Mutual Match 🔥</Badge>
                            )}
                            {isRejected && (
                              <Badge className="bg-zinc-500/10 text-zinc-500 text-[10px]">Rifiutata</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted">{a.message}</p>
                          {a.contact_email && (
                            <p className="mt-1 text-xs text-muted">
                              Contatto: {a.contact_email} {a.contact_phone ? `· ${a.contact_phone}` : ""}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {!isMatched && !isRejected && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateApplicationStatus(a.id, "mutual_match")}
                            >
                              Accetta
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateApplicationStatus(a.id, "rejected")}
                            >
                              Rifiuta
                            </Button>
                          </>
                        )}
                        {isMatched && (
                          <Link href={`/inbox?chat=${a.applicant_id}`}>
                            <Button size="sm" variant="secondary" className="gap-1.5">
                              <MessageCircle className="h-3.5 w-3.5" />
                              Chat
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Candidature Inviate */}
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold text-ink">
              Candidature Inviate ({sentApplications.length})
            </h2>
            {sentApplications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
                Non ti sei ancora candidato a nessun progetto.{" "}
                <Link href="/esplora" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  Esplora le opportunità
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sentApplications.map((a) => {
                  const proj = projects.find((p) => p.id === a.project_id);
                  const isMatched = a.status === "mutual_match" || a.status === "accepted";
                  const isRejected = a.status === "rejected";

                  return (
                    <div
                      key={a.id}
                      className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/progetto/${a.project_id}`} className="font-display text-sm font-bold text-ink hover:underline">
                            {proj?.title ?? "Progetto"}
                          </Link>
                          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                            · Ruolo: {a.target_role}
                          </span>
                          {isMatched ? (
                            <Badge className="bg-brand-500 text-white text-[10px]">Mutual Match 🔥</Badge>
                          ) : isRejected ? (
                            <Badge className="bg-zinc-500/10 text-zinc-500 text-[10px]">Non accettata</Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]">
                              In attesa
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted">{a.message}</p>
                      </div>

                      {isMatched && proj && (
                        <Link href={`/inbox?chat=${proj.owner_id}`}>
                          <Button size="sm" variant="secondary" className="gap-1.5">
                            <MessageCircle className="h-3.5 w-3.5" />
                            Scrivi al founder
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
