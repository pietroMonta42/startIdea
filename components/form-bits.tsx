"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui";

export function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-bold uppercase tracking-wider text-muted">
      <span>{children}</span>
      {hint && <span className="font-semibold normal-case tracking-normal text-muted/80">{hint}</span>}
    </span>
  );
}

/** Input a chip: invio o virgola per aggiungere, × per rimuovere. */
export function ChipInput({
  values,
  onChange,
  placeholder,
  max = 10,
  maxLength = 30,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max?: number;
  maxLength?: number;
}) {
  const [draft, setDraft] = useState("");
  const commit = (raw: string) => {
    const v = raw.trim().slice(0, maxLength);
    if (!v || values.some((x) => x.toLowerCase() === v.toLowerCase()) || values.length >= max) return;
    onChange([...values, v]);
  };
  return (
    <div>
      <input
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          if (v.includes(",")) {
            v.split(",").forEach(commit);
            setDraft("");
          } else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
            setDraft("");
          } else if (e.key === "Backspace" && !draft && values.length) onChange(values.slice(0, -1));
        }}
        onBlur={() => {
          commit(draft);
          setDraft("");
        }}
        disabled={values.length >= max}
        placeholder={values.length >= max ? `Massimo ${max}` : placeholder}
        enterKeyHint="done"
        className="h-11 w-full rounded-2xl border border-line bg-bg px-4 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
      />
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <Badge key={v} className="gap-1 bg-line/70 py-1 pl-3 pr-1.5 text-ink">
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="cursor-pointer rounded-full p-0.5 hover:bg-line" aria-label={`Rimuovi ${v}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/** Pill multi-select (o single-select con `single`). */
export function PillSelect<T extends string>({
  options,
  value,
  onChange,
  single = false,
}: {
  options: { id: T; label: string }[];
  value: T[];
  onChange: (next: T[]) => void;
  single?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(single ? [o.id] : on ? value.filter((x) => x !== o.id) : [...value, o.id])}
            className={cn(
              "cursor-pointer rounded-full border px-3.5 py-2 text-xs font-semibold transition-all",
              on ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-surface text-muted hover:text-ink"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export const selectClass = "h-11 w-full rounded-2xl border border-line bg-bg px-4 text-sm text-ink";
