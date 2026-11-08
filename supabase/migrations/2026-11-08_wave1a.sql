-- ============================================================
-- Wave 1A — migrazione (idempotente, sicura da rieseguire)
--   SPARK-7: projects.updated_at (indicatore di attività)
--   SPARK-9: get_builder_profiles() (tab "Persone" in /esplora)
-- Esegui nel SQL Editor di Supabase. Le stesse istruzioni sono
-- incluse in supabase/schema.sql.
-- ============================================================

-- 1) projects.updated_at ------------------------------------
alter table public.projects add column if not exists updated_at timestamptz;
-- Backfill: i progetti esistenti partono dalla data di creazione
update public.projects set updated_at = created_at where updated_at is null;
alter table public.projects alter column updated_at set default now();
alter table public.projects alter column updated_at set not null;

create index if not exists projects_updated_at_idx on public.projects (updated_at desc);

-- Aggiorna updated_at SOLO quando cambiano i campi di contenuto del progetto.
-- La clausola "of ..." esclude stars_count (modificato dal trigger delle stelle);
-- commenti e candidature vivono in altre tabelle e non lo toccano.
create or replace function public.touch_project_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update of title, short_pitch, readme_markdown, open_roles, tags, location, link, stage, is_active, theme
  on public.projects
  for each row execute function public.touch_project_updated_at();

-- 2) Elenco builder per la tab "Persone" --------------------
-- Solo utenti autenticati; espone esclusivamente campi di profilo pubblico
-- (niente is_admin, niente contatti).
create or replace function public.get_builder_profiles()
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  role_badge text,
  role_custom text,
  skills text[],
  bio text,
  availability text,
  university text,
  profile_color text,
  created_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.full_name, p.avatar_url, p.role_badge, p.role_custom, p.skills,
         p.bio, p.availability, p.university, p.profile_color, p.created_at
  from public.profiles p
  where auth.uid() is not null
  order by p.created_at desc;
$$;

revoke all on function public.get_builder_profiles() from public, anon;
grant execute on function public.get_builder_profiles() to authenticated;
