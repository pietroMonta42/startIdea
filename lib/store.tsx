"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { Application, ApplicationStatus, Availability, Connection, FounderRequest, FounderResource, LookingFor, Message, Profile, Project, ProjectComment, ProjectRole, ProjectRoleInput, RoleBadge } from "./types";
import { SEED_COMMENTS, SEED_PROFILES, SEED_PROJECTS } from "./data";
import { initials, timeAgo, uid } from "./utils";
import { supabase } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/client";

const LS_LOCAL_STARS = "sparklab-local-stars-v1";

interface Store {
  authReady: boolean;
  hydrated: boolean;
  session: Session | null;
  user: Profile | null;
  isAdmin: boolean;
  profiles: Profile[];
  /** Builder registrati (tab "Persone" di /esplora): solo campi pubblici minimali. */
  builders: Profile[];
  projects: Project[];
  roles: ProjectRole[];
  connections: Connection[];
  comments: ProjectComment[];
  applications: Application[];
  messages: Message[];
  unreadMessagesCount: number;
  founderResources: FounderResource[];
  founderRequests: FounderRequest[];
  canAccessFounder: boolean;
  // auth
  signInOAuth: (provider: "github" | "google") => Promise<void>;
  signInOtp: (email: string, meta: { full_name: string; role: RoleBadge; university: string; role_custom?: string }) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, meta: { full_name: string; role: RoleBadge; university: string; role_custom?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  setAvailability: (a: Availability) => void;
  // projects
  addProject: (p: Omit<Project, "id" | "owner_id" | "stars_count" | "created_at" | "updated_at" | "open_roles">, roles: ProjectRoleInput[]) => Promise<string | null>;
  updateProject: (id: string, patch: Partial<Pick<Project, "title" | "short_pitch" | "readme_markdown" | "problem" | "solution" | "progress" | "university" | "tags" | "location" | "link" | "stage" | "is_active">>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  // project roles
  rolesFor: (projectId: string) => ProjectRole[];
  createRole: (projectId: string, role: ProjectRoleInput) => Promise<boolean>;
  updateRole: (id: string, patch: Partial<ProjectRoleInput>) => Promise<boolean>;
  setRoleOpen: (id: string, open: boolean) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  // connections
  connectionWith: (profileId: string) => Connection | undefined;
  requestConnection: (addresseeId: string, message: string) => Promise<boolean>;
  respondConnection: (id: string, accept: boolean) => Promise<void>;
  removeConnection: (id: string) => Promise<void>;
  fetchProfileDetail: (id: string) => Promise<Profile | null>;
  // social
  toggleStar: (projectId: string) => void;
  addComment: (projectId: string, content: string) => Promise<void>;
  addApplication: (projectId: string, targetRole: string, message: string, contact: { email: string; phone: string; consent: boolean }, roleId?: string) => Promise<boolean>;
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) => Promise<void>;
  sendMessage: (recipientId: string, content: string, projectId?: string) => Promise<boolean>;
  markMessagesAsRead: (senderId: string) => Promise<void>;
  createFounderResource: (resource: Omit<FounderResource, "id" | "created_at" | "updated_at">) => Promise<boolean>;
  updateFounderResource: (id: string, patch: Partial<Omit<FounderResource, "id" | "created_at" | "updated_at">>) => Promise<boolean>;
  submitFounderRequest: (request: Pick<FounderRequest, "project_id" | "subject" | "message" | "contact_email" | "contact_phone" | "contact_consent">) => Promise<boolean>;
  updateFounderRequest: (id: string, patch: Pick<FounderRequest, "status" | "admin_notes">) => Promise<boolean>;
  // admin
  deleteProfileAdmin: (profileId: string) => Promise<void>;
  // selectors
  hasStarred: (projectId: string) => boolean;
  starCount: (p: Project) => number;
  commentsFor: (projectId: string) => ProjectComment[];
  applicationsFor: (projectId: string) => Application[];
  myApplication: (projectId: string) => Application | undefined;
  profileById: (id: string) => Profile | undefined;
  projectById: (id: string) => Project | undefined;
  isDemoProject: (id: string) => boolean;
  toast: (msg: string) => void;
}

const Ctx = createContext<Store | null>(null);

// Demo mode: seed projects visible in dev, hidden in prod.
// Enable explicitly with NEXT_PUBLIC_DEMO_MODE="true", disable with "false".
// Default: enabled when Supabase is NOT configured, disabled when it is.
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false" && process.env.NEXT_PUBLIC_DEMO_MODE !== "0";
const SHOW_SEED = DEMO_MODE || !isSupabaseConfigured;

const SEED_PROJECTS_VISIBLE = SHOW_SEED ? SEED_PROJECTS : [];
const DEMO_PROFILES_MAP = new Map((SHOW_SEED ? SEED_PROFILES : []).map((p) => [p.id, p]));

function profileFromRow(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    full_name: row.full_name as string,
    avatar_url: (row.avatar_url as string | null) ?? null,
    role_badge: row.role_badge as RoleBadge,
    role_custom: (row.role_custom as string | undefined) ?? undefined,
    skills: (row.skills as string[]) ?? [],
    bio: (row.bio as string | null) ?? null,
    availability: (row.availability as Availability | undefined) ?? "exploring",
    university: (row.university as string | undefined) ?? undefined,
    city: (row.city as string | null | undefined) ?? null,
    looking_for: (row.looking_for as LookingFor[] | undefined) ?? [],
    interests: row.interests as string[] | undefined,
    linkedin_url: (row.linkedin_url as string | null | undefined) ?? null,
    portfolio_url: (row.portfolio_url as string | null | undefined) ?? null,
    is_full: row.is_full as boolean | undefined,
    profile_color: (row.profile_color as string | undefined) ?? "#f97316",
    is_admin: (row.is_admin as boolean | undefined) ?? false,
    created_at: (row.created_at as string | undefined) ?? "",
  };
}

