import { Availability, Profile, Project, ProjectRole } from "./types";

export interface MatchResult {
  score: number; // 0 - 100
  reasons: string[];
}

/**
 * Formula deterministica Wave 2:
 * Score = 0.35 * S_skill + 0.20 * S_avail + 0.15 * S_loc + 0.15 * S_int + 0.10 * S_commit + 0.05 * S_act
 * Ogni componente S_* varia tra 0 e 100.
 */
export function calculateMatchScore(
  profile: Profile,
  project: Project,
  role?: ProjectRole | null
): MatchResult {
  const reasons: string[] = [];

  // 1. S_skill (35%): overlap tra profile.skills e role.skills (o tags del progetto se role non ha skills)
  let sSkill = 50; // default neutro
  const targetSkills = (role?.skills && role.skills.length > 0)
    ? role.skills
    : project.tags || [];

  if (targetSkills.length > 0 && profile.skills && profile.skills.length > 0) {
    const userSkillsLower = new Set(profile.skills.map((s) => s.toLowerCase().trim()));
    const matchedSkills = targetSkills.filter((ts) =>
      userSkillsLower.has(ts.toLowerCase().trim())
    );
    const ratio = matchedSkills.length / targetSkills.length;
    sSkill = Math.min(100, Math.round(ratio * 100));

    if (matchedSkills.length > 0) {
      reasons.push(`${matchedSkills.slice(0, 2).join(", ")} ✓`);
    }
  } else if (targetSkills.length === 0) {
    sSkill = 70;
  }

  // 2. S_avail (20%): disponibilità dichiarata rispetto alla modalità e ore richieste
  let sAvail = 60;
  const availMap: Record<Availability, number> = {
    full: 40,
    h10_20: 15,
    h5_10: 8,
    h1_5: 3,
    exploring: 0,
  };
  const userHours = availMap[profile.availability] ?? 8;
  const requiredHours = role?.hours_per_week ?? 10;

  if (profile.availability === "full") {
    sAvail = 100;
    reasons.push("Full commitment ✓");
  } else if (userHours >= requiredHours) {
    sAvail = 95;
    reasons.push(`${requiredHours}h/sett ✓`);
  } else if (userHours > 0) {
    sAvail = Math.round((userHours / requiredHours) * 80);
  } else {
    sAvail = 40; // exploring
  }

  // 3. S_loc (15%): compatibilità geografica / modalità (remoto = 100%)
  let sLoc = 50;
  const isRemote = role?.mode === "remote" || !role?.mode;
  if (isRemote) {
    sLoc = 100;
  } else {
    const targetCity = (role?.city || project.location || "").toLowerCase().trim();
    const userCity = (profile.city || "").toLowerCase().trim();
    const userUni = (profile.university || "").toLowerCase().trim();
    const projectUni = (project.university || "").toLowerCase().trim();

    if (targetCity && userCity && (targetCity.includes(userCity) || userCity.includes(targetCity))) {
      sLoc = 100;
      reasons.push(`${profile.city} ✓`);
    } else if (projectUni && userUni && (projectUni.includes(userUni) || userUni.includes(projectUni))) {
      sLoc = 95;
      reasons.push(`${profile.university} ✓`);
    } else {
      sLoc = role?.mode === "hybrid" ? 60 : 30;
    }
  }

  // 4. S_int (15%): overlap interessi profilo con categorie/tags del progetto
  let sInt = 50;
  if (profile.interests && profile.interests.length > 0 && project.tags && project.tags.length > 0) {
    const userInterestsLower = new Set(profile.interests.map((i) => i.toLowerCase().trim()));
    const matchedInt = project.tags.filter((t) =>
      userInterestsLower.has(t.toLowerCase().trim())
    );
    if (matchedInt.length > 0) {
      sInt = 100;
      reasons.push(`${matchedInt[0]} ✓`);
    } else {
      sInt = 40;
    }
  }

  // 5. S_commit (10%): tipo collaborazione (looking_for vs collab_type)
  let sCommit = 70;
  const collab = role?.collab_type ?? "cofounder";
  const lookingFor = profile.looking_for || [];
  if (collab === "cofounder" && lookingFor.includes("cofounder")) {
    sCommit = 100;
    reasons.push("Co-founder ✓");
  } else if (collab === "equity" && (lookingFor.includes("cofounder") || lookingFor.includes("side_project"))) {
    sCommit = 90;
  } else if (lookingFor.includes("collaborator") || lookingFor.includes("side_project")) {
    sCommit = 85;
  }

  // 6. S_act (5%): attività (bio presente, profilo completo, ruoli attivi)
  let sAct = 70;
  if (profile.bio && profile.skills.length > 2) {
    sAct = 100;
  }

  // Formula ponderata finale
  const rawScore =
    0.35 * sSkill +
    0.20 * sAvail +
    0.15 * sLoc +
    0.15 * sInt +
    0.10 * sCommit +
    0.05 * sAct;

  const score = Math.max(10, Math.min(100, Math.round(rawScore)));

  return {
    score,
    reasons: reasons.slice(0, 3), // max 3 pill di motivazione sintetica
  };
}
