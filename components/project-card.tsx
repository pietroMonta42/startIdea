"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, MessageCircle, Star } from "lucide-react";
import { Project } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cn, gradientStyle, scrimStyle, initials, timeAgo } from "@/lib/utils";
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

export default function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const { profileById, commentsFor } = useStore();
  const owner = profileById(project.owner_id);
  const comments = commentsFor(project.id);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.4), type: "spring", damping: 26, stiffness: 260 }}
      className="group overflow-hidden rounded-3xl border border-line bg-surface shadow-sm transition-shadow hover:shadow-xl hover:shadow-zinc-950/5"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-display text-base font-bold text-white"
          style={gradientStyle(project)}
        >
          {initials(project.title).slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-[15px] font-bold text-ink">{project.title}</h3>
            {Date.now() - +new Date(project.created_at) < 7 * 864e5 && (
              <Badge className="bg-brand-500 text-white">NUOVO</Badge>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
            <MapPin className="h-3 w-3 shrink-0" />
            {project.location} · {timeAgo(project.created_at)}
            {owner && <> · di {owner.full_name.split(" ")[0]}</>}
          </p>
        </div>
        <StarButton project={project} />
      </div>

      {/* Hero */}
      <Link href={`/progetto/${project.id}`} className="block" aria-label={`Apri ${project.title}`}>
        <div
          className="relative flex aspect-[16/9] items-center justify-center overflow-hidden"
          style={gradientStyle(project, { dots: true })}
        >
          <span className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full blur-2xl" style={{ backgroundColor: "rgba(255,255,255,0.18)" }} />
          <span className="pointer-events-none absolute -bottom-10 -left-6 h-40 w-40 rounded-full blur-2xl" style={{ backgroundColor: "rgba(0,0,0,0.12)" }} />
          <span className="pointer-events-none absolute inset-0" style={scrimStyle()} />
          <h2 className="relative px-6 text-center font-display text-4xl font-bold tracking-tight text-white drop-shadow-md transition-transform duration-500 group-hover:scale-[1.04] sm:text-5xl">
            {project.title}
          </h2>
        </div>
      </Link>

      {/* Body */}
      <div className="p-4 pt-3">
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">{project.short_pitch}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {project.tags.map((t) => (
            <Badge key={t} className="bg-line/70 text-muted">
              {t}
            </Badge>
          ))}
          {project.open_roles.slice(0, 2).map((r) => (
            <Badge key={r} className="border border-brand-500/30 bg-brand-500/10 text-brand-600 dark:text-brand-400">
              cerca: {r}
            </Badge>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <Link
            href={`/progetto/${project.id}#community`}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
          >
            <MessageCircle className="h-4 w-4" />
            {comments.length} commenti
          </Link>
          <Link
            href={`/progetto/${project.id}`}
            className="text-xs font-bold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400"
          >
            Scopri di più →
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
