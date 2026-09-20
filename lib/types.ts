export type RoleBadge = "tech_dev" | "design" | "marketing" | "business" | "other";
export type Availability = "available" | "busy" | "consulting";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role_badge: RoleBadge;
  role_custom?: string | null;
  skills: string[];
  bio: string | null;
  availability: Availability;
  university?: string;
  profile_color?: string;
  is_admin?: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  short_pitch: string;
  readme_markdown: string;
  open_roles: string[];
  tags: string[];
  stars_count: number;
  location: string;
  theme?: number;
  created_at: string;
}

export interface ProjectComment {
  id: string;
  project_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface Application {
  id: string;
  project_id: string;
  applicant_id: string;
  target_role: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export const ROLE_LABELS: Record<RoleBadge, string> = {
  tech_dev: "Tecnologia/Sviluppo",
  design: "Design",
  marketing: "Marketing",
  business: "Impresa",
  other: "Altro",
};

export const ROLE_COLORS: Record<RoleBadge, string> = {
  tech_dev: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  design: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  marketing: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  business: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  other: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

export const PROFILE_COLORS = [
  { name: "Arancio", value: "#f97316", gradient: "linear-gradient(135deg, #fb923c, #c2410c)" },
  { name: "Corallo", value: "#f43f5e", gradient: "linear-gradient(135deg, #fb7185, #be123c)" },
  { name: "Viola", value: "#8b5cf6", gradient: "linear-gradient(135deg, #a78bfa, #6d28d9)" },
  { name: "Blu", value: "#3b82f6", gradient: "linear-gradient(135deg, #60a5fa, #1d4ed8)" },
  { name: "Turchese", value: "#14b8a6", gradient: "linear-gradient(135deg, #2dd4bf, #0f766e)" },
  { name: "Verde", value: "#22c55e", gradient: "linear-gradient(135deg, #4ade80, #15803d)" },
  { name: "Ambra", value: "#eab308", gradient: "linear-gradient(135deg, #facc15, #a16207)" },
  { name: "Indaco", value: "#6366f1", gradient: "linear-gradient(135deg, #818cf8, #3730a3)" },
];
