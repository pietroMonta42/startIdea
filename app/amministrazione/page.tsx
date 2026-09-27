"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Save, Shield, Eye, EyeOff } from "lucide-react";
import { useStore } from "@/lib/store";
import { FounderRequestStatus, FounderResource } from "@/lib/types";
import { normalizeExternalUrl } from "@/lib/utils";
import { Badge, Button, FeedSkeleton, Input, Textarea } from "@/components/ui";

const REQUEST_STATUSES: { value: FounderRequestStatus; label: string }[] = [
  { value: "pending", label: "In attesa" },
  { value: "in_progress", label: "In lavorazione" },
  { value: "answered", label: "Risposta inviata" },
  { value: "closed", label: "Chiusa" },
];

const emptyResource = { title: "", description: "", category: "Pianificazione", url: "", is_recommended: false, is_published: true, sort_order: 0 };

export default function AdministrationPage() {
  const { authReady, user, isAdmin, founderResources, founderRequests, projects, profiles, createFounderResource, updateFounderResource, updateFounderRequest, toast } = useStore();
  const [draft, setDraft] = useState(emptyResource);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, FounderRequestStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  if (!authReady || !user) return <FeedSkeleton />;
  if (!isAdmin) return <div className="rounded-3xl border border-line bg-surface p-8 text-center"><Shield className="mx-auto h-8 w-8 text-brand-500" /><h1 className="mt-3 font-display text-xl font-bold text-ink">Accesso riservato</h1><Link href="/home" className="mt-3 inline-flex text-sm font-bold text-brand-600 dark:text-brand-400">Torna alla dashboard</Link></div>;

  const startEditing = (resource: FounderResource) => {
    setDraft({ title: resource.title, description: resource.description, category: resource.category, url: resource.url, is_recommended: resource.is_recommended, is_published: resource.is_published, sort_order: resource.sort_order });
    setEditingId(resource.id);
  };

  const saveResource = async () => {
    if (!draft.title.trim() || !draft.description.trim() || !draft.category.trim() || !draft.url.trim()) return toast("Compila tutti i campi della risorsa");
    const url = normalizeExternalUrl(draft.url);
    try {
      new URL(url);
    } catch {
      return toast("Inserisci un link valido");
    }
    const resource = { ...draft, url };
    const saved = editingId ? await updateFounderResource(editingId, resource) : await createFounderResource(resource);
    if (!saved) return;
    setDraft(emptyResource);
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-7">
      <header>
        <Link href="/founder" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted"><ArrowLeft className="h-4 w-4" /> Spazio Founder</Link>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-500">Area riservata</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Amministrazione</h1>
      </header>

      <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-display text-xl font-bold text-ink">{editingId ? "Modifica risorsa" : "Aggiungi una risorsa"}</h2>
        <div className="mt-4 flex flex-col gap-3">
          <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Nome della risorsa" />
          <Textarea rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Descrizione e motivo del consiglio" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="Categoria" />
            <Input type="url" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} placeholder="https://..." />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted">
            <label className="flex items-center gap-2"><input type="checkbox" checked={draft.is_recommended} onChange={(event) => setDraft({ ...draft, is_recommended: event.target.checked })} className="accent-brand-500" /> Consigliata</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={draft.is_published} onChange={(event) => setDraft({ ...draft, is_published: event.target.checked })} className="accent-brand-500" /> Pubblicata</label>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveResource}><Save className="h-4 w-4" /> {editingId ? "Salva modifiche" : "Aggiungi risorsa"}</Button>
            {editingId && <Button variant="secondary" onClick={() => { setDraft(emptyResource); setEditingId(null); }}>Annulla</Button>}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold text-ink">Risorse ({founderResources.length})</h2>
        {founderResources.map((resource) => (
          <article key={resource.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-ink">{resource.title}</h3><Badge className={resource.is_published ? "bg-emerald-500/10 text-emerald-600" : "bg-line text-muted"}>{resource.is_published ? "Pubblicata" : "Nascosta"}</Badge></div><p className="mt-1 truncate text-xs text-muted">{resource.category} · {resource.url}</p></div>
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" size="sm" onClick={() => startEditing(resource)}><Pencil className="h-3.5 w-3.5" /> Modifica</Button>
              <Button variant="ghost" size="sm" onClick={() => updateFounderResource(resource.id, { is_published: !resource.is_published })}>{resource.is_published ? <><EyeOff className="h-3.5 w-3.5" /> Nascondi</> : <><Eye className="h-3.5 w-3.5" /> Pubblica</>}</Button>
            </div>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold text-ink">Richieste Founder ({founderRequests.length})</h2>
        {founderRequests.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-muted">Non ci sono richieste da gestire.</p> : founderRequests.map((request) => (
          <article key={request.id} className="rounded-3xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-ink">{request.subject}</h3><p className="mt-1 text-xs text-muted">Da {profiles.find((profile) => profile.id === request.user_id)?.full_name ?? "Utente"} · Progetto: {projects.find((project) => project.id === request.project_id)?.title ?? "Progetto"}</p></div><Badge className="bg-amber-500/10 text-amber-600">{REQUEST_STATUSES.find((item) => item.value === (statuses[request.id] ?? request.status))?.label}</Badge></div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{request.message}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold">{request.contact_email && <a href={`mailto:${request.contact_email}`} className="text-brand-600 underline dark:text-brand-400">{request.contact_email}</a>}{request.contact_phone && <a href={`tel:${request.contact_phone}`} className="text-brand-600 underline dark:text-brand-400">{request.contact_phone}</a>}</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
              <select value={statuses[request.id] ?? request.status} onChange={(event) => setStatuses({ ...statuses, [request.id]: event.target.value as FounderRequestStatus })} className="h-10 rounded-xl border border-line bg-bg px-3 text-sm text-ink">{REQUEST_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
              <Input value={notes[request.id] ?? request.admin_notes ?? ""} onChange={(event) => setNotes({ ...notes, [request.id]: event.target.value })} placeholder="Risposta o nota visibile all’utente" />
              <Button size="sm" onClick={() => updateFounderRequest(request.id, { status: statuses[request.id] ?? request.status, admin_notes: notes[request.id] ?? request.admin_notes })}>Aggiorna</Button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
