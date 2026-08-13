export type RoleBadge = "tech_dev" | "design" | "marketing" | "business";
export type Availability = "available" | "busy" | "consulting";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role_badge: RoleBadge;
  skills: string[];
  bio: string | null;
  availability: Availability;
  university?: string;
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
  tech_dev: "Tech/Dev",
  design: "Design",
  marketing: "Marketing",
  business: "Business",
};

export const ROLE_COLORS: Record<RoleBadge, string> = {
  tech_dev: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  design: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  marketing: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  business: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};
