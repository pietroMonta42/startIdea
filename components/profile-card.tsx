"use client";

import { calculateMatchScore } from "@/lib/matching";
import { useStore } from "@/lib/store";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, MapPin } from "lucide-react";
import { Profile, ROLE_COLORS, ROLE_LABELS } from "@/lib/types";
import { gradientStyle, initials } from "@/lib/utils";
import { Badge } from "./ui";
import { AvailabilityBadge, LookingForBadges } from "./profile-badges";

/** Card pubblica e minimale: nessun contatto, link o interesse. */
export default function ProfileCard({ profile, index = 0 }: { profile: Profile; index?: number }) {
  const { user, projects, roles } = useStore();
  // Se l'utente corrente ha progetti attivi con ruoli, calcoliamo il match migliore per dare un'indicazione immediata
  const myProjects = user ? projects.filter((p) => p.owner_id === user.id && p.is_active !== false) : [];
  const topMatch = React.useMemo(() => {
    if (!myProjects.length) return null;
    let best = { score: 0, reasons: [] as string[] };
    for (const pr of myProjects) {
      const prRoles = roles.filter((r) => r.project_id === pr.id && r.is_open);
      if (prRoles.length) {
        for (const r of prRoles) {
          const res = calculateMatchScore(profile, pr, r);
          if (res.score > best.score) best = res;
        }
      } else {
        const res = calculateMatchScore(profile, pr, null);
        if (res.score > best.score) best = res;
      }
    }
    return best.score >= 50 ? best : null;
  }, [profile, myProjects, roles]);
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.4), type: "spring", damping: 26, stiffness: 260 }}
      className="relative flex h-full flex-col gap-3 rounded-3xl border border-line bg-surface p-4 shadow-sm transition-shadow hover:shadow-xl hover:shadow-zinc-950/5"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-display text-base font-bold text-white"
          style={profile.profile_color ? { backgroundColor: profile.profile_color } : gradientStyle(profile.id)}
        >
          {initials(profile.full_name).slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[15px] font-bold text-ink">
            <Link href={`/persona/${profile.id}`} className="after:absolute after:inset-0 after:content-['']">
              {profile.full_name}
            </Link>
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge className={ROLE_COLORS[profile.role_badge]}>
              {profile.role_badge === "other" && profile.role_custom ? profile.role_custom : ROLE_LABELS[profile.role_badge]}
            </Badge>
            <AvailabilityBadge value={profile.availability} />
            {topMatch && (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {topMatch.score}% match {topMatch.reasons[0] ? `· ${topMatch.reasons[0]}` : ""}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {(profile.university || profile.city) && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {profile.university && <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3 shrink-0" />{profile.university}</span>}
          {profile.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{profile.city}</span>}
        </p>
      )}

      {profile.bio && <p className="line-clamp-3 text-sm leading-snug text-muted">{profile.bio}</p>}

      {(profile.looking_for?.length ?? 0) > 0 && (
        <div className="flex flex-wrap items-center gap-1.5"><LookingForBadges values={profile.looking_for} /></div>
      )}

      {profile.skills.length > 0 && (
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          {profile.skills.slice(0, 5).map((s) => (
            <Badge key={s} className="bg-line/70 text-muted">{s}</Badge>
          ))}
          {profile.skills.length > 5 && <Badge className="bg-line/70 text-muted">+{profile.skills.length - 5}</Badge>}
        </div>
      )}
    </motion.article>
  );
}
