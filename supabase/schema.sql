-- ============================================================
-- SparkLab — Schema Supabase (PostgreSQL) + RLS Policies
-- Esegui nel SQL Editor di Supabase dopo aver creato il progetto.
-- ============================================================

-- Estensione per gen_random_uuid()
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PROFILES (legata a auth.users)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  avatar_url text,
  role_badge text not null check (role_badge in ('tech_dev', 'design', 'marketing', 'business')),
  skills text[] not null default '{}',
  bio text,
  availability text not null default 'available' check (availability in ('available', 'busy', 'consulting')),
  university text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Aggiunge la colonna anche se la tabella esiste già (idempotente)
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists university text;

-- Crea automaticamente il profilo alla registrazione
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role_badge, university)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role_badge', 'tech_dev'),
    new.raw_user_meta_data ->> 'university'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- PROJECTS
-- ------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  short_pitch text not null check (char_length(short_pitch) <= 140),
  readme_markdown text not null default '',
  open_roles text[] not null default '{}',
  tags text[] not null default '{}',
  location text not null default '',
  theme integer not null default 0,
  stars_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists projects_created_at_idx on public.projects (created_at desc);
create index if not exists projects_stars_idx on public.projects (stars_count desc);

-- Aggiunge la colonna theme anche se la tabella esiste già (vecchio schema)
alter table public.projects add column if not exists theme integer not null default 0;

-- ------------------------------------------------------------
-- PROJECT_STARS (PK composita)
-- ------------------------------------------------------------
create table if not exists public.project_stars (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- Mantiene stars_count sincronizzato
create or replace function public.sync_stars_count()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.projects set stars_count = stars_count + 1 where id = new.project_id;
  elsif tg_op = 'DELETE' then
    update public.projects set stars_count = greatest(0, stars_count - 1) where id = old.project_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists project_stars_sync on public.project_stars;
create trigger project_stars_sync
  after insert or delete on public.project_stars
  for each row execute function public.sync_stars_count();

-- ------------------------------------------------------------
-- PROJECT_COMMENTS (social, pubblici in lettura)
-- ------------------------------------------------------------
create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists project_comments_project_idx on public.project_comments (project_id, created_at);

-- ------------------------------------------------------------
-- APPLICATIONS (private: applicant + owner del progetto)
-- ------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  target_role text not null,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (project_id, applicant_id, target_role)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_stars enable row level security;
alter table public.project_comments enable row level security;
alter table public.applications enable row level security;

-- PROFILES: tutti leggono, modifichi solo il tuo
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- PROJECTS: tutti leggono, CRUD solo owner
drop policy if exists "projects_select_all" on public.projects;
drop policy if exists "projects_insert_auth" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_select_all" on public.projects for select using (true);
create policy "projects_insert_auth" on public.projects for insert with check (auth.uid() = owner_id);
create policy "projects_update_own" on public.projects for update using (auth.uid() = owner_id);
create policy "projects_delete_own" on public.projects for delete using (auth.uid() = owner_id);

-- STARS: lettura pubblica, insert/delete solo le proprie (da loggati)
drop policy if exists "stars_select_all" on public.project_stars;
drop policy if exists "stars_insert_own" on public.project_stars;
drop policy if exists "stars_delete_own" on public.project_stars;
create policy "stars_select_all" on public.project_stars for select using (true);
create policy "stars_insert_own" on public.project_stars for insert with check (auth.uid() = user_id);
create policy "stars_delete_own" on public.project_stars for delete using (auth.uid() = user_id);

-- COMMENTS: lettura pubblica, scrivi/elimini solo i tuoi (da loggati)
drop policy if exists "comments_select_all" on public.project_comments;
drop policy if exists "comments_insert_auth" on public.project_comments;
drop policy if exists "comments_delete_own" on public.project_comments;
create policy "comments_select_all" on public.project_comments for select using (true);
create policy "comments_insert_auth" on public.project_comments for insert with check (auth.uid() = author_id);
create policy "comments_delete_own" on public.project_comments for delete using (auth.uid() = author_id);

-- APPLICATIONS: visibili solo ad applicant e owner del progetto
drop policy if exists "applications_select_involved" on public.applications;
drop policy if exists "applications_insert_auth" on public.applications;
drop policy if exists "applications_update_owner" on public.applications;
create policy "applications_select_involved" on public.applications for select
  using (
    auth.uid() = applicant_id
    or auth.uid() = (select owner_id from public.projects where id = project_id)
  );
create policy "applications_insert_auth" on public.applications for insert
  with check (auth.uid() = applicant_id);
create policy "applications_update_owner" on public.applications for update
  using (auth.uid() = (select owner_id from public.projects where id = project_id));

-- ============================================================
-- ADMIN (ruolo is_admin sui profiles) — GDPR / privacy
-- Un admin può gestire (modificare/eliminare) qualsiasi progetto e profilo.
-- Per rendere un utente admin, esegui nel SQL Editor:
--   update public.profiles set is_admin = true where id = (
--     select id from auth.users where email = 'tuo@email.com'
--   );
-- ============================================================

create or replace function public.is_admin(uid uuid)
returns boolean
language sql security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

-- Profili: admin può leggere/modificare/eliminare qualsiasi profilo
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles for update
  using (public.is_admin(auth.uid()));

drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete" on public.profiles for delete
  using (public.is_admin(auth.uid()));

-- Progetti: admin può eliminare qualsiasi progetto
drop policy if exists "projects_admin_delete" on public.projects;
create policy "projects_admin_delete" on public.projects for delete
  using (public.is_admin(auth.uid()));

-- Commenti: admin può eliminare qualsiasi commento (moderazione)
drop policy if exists "comments_admin_delete" on public.project_comments;
create policy "comments_admin_delete" on public.project_comments for delete
  using (public.is_admin(auth.uid()));