function mergeProfiles(current: Profile[], incoming: Profile[]): Profile[] {
  const byId = new Map(current.map((profile) => [profile.id, profile]));
  for (const profile of incoming) {
    if (!byId.has(profile.id)) byId.set(profile.id, profile);
  }
  return [...byId.values()];
}

function projectFromRow(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    owner_id: row.owner_id as string,
    title: row.title as string,
    short_pitch: row.short_pitch as string,
    readme_markdown: (row.readme_markdown as string | undefined) ?? "",
    problem: (row.problem as string | undefined) ?? "",
    solution: (row.solution as string | undefined) ?? "",
    progress: (row.progress as string | undefined) ?? "",
    university: (row.university as string | null | undefined) ?? null,
    open_roles: (row.open_roles as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    location: (row.location as string) ?? "",
    link: (row.link as string | null) ?? null,
    stage: (row.stage as Project["stage"]) ?? "idea",
    is_active: (row.is_active as boolean | undefined) ?? true,
    stars_count: (row.stars_count as number) ?? 0,
    theme: typeof row.theme === "number" ? (row.theme as number) : undefined,
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string | undefined) ?? (row.created_at as string),
  };
}

function roleFromRow(row: Record<string, unknown>): ProjectRole {
  return {
    id: row.id as string,
    project_id: row.project_id as string,
    title: row.title as string,
    skills: (row.skills as string[] | undefined) ?? [],
    hours_per_week: (row.hours_per_week as number | null | undefined) ?? null,
    mode: (row.mode as ProjectRole["mode"] | undefined) ?? "remote",
    city: (row.city as string | null | undefined) ?? null,
    collab_type: (row.collab_type as ProjectRole["collab_type"] | undefined) ?? "cofounder",
    is_open: (row.is_open as boolean | undefined) ?? true,
    created_at: (row.created_at as string | undefined) ?? "",
  };
}

