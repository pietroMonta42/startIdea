"use client";

import Link from "next/link";
import { Archive, ArrowUpRight, BriefcaseBusiness, ExternalLink, FolderKanban, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { Application, Project } from "@/lib/types";
import { Badge, Button, FeedSkeleton } from "@/components/ui";

function statusLabel(status: Application["status"]) {
  if (status === "accepted") return "Accettata";
  if (status === "rejected") return "Rifiutata";
  return "In attesa";
}

export default function ProjectsManagementPage() {
  const { authReady, user, projects, applications, profiles, updateProject, updateApplicationStatus } = useStore();
  if (!authReady || !user) return <FeedSkeleton />;

  const mine = projects.filter((project) => project.owner_id === user.id);
  const receivedByProject = new Map<string, Application[]>();
  for (const application of applications) {
    const list = receivedByProject.get(application.project_id) ?? [];
    list.push(application);
    receivedByProject.set(application.project_id, list);
  }

  const setStage = (project: Project, stage: "idea" | "launch") => updateProject(project.id, { stage });
  const toggleArchive = (project: Project) => updateProject(project.id, { is_active: project.is_active === false });

  return (
    <div className="flex flex-col gap-6">
      <header className="pt-2">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-500">Area Founder</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">I tuoi progetti</h1>
        <p className="mt-2 text-sm text-muted">Aggiorna la fase, archivia le idee e gestisci qui le candidature ricevute.</p>
      </header>

      {mine.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line py-14 text-center">
          <FolderKanban className="h-9 w-9 text-brand-500" />
          <h2 className="font-display font-bold text-ink">Nessun progetto pubblicato</h2>
          <p className="max-w-xs text-sm text-muted">Pubblica un’idea per gestirla e ricevere candidature.</p>
          <Link href="/nuovo"><Button>Pubblica un progetto</Button></Link>
        </div>
      ) : mine.map((project) => {
        const applicationsForProject = receivedByProject.get(project.id) ?? [];
        return (
          <section key={project.id} className="overflow-hidden rounded-3xl border border-line bg-surface">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-ink">{project.title}</h2>
                  <Badge className={project.is_active === false ? "bg-line text-muted" : "bg-brand-500/10 text-brand-600 dark:text-brand-400"}>{project.is_active === false ? "Archiviato" : "Attivo"}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{project.short_pitch}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="text-xs font-semibold text-muted" htmlFor={`stage-${project.id}`}>Fase</label>
                  <select id={`stage-${project.id}`} value={project.stage ?? "idea"} onChange={(event) => setStage(project, event.target.value as "idea" | "launch")} className="rounded-full border border-line bg-bg px-3 py-1.5 text-xs font-semibold text-ink">
                    <option value="idea">Idea</option>
                    <option value="launch">Lancio</option>
                  </select>
                  <span className="text-xs text-muted">{applicationsForProject.length} candidature</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Link href={`/progetto/${project.id}`}><Button variant="secondary" size="sm">Apri <ArrowUpRight className="h-3.5 w-3.5" /></Button></Link>
                {project.link && <a href={project.link} target="_blank" rel="noreferrer" aria-label="Apri il link del progetto" className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted hover:text-ink"><ExternalLink className="h-4 w-4" /></a>}
                <Button variant="ghost" size="sm" onClick={() => toggleArchive(project)}>{project.is_active === false ? <><RotateCcw className="h-3.5 w-3.5" /> Ripristina</> : <><Archive className="h-3.5 w-3.5" /> Archivia</>}</Button>
              </div>
            </div>

            <div className="border-t border-line bg-bg/50 p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-ink"><BriefcaseBusiness className="h-4 w-4 text-brand-500" /> Candidature ricevute</h3>
              {applicationsForProject.length === 0 ? <p className="mt-2 text-sm text-muted">Non hai ancora ricevuto candidature.</p> : (
                <div className="mt-3 flex flex-col gap-3">
                  {applicationsForProject.map((application) => (
                    <article key={application.id} className="rounded-2xl border border-line bg-surface p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-muted">{profiles.find((profile) => profile.id === application.applicant_id)?.full_name ?? "Candidato"}</p>
                          <p className="text-sm font-bold text-ink">{application.target_role}</p>
                          <Badge className="mt-1 bg-amber-500/10 text-amber-600 dark:text-amber-400">{statusLabel(application.status)}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" size="sm" onClick={() => updateApplicationStatus(application.id, "accepted")}>Accetta</Button>
                          <Button variant="ghost" size="sm" onClick={() => updateApplicationStatus(application.id, "rejected")}>Rifiuta</Button>
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">{application.message}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-xs font-semibold">
                        {application.contact_email && <a className="text-brand-600 underline dark:text-brand-400" href={`mailto:${application.contact_email}`}>{application.contact_email}</a>}
                        {application.contact_phone && <a className="text-brand-600 underline dark:text-brand-400" href={`tel:${application.contact_phone}`}>{application.contact_phone}</a>}
                        {!application.contact_email && !application.contact_phone && <span className="text-muted">Candidatura precedente senza recapiti</span>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
