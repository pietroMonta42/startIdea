import React from "react";
import { Clock, Search } from "lucide-react";
import { Availability, AVAILABILITY_LABELS, LOOKING_FOR_LABELS, LookingFor } from "@/lib/types";
import { Badge } from "./ui";

export function AvailabilityBadge({ value }: { value: Availability }) {
  const tone = value === "exploring" ? "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  return (
    <Badge className={tone}>
      <Clock className="h-3 w-3" />
      {AVAILABILITY_LABELS[value] ?? AVAILABILITY_LABELS.exploring}
    </Badge>
  );
}

export function LookingForBadges({ values }: { values?: LookingFor[] }) {
  if (!values?.length) return null;
  return (
    <>
      {values.map((v) => (
        <Badge key={v} className="border border-brand-500/30 bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <Search className="h-3 w-3" />
          {LOOKING_FOR_LABELS[v]}
        </Badge>
      ))}
    </>
  );
}
