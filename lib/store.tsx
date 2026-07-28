"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Application, Availability, Profile, Project, ProjectComment, RoleBadge } from "./types";
import { SEED_COMMENTS, SEED_PROFILES, SEED_PROJECTS } from "./data";
import { uid } from "./utils";

const LS_KEY = "startidea-store-v1";

interface PersistedState {
  userId: string | null;
  profiles: Profile[];
  projects: Project[];
  comments: ProjectComment[];
  applications: Application[];
  stars: string[];
  starDelta: Record<string, number>;
}

interface Store extends PersistedState {
  hydrated: boolean;
  user: Profile | null;
  login: (name: string, role: RoleBadge, university: string) => void;
  logout: () => void;
  toggleStar: (projectId: string) => void;
  addComment: (projectId: string, content: string) => void;
  addApplication: (projectId: string, targetRole: string, message: string) => void;
  addProject: (p: Omit<Project, "id" | "owner_id" | "stars_count" | "created_at">) => string;
  setAvailability: (a: Availability) => void;
  hasStarred: (projectId: string) => boolean;
  starCount: (p: Project) => number;
  commentsFor: (projectId: string) => ProjectComment[];
  applicationsFor: (projectId: string) => Application[];
  myApplication: (projectId: string) => Application | undefined;
  profileById: (id: string) => Profile | undefined;
  projectById: (id: string) => Project | undefined;
  toast: (msg: string) => void;
}

const Ctx = createContext<Store | null>(null);

const seedState: PersistedState = {
  userId: null,
  profiles: SEED_PROFILES,
  projects: SEED_PROJECTS,
  comments: SEED_COMMENTS,
  applications: [],
  stars: [],
  starDelta: {},
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(seedState);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; msg: string }[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        setState({
          userId: parsed.userId ?? null,
          profiles: parsed.profiles?.length ? parsed.profiles : SEED_PROFILES,
          projects: parsed.projects?.length ? parsed.projects : SEED_PROJECTS,
          comments: parsed.comments?.length ? parsed.comments : SEED_COMMENTS,
          applications: parsed.applications ?? [],
          stars: parsed.stars ?? [],
          starDelta: parsed.starDelta ?? {},
        });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const toast = useCallback((msg: string) => {
    const id = uid();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const login = useCallback((name: string, role: RoleBadge, university: string) => {
    const id = "p-" + uid();
    const profile: Profile = {
      id,
      full_name: name,
      avatar_url: null,
      role_badge: role,
      skills: [],
      bio: null,
      availability: "available",
      university,
      created_at: new Date().toISOString(),
    };
    setState((s) => ({ ...s, userId: id, profiles: [...s.profiles, profile] }));
  }, []);

  const logout = useCallback(() => setState((s) => ({ ...s, userId: null })), []);

  const toggleStar = useCallback((projectId: string) => {
    setState((s) => {
      const has = s.stars.includes(projectId);
      return {
        ...s,
        stars: has ? s.stars.filter((x) => x !== projectId) : [...s.stars, projectId],
        starDelta: {
          ...s.starDelta,
          [projectId]: (s.starDelta[projectId] ?? 0) + (has ? -1 : 1),
        },
      };
    });
  }, []);

  const addComment = useCallback((projectId: string, content: string) => {
    setState((s) => {
      if (!s.userId) return s;
      return {
        ...s,
        comments: [
          ...s.comments,
          { id: "c-" + uid(), project_id: projectId, author_id: s.userId, content, created_at: new Date().toISOString() },
        ],
      };
    });
  }, []);

  const addApplication = useCallback((projectId: string, targetRole: string, message: string) => {
    setState((s) => {
      if (!s.userId) return s;
      return {
        ...s,
        applications: [
          ...s.applications,
          {
            id: "a-" + uid(),
            project_id: projectId,
            applicant_id: s.userId,
            target_role: targetRole,
            message,
            status: "pending",
            created_at: new Date().toISOString(),
          },
        ],
      };
    });
  }, []);

  const addProject = useCallback(
    (p: Omit<Project, "id" | "owner_id" | "stars_count" | "created_at">) => {
      const id = "pr-" + uid();
      setState((s) => {
        if (!s.userId) return s;
        return {
          ...s,
          projects: [
            { ...p, id, owner_id: s.userId, stars_count: 0, created_at: new Date().toISOString() },
            ...s.projects,
          ],
        };
      });
      return id;
    },
    []
  );

  const setAvailability = useCallback((a: Availability) => {
    setState((s) => ({
      ...s,
      profiles: s.profiles.map((p) => (p.id === s.userId ? { ...p, availability: a } : p)),
    }));
  }, []);

  const value = useMemo<Store>(() => {
    const user = state.profiles.find((p) => p.id === state.userId) ?? null;
    return {
      ...state,
      hydrated,
      user,
      login,
      logout,
      toggleStar,
      addComment,
      addApplication,
      addProject,
      setAvailability,
      toast,
      hasStarred: (id) => state.stars.includes(id),
      starCount: (p) => Math.max(0, p.stars_count + (state.starDelta[p.id] ?? 0)),
      commentsFor: (id) =>
        state.comments
          .filter((c) => c.project_id === id)
          .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
      applicationsFor: (id) => state.applications.filter((a) => a.project_id === id),
      myApplication: (id) => state.applications.find((a) => a.project_id === id && a.applicant_id === state.userId),
      profileById: (id) => state.profiles.find((p) => p.id === id),
      projectById: (id) => state.projects.find((p) => p.id === id),
    };
  }, [state, hydrated, login, logout, toggleStar, addComment, addApplication, addProject, setAvailability, toast]);

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
