"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, GraduationCap, MapPin, MessageCircle, Share2, Star } from "lucide-react";
import { Project } from "@/lib/types";
import { categoryLabel } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn, gradientStyle, initials } from "@/lib/utils";
import { Badge } from "./ui";

export function StarButton({
  project,
  size = "md",
  className,
  onDark = false,
}: {
  project: Project;
  size?: "md" | "lg";
  className?: string;
  onDark?: boolean;
}) {
  const { hasStarred, toggleStar, starCount, user, toast } = useStore();
  const starred = hasStarred(project.id);
  return (
    <motion.button
      whileTap={{ scale: 0.82 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
          toast("Accedi per lasciare una stella");
          return;
        }
        toggleStar(project.id);
      }}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-full font-bold transition-colors",
        size === "md" && "px-3 py-1.5 text-sm",
        size === "lg" && "px-4 py-2 text-base",
        starred
          ? "bg-amber-400/15 text-amber-600 dark:text-amber-400"
          : onDark
            ? "bg-white/15 text-white hover:bg-white/25"
            : "bg-line/70 text-muted hover:text-ink",
        className
      )}
      aria-label="Lascia una stella"
    >
      <motion.span
        key={String(starred)}
        initial={{ scale: 0.4, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 10, stiffness: 400 }}
      >
        <Star className={cn(size === "md" ? "h-4 w-4" : "h-5 w-5", starred && "fill-amber-400 text-amber-400")} />
      </motion.span>
      {starCount(project)}
    </motion.button>
  );
}

export function ShareButton({
  project,
  size = "md",
  className,
  onDark = false,
}: {
  project: Project;
  size?: "md" | "lg";
  className?: string;
  onDark?: boolean;
}) {
  const { toast } = useStore();
  const share = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/progetto/${project.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: project.title, text: project.short_pitch, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("Link copiato negli appunti");
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      toast("Impossibile condividere il link");
    }
  };
  return (
    <button
      onClick={share}
      className={cn(
        "flex cursor-pointer items-center justify-center rounded-full transition-colors",
        size === "md" ? "p-2" : "p-2.5",
        onDark ? "bg-white/15 text-white hover:bg-white/25" : "bg-line/70 text-muted hover:text-ink",
        className
      )}
      aria-label="Condividi progetto"
      title="Condividi"
    >
      <Share2 className={size === "md" ? "h-4 w-4" : "h-5 w-5"} />
    </button>
  );
}

const INACTIVE_AFTER_DAYS = 45;

function activityInfo(project: Project) {
  const ref = project.updated_at ?? project.created_at;
  const days = Math.max(0, Math.floor((Date.now() - +new Date(ref)) / 864e5));
  const label = days === 0 ? "Aggiornato oggi" : days === 1 ? "Aggiornato 1 giorno fa" : `Aggiornato ${days} giorni fa`;
  return { label, inactive: days > INACTIVE_AFTER_DAYS };
}

export default function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const { profileById, commentsFor } = useStore();
  const owner = profileById(project.owner_id);
  const comments = commentsFor(project.id);
  const activity = activityInfo(project);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.4), type: "spring", damping: 26, stiffness: 260 }}
      className="group flex h-full flex-col rounded-3xl border border-line bg-surface p-4 shadow-sm transition-shadow hover:shadow-xl hover:shadow-zinc-950/5"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href={`/progetto/${project.id}`}
          aria-label={`Apri ${project.title}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-display text-base font-bold text-white"
          style={gradientStyle(project)}
        >
          {initials(project.title).slice(0, 1)}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate font-display text-[15px] font-bold text-ink">
              <Link href={`/progetto/${project.id}`}>{project.title}</Link>
            </h3>
            <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400">{project.stage === "launch" ? "LANCIO" : "IDEA"}</Badge>
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-muted">{project.short_pitch}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <StarButton project={project} />
          <ShareButton project={project} />
        </div>
      </div>

      {/* Meta: founder, università, città */}
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {owner && <span className="font-semibold text-ink">{owner.full_name}</span>}
        {owner?.university && (
          <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3 shrink-0" />{owner.university}</span>
        )}
        {project.location && (
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{project.location}</span>
        )}
      </p>

      {/* Ruoli aperti */}
      {project.open_roles.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {project.open_roles.slice(0, 4).map((r) => (
            <Badge key={r} className="border border-brand-500/30 bg-brand-500/10 text-brand-600 dark:text-brand-400">
              cerca: {r}
            </Badge>
          ))}
          {project.open_roles.length > 4 && <Badge className="bg-line/70 text-muted">+{project.open_roles.length - 4}</Badge>}
        </div>
      )}

      {project.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {project.tags.slice(0, 3).map((t) => (
            <Badge key={t} className="bg-line/70 text-muted">{categoryLabel(t)}</Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="min-h-4 flex-1" />
      <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
        <span className={"flex min-w-0 items-center gap-1.5 text-xs font-semibold text-muted"}>
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{activity.label}</span>
          {activity.inactive && <Badge className="bg-zinc-500/15 text-zinc-600 dark:text-zinc-400">Inattivo</Badge>}
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <Link
            href={`/progetto/${project.id}#community`}
            className="flex items-center gap-1 text-xs font-semibold text-muted transition-colors hover:text-ink"
          >
            <MessageCircle className="h-4 w-4" />
            {comments.length}
          </Link>
          <Link
            href={`/progetto/${project.id}`}
            className="text-xs font-bold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400"
          >
            Scopri →
          </Link>
        </span>
      </div>
    </motion.article>
  );
}
