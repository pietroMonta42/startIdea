"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { Application, Availability, Profile, Project, ProjectComment, RoleBadge } from "./types";
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
  projects: Project[];
  comments: ProjectComment[];
  applications: Application[];
  // auth
  signInOAuth: (provider: "github" | "google") => Promise<void>;
  signInOtp: (email: string, meta: { full_name: string; role: RoleBadge; university: string }) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, meta: { full_name: string; role: RoleBadge; university: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  setAvailability: (a: Availability) => void;
  // projects
  addProject: (p: Omit<Project, "id" | "owner_id" | "stars_count" | "created_at">) => Promise<string | null>;
  updateProject: (id: string, patch: Partial<Pick<Project, "title" | "short_pitch" | "readme_markdown" | "open_roles" | "tags" | "location">>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  // social
  toggleStar: (projectId: string) => void;
  addComment: (projectId: string, content: string) => Promise<void>;
  addApplication: (projectId: string, targetRole: string, message: string) => Promise<void>;
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

const DEMO_PROFILES_MAP = new Map(SEED_PROFILES.map((p) => [p.id, p]));

function profileFromRow(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    full_name: row.full_name as string,
    avatar_url: (row.avatar_url as string | null) ?? null,
    role_badge: row.role_badge as RoleBadge,
    skills: (row.skills as string[]) ?? [],
    bio: (row.bio as string | null) ?? null,
    availability: row.availability as Availability,
    university: (row.university as string | undefined) ?? undefined,
    is_admin: (row.is_admin as boolean | undefined) ?? false,
    created_at: row.created_at as string,
  };
}

function projectFromRow(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    owner_id: row.owner_id as string,
    title: row.title as string,
    short_pitch: row.short_pitch as string,
    readme_markdown: row.readme_markdown as string,
    open_roles: (row.open_roles as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    location: (row.location as string) ?? "",
    stars_count: (row.stars_count as number) ?? 0,
    theme: typeof row.theme === "number" ? (row.theme as number) : undefined,
    created_at: row.created_at as string,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [dbProjects, setDbProjects] = useState<Project[]>([]);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [localStarIds, setLocalStarIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<{ id: string; msg: string }[]>([]);

  const projects = useMemo<Project[]>(() => [...SEED_PROJECTS, ...dbProjects], [dbProjects]);
  const isDemoProject = useCallback((id: string) => id.startsWith("pr-") && !dbProjects.some((p) => p.id === id), [dbProjects]);

  const toast = useCallback((msg: string) => {
    const id = uid();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  /* ---- loaders ---- */
  const loadPublic = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const [prof, proj, comm] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("project_comments").select("*").order("created_at", { ascending: true }),
    ]);
    if (prof.data) setProfiles(prof.data.map(profileFromRow));
    if (proj.data) setDbProjects(proj.data.map(projectFromRow));
    if (comm.data) setComments(comm.data as unknown as ProjectComment[]);
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
        university: meta.university ?? null,
      });
      ({ data: profRow } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle());
    }
    const prof = profRow ? profileFromRow(profRow) : null;
    setUser(prof);
    setIsAdmin(Boolean(prof?.is_admin));

    const [starRes, appsRes] = await Promise.all([
      supabase.from("project_stars").select("project_id").eq("user_id", u.id),
      supabase.from("applications").select("*").or(`applicant_id.eq.${u.id}`),
    ]);
    setStarredIds((starRes.data ?? []).map((r) => (r as Record<string, string>).project_id));
    setApplications(appsRes.data as unknown as Application[] ?? []);
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
      if (s?.user) loadUserData(s.user).finally(() => setHydrated(true));
      else {
        setUser(null);
        setStarredIds([]);
        setApplications([]);
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

  const signInOtp = useCallback(async (email: string, meta: { full_name: string; role: RoleBadge; university: string }) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/profilo`,
        data: { full_name: meta.full_name, role_badge: meta.role, university: meta.university },
      },
    });
    if (error) toast(error.message);
    else toast("Magic link inviato! Controlla la mail 📩");
  }, [toast]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast(error.message);
  }, [toast]);

  const signUpWithEmail = useCallback(async (email: string, password: string, meta: { full_name: string; role: RoleBadge; university: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/profilo`,
        data: { full_name: meta.full_name, role_badge: meta.role, university: meta.university },
      },
    });
    if (error) toast(error.message);
    else toast("Controlla la mail per confermare l'account ✉️");
  }, [toast]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setStarredIds([]);
    setApplications([]);
    setIsAdmin(false);
  }, []);

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

  const addProject = useCallback(async (p: Omit<Project, "id" | "owner_id" | "stars_count" | "created_at">) => {
    if (!session?.user) { toast("Accedi per pubblicare"); return null; }
    const { data, error } = await supabase.from("projects").insert({
      owner_id: session.user.id,
      title: p.title,
      short_pitch: p.short_pitch,
      readme_markdown: p.readme_markdown,
      open_roles: p.open_roles,
      tags: p.tags,
      location: p.location,
      theme: p.theme,
    }).select().single();
    if (error || !data) { toast(error?.message ?? "Errore"); return null; }
    setDbProjects((prev) => [projectFromRow(data), ...prev]);
    return data.id as string;
  }, [session, toast]);

  const updateProject = useCallback(async (id: string, patch: Partial<Pick<Project, "title" | "short_pitch" | "readme_markdown" | "open_roles" | "tags" | "location">>) => {
    const { error } = await supabase.from("projects").update(patch).eq("id", id);
    if (error) return toast(error.message);
    setDbProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    toast("Progetto aggiornato");
  }, [toast]);

  const deleteProject = useCallback(async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast(error.message);
    setDbProjects((prev) => prev.filter((p) => p.id !== id));
    setComments((prev) => prev.filter((c) => c.project_id !== id));
    toast("Progetto eliminato");
  }, [toast]);

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

  const addApplication = useCallback(async (projectId: string, targetRole: string, message: string) => {
    if (!session?.user) return toast("Accedi per candidarti");
    if (isDemoProject(projectId)) return toast("Non puoi candidarti su un progetto demo");
    const { data, error } = await supabase.from("applications").insert({
      project_id: projectId,
      applicant_id: session.user.id,
      target_role: targetRole,
      message,
    }).select().single();
    if (error || !data) {
      if (error?.code === "23505") return toast("Ti sei già candidato per questo ruolo");
      return toast(error?.message ?? "Errore");
    }
    setApplications((prev) => [...prev, data as unknown as Application]);
    toast("Candidatura inviata al founder");
  }, [session, isDemoProject, toast]);

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
    if (isDemoProject(id)) return SEED_COMMENTS.filter((c) => c.project_id === id).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    return comments.filter((c) => c.project_id === id).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  }, [comments, isDemoProject]);

  const applicationsFor = useCallback((id: string) => applications.filter((a) => a.project_id === id), [applications]);
  const myApplication = useCallback((id: string) => applications.find((a) => a.project_id === id && a.applicant_id === session?.user?.id), [applications, session]);

  const value = useMemo<Store>(() => ({
    authReady, hydrated, session, user, isAdmin, profiles, projects, comments, applications,
    signInOAuth, signInOtp, signInWithEmail, signUpWithEmail, signOut, updateProfile, setAvailability,
    addProject, updateProject, deleteProject,
    toggleStar, addComment, addApplication,
    deleteProfileAdmin,
    hasStarred, starCount, commentsFor, applicationsFor, myApplication,
    profileById, projectById, isDemoProject, toast,
  }), [authReady, hydrated, session, user, isAdmin, profiles, projects, comments, applications,
    signInOAuth, signInOtp, signInWithEmail, signUpWithEmail, signOut, updateProfile, setAvailability,
    addProject, updateProject, deleteProject,
    toggleStar, addComment, addApplication, deleteProfileAdmin,
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