// Ruoli demo derivati da open_roles dei progetti seed.
const SEED_ROLES: ProjectRole[] = SEED_PROJECTS_VISIBLE.flatMap((project) =>
  project.open_roles.map((title, i) => ({
    id: `role-${project.id}-${i}`,
    project_id: project.id,
    title,
    skills: [],
    hours_per_week: null,
    mode: "remote" as const,
    city: null,
    collab_type: "cofounder" as const,
    is_open: true,
    created_at: project.created_at,
  }))
);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [dbBuilders, setDbBuilders] = useState<Profile[]>([]);
  const [dbProjects, setDbProjects] = useState<Project[]>([]);
  const [dbRoles, setDbRoles] = useState<ProjectRole[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [founderResources, setFounderResources] = useState<FounderResource[]>([]);
  const [founderRequests, setFounderRequests] = useState<FounderRequest[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [localStarIds, setLocalStarIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<{ id: string; msg: string }[]>([]);

  const projects = useMemo<Project[]>(() => [...SEED_PROJECTS_VISIBLE, ...dbProjects], [dbProjects]);
  const roles = useMemo<ProjectRole[]>(() => [...SEED_ROLES, ...dbRoles], [dbRoles]);
  const builders = useMemo<Profile[]>(() => {
    const seen = new Set(dbBuilders.map((b) => b.id));
    return [...dbBuilders, ...[...DEMO_PROFILES_MAP.values()].filter((p) => !seen.has(p.id))];
  }, [dbBuilders]);
  const canAccessFounder = Boolean(user && dbProjects.some((project) => project.owner_id === user.id && project.is_active !== false));
  const isDemoProject = useCallback((id: string) => id.startsWith("pr-") && !dbProjects.some((p) => p.id === id), [dbProjects]);

  const toast = useCallback((msg: string) => {
    const id = uid();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  /* ---- loaders ---- */
  const loadPublic = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const [proj, comm, roleRes] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("project_comments").select("*").order("created_at", { ascending: true }),
      supabase.from("project_roles").select("*").order("created_at", { ascending: true }),
    ]);
    if (roleRes.data) setDbRoles(roleRes.data.map((row: Record<string, unknown>) => roleFromRow(row)));
    if (proj.data) setDbProjects(proj.data.map(projectFromRow));
    if (comm.data) setComments(comm.data as unknown as ProjectComment[]);
    // Elenco builder: solo campi minimali, pubblico anche per i non loggati.
    const { data: builderRows } = await supabase.rpc("get_builder_profiles");
    setDbBuilders(builderRows ? builderRows.map((row: Record<string, unknown>) => profileFromRow(row)) : []);
    const profileIds = [...new Set([
      ...(proj.data ?? []).map((project) => project.owner_id as string),
      ...(comm.data ?? []).map((comment) => comment.author_id as string),
    ])];
    if (profileIds.length) {
      const { data: publicProfiles } = await supabase.rpc("get_public_profiles", { profile_ids: profileIds });
      if (publicProfiles) setProfiles((current) => mergeProfiles(current, publicProfiles.map((row: Record<string, unknown>) => profileFromRow(row))));
    }
  }, []);

  const loadUserData = useCallback(async (u: User) => {
    if (!isSupabaseConfigured) return;
    // ensure profile exists
    let { data: profRow } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();
    if (!profRow) {
      const meta = u.user_metadata ?? {};
      await supabase.from("profiles").upsert({
        id: u.id,
        full_name: meta.full_name ?? meta.name ?? u.email?.split("@")[0] ?? "Nuovo utente",
        role_badge: (meta.role_badge as RoleBadge) ?? "tech_dev",
        role_custom: (meta.role_custom as string | undefined) ?? null,
        university: meta.university ?? null,
      });
      ({ data: profRow } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle());
    }
    const prof = profRow ? profileFromRow(profRow) : null;
    setUser(prof);
    setIsAdmin(Boolean(prof?.is_admin));
    if (prof) {
      setProfiles((current) => [...current.filter((profile) => profile.id !== prof.id), prof]);
    }

    const [starRes, ownedProjectsRes, ownAppsRes, resourcesRes, requestsRes, connRes, msgRes] = await Promise.all([
      supabase.from("project_stars").select("project_id").eq("user_id", u.id),
      supabase.from("projects").select("id").eq("owner_id", u.id),
      supabase.from("applications").select("*").eq("applicant_id", u.id),
      supabase.from("founder_resources").select("*").order("sort_order").order("created_at", { ascending: false }),
      supabase.from("founder_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("connections").select("*").order("created_at", { ascending: false }),
      supabase.from("messages").select("*").or(`sender_id.eq.${u.id},recipient_id.eq.${u.id}`).order("created_at", { ascending: true }),
    ]);
    setConnections((connRes.data ?? []) as unknown as Connection[]);
    setMessages((msgRes.data ?? []) as unknown as Message[]);
    const ownedProjectIds = (ownedProjectsRes.data ?? []).map((row) => row.id as string);
    const receivedAppsRes = ownedProjectIds.length
      ? await supabase.from("applications").select("*").in("project_id", ownedProjectIds)
      : { data: [], error: null };
    const combinedApplications = new Map<string, Application>();
    for (const row of [...(ownAppsRes.data ?? []), ...(receivedAppsRes.data ?? [])]) {
      combinedApplications.set(row.id as string, row as unknown as Application);
    }
    setStarredIds((starRes.data ?? []).map((r) => (r as Record<string, string>).project_id));
    setApplications([...combinedApplications.values()]);
    setFounderResources((resourcesRes.data ?? []) as unknown as FounderResource[]);
    setFounderRequests((requestsRes.data ?? []) as unknown as FounderRequest[]);
    if (prof?.is_admin) {
      const { data: adminProfiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (adminProfiles) setProfiles(adminProfiles.map(profileFromRow));
    } else {
      const applicantIds = [...new Set((receivedAppsRes.data ?? []).map((application) => application.applicant_id as string))];
      const relatedProfileIds = [...new Set([u.id, ...applicantIds])];
      const { data: relatedProfiles } = await supabase.rpc("get_public_profiles", { profile_ids: relatedProfileIds });
      if (relatedProfiles) setProfiles((current) => mergeProfiles(current, relatedProfiles.map((row: Record<string, unknown>) => profileFromRow(row))));
    }
  }, []);

  /* ---- auth bootstrap ---- */
  useEffect(() => {
    let mounted = true;
    if (!isSupabaseConfigured) {
      setAuthReady(true);
      setHydrated(true);
      return () => { mounted = false; };
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
      const u = data.session?.user ?? null;
      Promise.all([loadPublic(), u ? loadUserData(u) : Promise.resolve()]).finally(() => setHydrated(true));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt: AuthChangeEvent, s: Session | null) => {
      setSession(s);
      if (s?.user) {
        // Do not render the previous profile while the new account is loading.
        setUser((previous) => previous?.id === s.user.id ? previous : null);
        setDbProjects([]);
        setProfiles([]);
        loadPublic();
        setIsAdmin(false);
        setStarredIds([]);
        setApplications([]);
        setConnections([]);
        setMessages([]);
        setFounderResources([]);
        setFounderRequests([]);
        loadUserData(s.user).finally(() => setHydrated(true));
      }
      else {
        setUser(null);
        setDbProjects([]);
        setProfiles([]);
        loadPublic();
        setIsAdmin(false);
        setStarredIds([]);
        setApplications([]);
        setConnections([]);
        setMessages([]);
        setFounderResources([]);
        setFounderRequests([]);
      }
    });

    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_LOCAL_STARS) : null;
    if (raw) setLocalStarIds(JSON.parse(raw));

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadPublic, loadUserData]);

  useEffect(() => {
    if (localStarIds.length) localStorage.setItem(LS_LOCAL_STARS, JSON.stringify(localStarIds));
  }, [localStarIds]);

  /* ---- actions ---- */
  const refreshAfterUserDataChange = useCallback(async () => {
    if (!session?.user) return;
    await loadUserData(session.user);
  }, [session, loadUserData]);

  const signInOAuth = useCallback(async (provider: "github" | "google") => {
    const redirectTo = `${window.location.origin}/auth/callback?next=/profilo`;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) toast(error.message);
  }, [toast]);

  const signInOtp = useCallback(async (email: string, meta: { full_name: string; role: RoleBadge; university: string; role_custom?: string }) => {
    // Un magic link deve poter cambiare account anche se il browser ha una sessione precedente.
    await supabase.auth.signOut({ scope: "local" });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/profilo`,
        data: { full_name: meta.full_name, role_badge: meta.role, role_custom: meta.role_custom, university: meta.university },
      },
    });
    if (error) toast(error.message);
    else toast("Magic link inviato! Controlla la mail 📩");
  }, [toast]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast(error.message);
  }, [toast]);

  const signUpWithEmail = useCallback(async (email: string, password: string, meta: { full_name: string; role: RoleBadge; university: string; role_custom?: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/profilo`,
        data: { full_name: meta.full_name, role_badge: meta.role, role_custom: meta.role_custom, university: meta.university },
      },
    });
    if (error) toast(error.message);
    else toast("Controlla la mail per confermare l'account ✉️");
  }, [toast]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setDbProjects([]);
    setProfiles([]);
    loadPublic();
    setStarredIds([]);
    setApplications([]);
    setConnections([]);
    setMessages([]);
    setFounderResources([]);
    setFounderRequests([]);
    setIsAdmin(false);
  }, [loadPublic]);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    if (!session?.user) return;
    const { error } = await supabase.from("profiles").update(patch).eq("id", session.user.id);
    if (error) return toast(error.message);
    await refreshAfterUserDataChange();
    toast("Profilo aggiornato");
  }, [session, refreshAfterUserDataChange, toast]);

  const setAvailability = useCallback((a: Availability) => {
    updateProfile({ availability: a });
  }, [updateProfile]);

  const addProject = useCallback(async (p: Omit<Project, "id" | "owner_id" | "stars_count" | "created_at" | "updated_at" | "open_roles">, newRoles: ProjectRoleInput[]) => {
    if (!session?.user) { toast("Accedi per pubblicare"); return null; }
    const { data, error } = await supabase.from("projects").insert({
      owner_id: session.user.id,
      title: p.title,
      short_pitch: p.short_pitch,
      readme_markdown: p.readme_markdown ?? "",
      problem: p.problem ?? "",
      solution: p.solution ?? "",
      progress: p.progress ?? "",
      university: p.university ?? null,
      open_roles: newRoles.map((r) => r.title),
      tags: p.tags,
      location: p.location,
      link: p.link ?? null,
      stage: p.stage ?? "idea",
      is_active: p.is_active ?? true,
      theme: p.theme,
    }).select().single();
    if (error || !data) { toast(error?.message ?? "Errore"); return null; }
    let created: ProjectRole[] = [];
    if (newRoles.length) {
      const { data: roleRows, error: roleError } = await supabase.from("project_roles").insert(
        newRoles.map((r) => ({ project_id: data.id, title: r.title, skills: r.skills, hours_per_week: r.hours_per_week, mode: r.mode, city: r.city, collab_type: r.collab_type }))
      ).select();
      if (roleError) {
        await supabase.from("projects").delete().eq("id", data.id);
        toast(roleError.message);
        return null;
      }
      created = (roleRows ?? []).map((row: Record<string, unknown>) => roleFromRow(row));
    }
    setDbProjects((prev) => [projectFromRow(data), ...prev]);
    setDbRoles((prev) => [...prev, ...created]);
    const { data: resources } = await supabase.from("founder_resources").select("*").order("sort_order").order("created_at", { ascending: false });
    setFounderResources((resources ?? []) as unknown as FounderResource[]);
    return data.id as string;
  }, [session, toast]);

  const updateProject = useCallback(async (id: string, patch: Partial<Pick<Project, "title" | "short_pitch" | "readme_markdown" | "problem" | "solution" | "progress" | "university" | "tags" | "location" | "link" | "stage" | "is_active">>) => {
    const { error } = await supabase.from("projects").update(patch).eq("id", id);
    if (error) return toast(error.message);
    const updatedProjects = projects.map((project) => project.id === id ? { ...project, ...patch } : project);
    setDbProjects((prev) => prev.map((project) => (project.id === id ? { ...project, ...patch } : project)));
    if (session?.user && !updatedProjects.some((project) => project.owner_id === session.user!.id && project.is_active !== false)) {
      setFounderResources([]);
    } else if (session?.user && patch.is_active === true) {
      const { data: resources } = await supabase.from("founder_resources").select("*").order("sort_order").order("created_at", { ascending: false });
      setFounderResources((resources ?? []) as unknown as FounderResource[]);
    }
    // updated_at è gestito dal trigger DB: riflettilo subito in locale
    setDbProjects((prev) => prev.map((project) => (project.id === id ? { ...project, updated_at: new Date().toISOString() } : project)));
    toast("Progetto aggiornato");
  }, [projects, session, toast]);

  const deleteProject = useCallback(async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast(error.message);
    setDbProjects((prev) => prev.filter((p) => p.id !== id));
    setComments((prev) => prev.filter((c) => c.project_id !== id));
    toast("Progetto eliminato");
  }, [toast]);

  /* ---- project roles ---- */
  const rolesFor = useCallback((projectId: string) => roles.filter((r) => r.project_id === projectId), [roles]);

  const refreshProjectActivity = useCallback(async (projectId: string) => {
    const { data } = await supabase.from("projects").select("open_roles, updated_at").eq("id", projectId).maybeSingle();
    if (!data) return;
    setDbProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, open_roles: (data.open_roles as string[]) ?? [], updated_at: data.updated_at as string } : p)));
  }, []);

  const createRole = useCallback(async (projectId: string, role: ProjectRoleInput) => {
    if (isDemoProject(projectId)) { toast("I progetti demo sono di esempio"); return false; }
    const { data, error } = await supabase.from("project_roles").insert({ project_id: projectId, ...role }).select().single();
    if (error || !data) { toast(error?.message ?? "Errore"); return false; }
    setDbRoles((prev) => [...prev, roleFromRow(data)]);
    await refreshProjectActivity(projectId);
    toast("Posizione aggiunta");
    return true;
  }, [isDemoProject, refreshProjectActivity, toast]);

  const updateRole = useCallback(async (id: string, patch: Partial<ProjectRoleInput>) => {
    const { data, error } = await supabase.from("project_roles").update(patch).eq("id", id).select().single();
    if (error || !data) { toast(error?.message ?? "Errore"); return false; }
    setDbRoles((prev) => prev.map((r) => (r.id === id ? roleFromRow(data) : r)));
    await refreshProjectActivity(data.project_id as string);
    toast("Posizione aggiornata");
    return true;
  }, [refreshProjectActivity, toast]);

  const setRoleOpen = useCallback(async (id: string, open: boolean) => {
    const { data, error } = await supabase.from("project_roles").update({ is_open: open }).eq("id", id).select().single();
    if (error || !data) return toast(error?.message ?? "Errore");
    setDbRoles((prev) => prev.map((r) => (r.id === id ? roleFromRow(data) : r)));
    await refreshProjectActivity(data.project_id as string);
    toast(open ? "Posizione riaperta" : "Posizione chiusa");
  }, [refreshProjectActivity, toast]);

  const deleteRole = useCallback(async (id: string) => {
    const role = dbRoles.find((r) => r.id === id);
    const { error } = await supabase.from("project_roles").delete().eq("id", id);
    if (error) return toast(error.message);
    setDbRoles((prev) => prev.filter((r) => r.id !== id));
    if (role) await refreshProjectActivity(role.project_id);
    toast("Posizione eliminata");
  }, [dbRoles, refreshProjectActivity, toast]);


  const sendMessage = useCallback(async (recipientId: string, content: string, projectId?: string) => {
    if (!session?.user) { toast("Accedi per inviare messaggi"); return false; }
    if (!content.trim()) return false;
    const trimmed = content.trim();
    const newMsg: Message = {
      id: uid(),
      sender_id: session.user.id,
      recipient_id: recipientId,
      project_id: projectId || null,
      content: trimmed,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    // Optimistic update
    setMessages((prev) => [...prev, newMsg]);
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("messages").insert({
        sender_id: session.user.id,
        recipient_id: recipientId,
        project_id: projectId || null,
        content: trimmed,
      }).select().single();
      if (error) {
        toast("Errore nell'invio del messaggio");
        setMessages((prev) => prev.filter((m) => m.id !== newMsg.id));
        return false;
      }
      if (data) {
        setMessages((prev) => prev.map((m) => m.id === newMsg.id ? (data as unknown as Message) : m));
      }
    }
    return true;
  }, [session, toast]);

  const markMessagesAsRead = useCallback(async (senderId: string) => {
    if (!session?.user) return;
    const now = new Date().toISOString();
    setMessages((prev) => prev.map((m) => m.sender_id === senderId && m.recipient_id === session.user!.id && !m.read_at ? { ...m, read_at: now } : m));
    if (isSupabaseConfigured) {
      await supabase.from("messages").update({ read_at: now }).eq("sender_id", senderId).eq("recipient_id", session.user.id).is("read_at", null);
    }
  }, [session]);

  const unreadMessagesCount = useMemo(() => {
    if (!session?.user) return 0;
    return messages.filter((m) => m.recipient_id === session.user!.id && !m.read_at).length;
  }, [messages, session]);

  /* ---- connections ---- */
  const connectionWith = useCallback((profileId: string) =>
    connections.find((c) => c.requester_id === profileId || c.addressee_id === profileId), [connections]);

  const requestConnection = useCallback(async (addresseeId: string, message: string) => {
    if (!session?.user) { toast("Accedi per collegarti"); return false; }
    if (!isSupabaseConfigured || addresseeId.startsWith("p-")) { toast("I profili demo sono di esempio"); return false; }
    const { data, error } = await supabase.from("connections").insert({
      requester_id: session.user.id,
      addressee_id: addresseeId,
      message: message.trim() || null,
    }).select().single();
    if (error || !data) {
      toast(error?.code === "23505" ? "Esiste già una richiesta con questa persona" : (error?.message ?? "Errore"));
      return false;
    }
    setConnections((prev) => [data as unknown as Connection, ...prev]);
    toast("Richiesta di collegamento inviata");
    return true;
  }, [session, toast]);

  const respondConnection = useCallback(async (id: string, accept: boolean) => {
    const status = accept ? "accepted" : "declined";
    const { error } = await supabase.from("connections").update({ status, responded_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast(error.message);
    setConnections((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    toast(accept ? "Collegamento accettato: ora vedete i rispettivi profili completi" : "Richiesta rifiutata");
  }, [toast]);

  const removeConnection = useCallback(async (id: string) => {
    const { error } = await supabase.from("connections").delete().eq("id", id);
    if (error) return toast(error.message);
    setConnections((prev) => prev.filter((c) => c.id !== id));
    toast("Collegamento rimosso");
  }, [toast]);

  const fetchProfileDetail = useCallback(async (id: string): Promise<Profile | null> => {
    const demo = DEMO_PROFILES_MAP.get(id);
    if (demo) return { ...demo, is_full: false };
    if (!isSupabaseConfigured) return null;
    const { data } = await supabase.rpc("get_profile_detail", { profile_id: id });
    const row = Array.isArray(data) ? data[0] : data;
    return row ? profileFromRow(row as Record<string, unknown>) : null;
  }, []);

  const toggleStar = useCallback((projectId: string) => {
    const demo = isDemoProject(projectId);
    if (!session?.user) {
      if (demo) {
        setLocalStarIds((prev) => prev.includes(projectId) ? prev.filter((x) => x !== projectId) : [...prev, projectId]);
      } else {
        toast("Accedi per lasciare una stella");
      }
      return;
    }
    if (demo) {
      setLocalStarIds((prev) => prev.includes(projectId) ? prev.filter((x) => x !== projectId) : [...prev, projectId]);
      return;
    }
    const has = starredIds.includes(projectId);
    setStarredIds((prev) => has ? prev.filter((x) => x !== projectId) : [...prev, projectId]);
    setDbProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, stars_count: Math.max(0, p.stars_count + (has ? -1 : 1)) } : p));
    (async () => {
      if (has) await supabase.from("project_stars").delete().eq("project_id", projectId).eq("user_id", session.user!.id);
      else await supabase.from("project_stars").insert({ project_id: projectId, user_id: session.user!.id });
    })();
  }, [session, starredIds, isDemoProject, toast]);

  const addComment = useCallback(async (projectId: string, content: string) => {
    if (!session?.user) return toast("Accedi per commentare");
    if (isDemoProject(projectId)) return toast("I progetti demo sono di esempio");
    const { data, error } = await supabase.from("project_comments").insert({
      project_id: projectId,
      author_id: session.user.id,
      content,
    }).select().single();
    if (error || !data) return toast(error?.message ?? "Errore");
    setComments((prev) => [...prev, data as unknown as ProjectComment]);
  }, [session, isDemoProject, toast]);

  const addApplication = useCallback(async (projectId: string, targetRole: string, message: string, contact: { email: string; phone: string; consent: boolean }, roleId?: string) => {
    if (!session?.user) { toast("Accedi per candidarti"); return false; }
    if (isDemoProject(projectId)) { toast("Non puoi candidarti su un progetto demo"); return false; }
    const { data, error } = await supabase.from("applications").insert({
      project_id: projectId,
      applicant_id: session.user.id,
      role_id: roleId || null,
      target_role: targetRole,
      message,
      contact_email: contact.email.trim() || null,
      contact_phone: contact.phone.trim() || null,
      contact_consent: contact.consent,
    }).select().single();
    if (error || !data) {
      if (error?.code === "23505") toast("Ti sei già candidato per questo ruolo");
      else toast(error?.message ?? "Errore");
      return false;
    }
    setApplications((prev) => [...prev, data as unknown as Application]);
    toast("Candidatura inviata");
    return true;
  }, [session, isDemoProject, toast]);

  const updateApplicationStatus = useCallback(async (applicationId: string, status: ApplicationStatus) => {
    // Se status è accepted o mutual_match, impostiamo mutual_match per sbloccare la chat e la celebrazione
    const finalStatus = status === "accepted" ? "mutual_match" : status;
    const { error } = await supabase.from("applications").update({ status: finalStatus, updated_at: new Date().toISOString() }).eq("id", applicationId);
    if (error) return toast(error.message);
    setApplications((prev) => prev.map((application) => application.id === applicationId ? { ...application, status: finalStatus } : application));
    toast(finalStatus === "mutual_match" ? "Candidatura accettata! È un match 🔥" : "Stato candidatura aggiornato");
  }, [toast]);

  const createFounderResource = useCallback(async (resource: Omit<FounderResource, "id" | "created_at" | "updated_at">) => {
    const { data, error } = await supabase.from("founder_resources").insert({ ...resource, created_by: session?.user.id }).select().single();
    if (error || !data) { toast(error?.message ?? "Impossibile salvare la risorsa"); return false; }
    setFounderResources((prev) => [...prev, data as unknown as FounderResource].sort((a, b) => a.sort_order - b.sort_order));
    toast("Risorsa salvata");
    return true;
  }, [session, toast]);

  const updateFounderResource = useCallback(async (id: string, patch: Partial<Omit<FounderResource, "id" | "created_at" | "updated_at">>) => {
    const { error } = await supabase.from("founder_resources").update(patch).eq("id", id);
    if (error) { toast(error.message); return false; }
    setFounderResources((prev) => prev.map((resource) => resource.id === id ? { ...resource, ...patch } : resource));
    toast("Risorsa aggiornata");
    return true;
  }, [toast]);

  const submitFounderRequest = useCallback(async (request: Pick<FounderRequest, "project_id" | "subject" | "message" | "contact_email" | "contact_phone" | "contact_consent">) => {
    if (!session?.user) { toast("Accedi per inviare una richiesta"); return false; }
    const { data, error } = await supabase.from("founder_requests").insert({ ...request, user_id: session.user.id }).select().single();
    if (error || !data) { toast(error?.message ?? "Impossibile inviare la richiesta"); return false; }
    setFounderRequests((prev) => [data as unknown as FounderRequest, ...prev]);
    toast("Richiesta inviata: ti ricontatteremo");
    return true;
  }, [session, toast]);

  const updateFounderRequest = useCallback(async (id: string, patch: Pick<FounderRequest, "status" | "admin_notes">) => {
    const { error } = await supabase.from("founder_requests").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast(error.message); return false; }
    setFounderRequests((prev) => prev.map((request) => request.id === id ? { ...request, ...patch } : request));
    toast("Richiesta aggiornata");
    return true;
  }, [toast]);

  const deleteProfileAdmin = useCallback(async (profileId: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", profileId);
    if (error) return toast(error.message);
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    setDbProjects((prev) => prev.filter((p) => p.owner_id !== profileId));
    toast("Account (dati) eliminato. Per cancellare del tutto l'utente auth, vedi schema.sql");
  }, [toast]);

  /* ---- selectors ---- */
  const profileById = useCallback((id: string) => {
    const db = profiles.find((p) => p.id === id);
    if (db) return db;
    return DEMO_PROFILES_MAP.get(id);
  }, [profiles]);

  const projectById = useCallback((id: string) => projects.find((p) => p.id === id), [projects]);

  const hasStarred = useCallback((id: string) => starredIds.includes(id) || localStarIds.includes(id), [starredIds, localStarIds]);

  const starCount = useCallback((p: Project) => {
    if (isDemoProject(p.id)) return p.stars_count + (localStarIds.includes(p.id) ? 1 : 0);
    return p.stars_count;
  }, [isDemoProject, localStarIds]);

  const commentsFor = useCallback((id: string) => {
    if (isDemoProject(id)) return (SHOW_SEED ? SEED_COMMENTS : []).filter((c) => c.project_id === id).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    return comments.filter((c) => c.project_id === id).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  }, [comments, isDemoProject]);

  const applicationsFor = useCallback((id: string) => applications.filter((a) => a.project_id === id), [applications]);
  const myApplication = useCallback((id: string) => applications.find((a) => a.project_id === id && a.applicant_id === session?.user?.id), [applications, session]);

  const value = useMemo<Store>(() => ({
    authReady, hydrated, session, user, isAdmin, profiles, builders, projects, roles, connections, comments, applications, messages, unreadMessagesCount, founderResources, founderRequests, canAccessFounder,
    signInOAuth, signInOtp, signInWithEmail, signUpWithEmail, signOut, updateProfile, setAvailability,
    addProject, updateProject, deleteProject,
    rolesFor, createRole, updateRole, setRoleOpen, deleteRole,
    connectionWith, requestConnection, respondConnection, removeConnection, fetchProfileDetail,
    toggleStar, addComment, addApplication, updateApplicationStatus, sendMessage, markMessagesAsRead,
    createFounderResource, updateFounderResource, submitFounderRequest, updateFounderRequest,
    deleteProfileAdmin,
    hasStarred, starCount, commentsFor, applicationsFor, myApplication,
    profileById, projectById, isDemoProject, toast,
  }), [authReady, hydrated, session, user, isAdmin, profiles, builders, projects, roles, connections, comments, applications, messages, unreadMessagesCount, founderResources, founderRequests, canAccessFounder,
    signInOAuth, signInOtp, signInWithEmail, signUpWithEmail, signOut, updateProfile, setAvailability,
    addProject, updateProject, deleteProject,
    rolesFor, createRole, updateRole, setRoleOpen, deleteRole,
    connectionWith, requestConnection, respondConnection, removeConnection, fetchProfileDetail,
    toggleStar, addComment, addApplication, updateApplicationStatus, sendMessage, markMessagesAsRead,
    createFounderResource, updateFounderResource, submitFounderRequest, updateFounderRequest, deleteProfileAdmin,
    hasStarred, starCount, commentsFor, applicationsFor, myApplication,
    profileById, projectById, isDemoProject, toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-8">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl dark:bg-white dark:text-zinc-900"
            >
              <CheckCircle2 className="h-4 w-4 text-brand-500 dark:text-brand-600" />
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore deve essere usato dentro <AppProvider>");
  return ctx;
}
