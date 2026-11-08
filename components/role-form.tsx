"use client";

import { calculateMatchScore } from "@/lib/matching";
import { useStore } from "@/lib/store";

import React, { useState } from "react";
import { Clock, MapPin, Pencil, Trash2, Wallet } from "lucide-react";
import { COLLAB_LABELS, CollabType, MODE_LABELS, ProjectRole, ProjectRoleInput, RoleMode } from "@/lib/types";
import { Badge, Button, Input } from "./ui";
import { ChipInput, FieldLabel, PillSelect, selectClass } from "./form-bits";

export const EMPTY_ROLE: ProjectRoleInput = { title: "", skills: [], hours_per_week: null, mode: "remote", city: null, collab_type: "cofounder" };

/** Valida un ruolo; ritorna il messaggio d'errore oppure null. */
export function validateRole(role: ProjectRoleInput): string | null {
  if (role.title.trim().length < 2) return "Scrivi il titolo del ruolo (es. Frontend Dev)";
  if (role.title.trim().length > 60) return "Il titolo del ruolo è troppo lungo (max 60)";
  if (role.hours_per_week !== null && (role.hours_per_week < 1 || role.hours_per_week > 80)) return "Le ore a settimana devono essere tra 1 e 80";
  if (role.mode !== "remote" && !role.city?.trim()) return "Indica la città per ruoli in presenza o ibridi";
  return null;
}

export function RoleForm({
  initial = EMPTY_ROLE,
  submitLabel,
  onSubmit,
  onCancel,
  onError,
}: {
  initial?: ProjectRoleInput;
  submitLabel: string;
  onSubmit: (role: ProjectRoleInput) => void | Promise<void>;
  onCancel?: () => void;
  onError: (message: string) => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [skills, setSkills] = useState(initial.skills);
  const [hours, setHours] = useState(initial.hours_per_week?.toString() ?? "");
  const [mode, setMode] = useState<RoleMode>(initial.mode);
  const [city, setCity] = useState(initial.city ?? "");
  const [collab, setCollab] = useState<CollabType>(initial.collab_type);

  const submit = async () => {
    const role: ProjectRoleInput = {
      title: title.trim(),
      skills,
      hours_per_week: hours.trim() ? Math.round(Number(hours)) : null,
      mode,
      city: city.trim() || null,
      collab_type: collab,
    };
    if (hours.trim() && Number.isNaN(Number(hours))) return onError("Le ore a settimana devono essere un numero");
    const error = validateRole(role);
    if (error) return onError(error);
    await onSubmit(role);
    if (initial === EMPTY_ROLE) {
      setTitle(""); setSkills([]); setHours(""); setMode("remote"); setCity(""); setCollab("cofounder");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="block">
        <FieldLabel>Titolo del ruolo</FieldLabel>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="Es. Frontend Dev, Growth Lead" />
      </label>
      <div>
        <FieldLabel hint="Invio per aggiungere">Skill richieste</FieldLabel>
        <ChipInput values={skills} onChange={setSkills} placeholder="Es. React, Figma, SEO" max={8} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <FieldLabel hint="facoltativo">Impegno (ore/settimana)</FieldLabel>
          <Input type="number" inputMode="numeric" min={1} max={80} value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Es. 10" />
        </label>
        <label className="block">
          <FieldLabel>Tipo di collaborazione</FieldLabel>
          <select value={collab} onChange={(e) => setCollab(e.target.value as CollabType)} className={selectClass}>
            {(Object.keys(COLLAB_LABELS) as CollabType[]).map((c) => <option key={c} value={c}>{COLLAB_LABELS[c]}</option>)}
          </select>
        </label>
      </div>
      <div>
        <FieldLabel>Modalità</FieldLabel>
        <PillSelect single options={(Object.keys(MODE_LABELS) as RoleMode[]).map((m) => ({ id: m, label: MODE_LABELS[m] }))} value={[mode]} onChange={(v) => setMode(v[0])} />
      </div>
      {mode !== "remote" && (
        <label className="block">
          <FieldLabel>Città</FieldLabel>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Es. Milano" />
        </label>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        {onCancel && <Button variant="secondary" className="sm:flex-1" onClick={onCancel}>Annulla</Button>}
        <Button className="sm:flex-1" onClick={submit}>{submitLabel}</Button>
      </div>
    </div>
  );
}

/** Scheda di una posizione aperta (con azioni opzionali per il founder). */
export function RoleCard({
  role,
  projectId,

  onEdit,
  onToggle,
  onDelete,
}: {
  role: ProjectRole | (ProjectRoleInput & { is_open?: boolean });
  projectId?: string;
  onEdit?: () => void;
  onToggle?: () => void;
  onDelete?: () => void;
}) {
  const open = role.is_open ?? true;
  const { user, projects } = useStore();
  const project = projectId ? projects.find((p) => p.id === projectId) : null;
  const match = (user && project) ? calculateMatchScore(user, project, "id" in role ? (role as ProjectRole) : null) : null;
  return (
    <div className={`rounded-2xl border p-4 ${open ? "border-line bg-bg" : "border-line bg-bg opacity-60"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-[15px] font-bold text-ink">{role.title}</h3>
            {match && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {match.score}% match
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1"><Wallet className="h-3 w-3" />{COLLAB_LABELS[role.collab_type]}</span>
            {role.hours_per_week && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{role.hours_per_week}h/sett.</span>}
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{MODE_LABELS[role.mode]}{role.city ? ` · ${role.city}` : ""}</span>
          </div>
        </div>
        {!open && <Badge className="bg-zinc-500/15 text-zinc-600 dark:text-zinc-400">Chiusa</Badge>}
      </div>
      {role.skills.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {role.skills.map((s) => <Badge key={s} className="bg-line/70 text-muted">{s}</Badge>)}
        </div>
      )}
      {(onEdit || onToggle || onDelete) && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          {onEdit && <Button variant="secondary" size="sm" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /> Modifica</Button>}
          {onToggle && <Button variant="secondary" size="sm" onClick={onToggle}>{open ? "Chiudi posizione" : "Riapri"}</Button>}
          {onDelete && <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /> Elimina</Button>}
        </div>
      )}
    </div>
  );
}
