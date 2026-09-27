"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, LifeBuoy, Search, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { FounderRequestStatus } from "@/lib/types";
import { Badge, Button, FeedSkeleton, Input, Textarea } from "@/components/ui";

const REQUEST_STATUS: Record<FounderRequestStatus, string> = {
  pending: "In attesa",
  in_progress: "In lavorazione",
  answered: "Risposta inviata",
  closed: "Chiusa",
};

export default function FounderPage() {
  const { authReady, user, session, projects, canAccessFounder, isAdmin, founderResources, founderRequests, submitFounderRequest, toast } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tutte");
  const [projectId, setProjectId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);

  const resources = founderResources.filter((resource) => resource.is_published || isAdmin);
  const categories = ["Tutte", ...new Set(resources.map((resource) => resource.category))];
  const visibleResources = useMemo(() => resources.filter((resource) => {
    const matchesCategory = category === "Tutte" || resource.category === category;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || `${resource.title} ${resource.description} ${resource.category}`.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  }), [resources, category, search]);

  if (!authReady || !user) return <FeedSkeleton />;
  const activeProjects = projects.filter((project) => project.owner_id === user.id && project.is_active !== false);

  const sendRequest = async () => {
    const selectedProjectId = projectId || activeProjects[0]?.id;
    if (!selectedProjectId || !subject.trim() || message.trim().length < 10) return;
    if (!email.trim() && !phone.trim()) return toast("Inserisci un indirizzo email o un numero di telefono");
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast("Controlla l’indirizzo email");
    if (!consent) return;
    setSending(true);
    const submitted = await submitFounderRequest({ project_id: selectedProjectId, subject: subject.trim(), message: message.trim(), contact_email: email.trim() || null, contact_phone: phone.trim() || null, contact_consent: consent });
    if (!submitted) { setSending(false); return; }
    setSubject("");
    setMessage("");
    setPhone("");
    setConsent(false);
    setSending(false);
  };

  if (!canAccessFounder && !isAdmin) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-surface px-6 py-14 text-center">
        <Sparkles className="h-10 w-10 text-brand-500" />
        <h1 className="font-display text-2xl font-bold text-ink">Spazio Founder</h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted">Pubblica un progetto attivo per accedere agli strumenti selezionati e chiedere supporto al gruppo SparkLab.</p>
        <Link href="/nuovo"><Button>Pubblica un progetto</Button></Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <header className="pt-2">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-500">Strumenti e supporto</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Spazio Founder</h1>
        <p className="mt-2 text-sm text-muted">Risorse selezionate per passare dall’idea alla realizzazione.</p>
      </header>

      {isAdmin && <Link href="/amministrazione" className="text-sm font-bold text-brand-600 dark:text-brand-400">Gestisci risorse e richieste →</Link>}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold text-ink">Strumenti consigliati</h2>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cerca uno strumento o una categoria" className="pl-11" />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${category === item ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-surface text-muted"}`}>{item}</button>)}
        </div>
        {visibleResources.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">Non ci sono ancora risorse in questa categoria.</p> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleResources.map((resource) => (
              <article key={resource.id} className="rounded-3xl border border-line bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><Badge className="bg-brand-500/10 text-brand-600 dark:text-brand-400">{resource.category}</Badge><h3 className="mt-2 font-display text-lg font-bold text-ink">{resource.title}</h3></div>
                  {resource.is_recommended && <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400">Consigliato</Badge>}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{resource.description}</p>
                <a href={resource.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600 dark:text-brand-400">Apri risorsa <ArrowUpRight className="h-4 w-4" /></a>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-brand-500/25 bg-brand-500/5 p-5 sm:p-6">
        <div className="flex items-center gap-2"><LifeBuoy className="h-5 w-5 text-brand-500" /><h2 className="font-display text-xl font-bold text-ink">Parla con SparkLab</h2></div>
        <p className="mt-1 text-sm text-muted">Raccontaci cosa ti serve: ti ricontatteremo usando uno dei recapiti che indichi.</p>
        {activeProjects.length === 0 ? <p className="mt-4 text-sm text-muted">Serve un progetto attivo per inviare una richiesta di supporto.</p> : (
          <div className="mt-4 flex flex-col gap-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Progetto
              <select value={projectId || activeProjects[0]?.id || ""} onChange={(event) => setProjectId(event.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-line bg-surface px-4 text-sm font-normal normal-case tracking-normal text-ink">
                {activeProjects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
              </select>
            </label>
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Oggetto della richiesta" />
            <Textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Descrivi la domanda o il tipo di supporto che cerchi" />
            <p className="text-xs font-semibold text-muted">Inserisci l’email o il numero di telefono con cui preferisci essere ricontattato.</p>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={session?.user.email ?? "Email"} />
            <Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Numero di telefono" />
            <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-muted"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 accent-brand-500" /><span>Acconsento a essere ricontattato usando i recapiti indicati.</span></label>
            <Button disabled={sending || !subject.trim() || message.trim().length < 10 || (!email.trim() && !phone.trim()) || !consent} onClick={sendRequest}>{sending ? "Invio in corso…" : "Invia richiesta"}</Button>
          </div>
        )}
      </section>

      {founderRequests.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold text-ink">Le tue richieste</h2>
          {founderRequests.map((request) => <article key={request.id} className="rounded-2xl border border-line bg-surface p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-bold text-ink">{request.subject}</h3><Badge className="bg-line text-muted">{REQUEST_STATUS[request.status]}</Badge></div><p className="mt-2 text-sm text-muted">{request.message}</p>{request.admin_notes && <p className="mt-2 rounded-xl bg-brand-500/5 p-3 text-sm text-ink">Risposta: {request.admin_notes}</p>}</article>)}
        </section>
      )}
      <p className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="h-4 w-4" /> Le richieste e i recapiti sono visibili solo a te e agli amministratori.</p>
    </div>
  );
}
