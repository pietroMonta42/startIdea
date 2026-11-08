export type RoleBadge = "tech_dev" | "design" | "marketing" | "business" | "other";
export type Availability = "exploring" | "h1_5" | "h5_10" | "h10_20" | "full";
export type LookingFor = "cofounder" | "side_project" | "collaborator" | "internship" | "exploring";
export type RoleMode = "remote" | "onsite" | "hybrid";
export type CollabType = "cofounder" | "equity" | "unpaid" | "paid";
export type ConnectionStatus = "pending" | "accepted" | "declined";
export type ProjectStage = "idea" | "launch";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "mutual_match";
export type FounderRequestStatus = "pending" | "in_progress" | "answered" | "closed";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role_badge: RoleBadge;
  role_custom?: string | null;
  skills: string[];
  bio: string | null;
  availability: Availability;
  university?: string | null;
  city?: string | null;
  looking_for?: LookingFor[];
  /** Campi del profilo completo: presenti solo per sé, team e collegati (`is_full`). */
  interests?: string[];
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  is_full?: boolean;
  profile_color?: string;
  is_admin?: boolean;
  created_at: string;
}

export interface ProjectRole {
  id: string;
  project_id: string;
  title: string;
  skills: string[];
  hours_per_week: number | null;
  mode: RoleMode;
  city: string | null;
  collab_type: CollabType;
  is_open: boolean;
  created_at: string;
}

export type ProjectRoleInput = Pick<ProjectRole, "title" | "skills" | "hours_per_week" | "mode" | "city" | "collab_type">;

export interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  message: string | null;
  status: ConnectionStatus;
  created_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  short_pitch: string;
  /** Legacy: Markdown dei progetti pubblicati prima del wizard semplificato. */
  readme_markdown: string;
  problem?: string;
  solution?: string;
  progress?: string;
  university?: string | null;
  open_roles: string[];
  tags: string[];
  stars_count: number;
  location: string;
  link?: string | null;
  stage?: ProjectStage;
  is_active?: boolean;
  theme?: number;
  created_at: string;
  /** Ultima modifica ai contenuti del progetto (non commenti/candidature). Fallback: created_at. */
  updated_at?: string;
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
  role_id?: string | null;
  applicant_id: string;
  target_role: string;
  message: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_consent?: boolean;
  status: ApplicationStatus;
  created_at: string;
}

export interface FounderResource {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  is_recommended: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FounderRequest {
  id: string;
  user_id: string;
  project_id: string;
  subject: string;
  message: string;
  contact_email: string | null;
  contact_phone: string | null;
  contact_consent: boolean;
  status: FounderRequestStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  exploring: "Exploring",
  h1_5: "1–5h/settimana",
  h5_10: "5–10h/settimana",
  h10_20: "10–20h/settimana",
  full: "Full commitment",
};

export const AVAILABILITY_ORDER: Availability[] = ["exploring", "h1_5", "h5_10", "h10_20", "full"];

export const LOOKING_FOR_LABELS: Record<LookingFor, string> = {
  cofounder: "Co-founder",
  side_project: "Side project",
  collaborator: "Collaborator",
  internship: "Internship",
  exploring: "Just exploring",
};

export const MODE_LABELS: Record<RoleMode, string> = { remote: "Remoto", onsite: "Presenza", hybrid: "Ibrido" };
export const COLLAB_LABELS: Record<CollabType, string> = { cofounder: "Co-founder", equity: "Equity", unpaid: "Unpaid", paid: "Paid" };

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

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  project_id?: string | null;
  content: string;
  read_at?: string | null;
  created_at: string;
}
