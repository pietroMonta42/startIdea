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
  role_badge text not null check (role_badge in ('tech_dev', 'design', 'marketing', 'business', 'other')),
  role_custom text,
  skills text[] not null default '{}',
  bio text,
  availability text not null default 'available' check (availability in ('available', 'busy', 'consulting')),
  university text,
  profile_color text not null default '#f97316',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Aggiunge la colonna anche se la tabella esiste già (idempotente)
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists university text;
alter table public.profiles add column if not exists role_custom text;
alter table public.profiles add column if not exists profile_color text not null default '#f97316';
alter table public.profiles drop constraint if exists profiles_role_badge_check;
alter table public.profiles add constraint profiles_role_badge_check check (role_badge in ('tech_dev', 'design', 'marketing', 'business', 'other'));

-- Crea automaticamente il profilo alla registrazione
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role_badge, role_custom, university)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role_badge', 'tech_dev'),
    new.raw_user_meta_data ->> 'role_custom',
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
  link text,
  stage text not null default 'idea' check (stage in ('idea', 'launch')),
  is_active boolean not null default true,
  theme integer not null default 0,
  stars_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists projects_created_at_idx on public.projects (created_at desc);
create index if not exists projects_stars_idx on public.projects (stars_count desc);

-- Aggiunge la colonna theme anche se la tabella esiste già (vecchio schema)
alter table public.projects add column if not exists theme integer not null default 0;
alter table public.projects add column if not exists link text;
alter table public.projects add column if not exists stage text not null default 'idea';
alter table public.projects add column if not exists is_active boolean not null default true;
alter table public.projects drop constraint if exists projects_stage_check;
alter table public.projects add constraint projects_stage_check check (stage in ('idea', 'launch'));

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
  contact_email text,
  contact_phone text,
  contact_consent boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (project_id, applicant_id, target_role)
);

alter table public.applications add column if not exists contact_email text;
alter table public.applications add column if not exists contact_phone text;
alter table public.applications add column if not exists contact_consent boolean not null default false;
alter table public.applications add column if not exists updated_at timestamptz not null default now();

create or replace function public.validate_application_contact()
returns trigger
language plpgsql set search_path = public
as $$
begin
  if new.contact_consent is not true
     or (nullif(trim(new.contact_email), '') is null and nullif(trim(new.contact_phone), '') is null) then
    raise exception 'Inserisci almeno un recapito e conferma il consenso alla condivisione.';
  end if;
  return new;
end;
$$;

drop trigger if exists applications_require_contact on public.applications;
create trigger applications_require_contact
  before insert on public.applications
  for each row execute function public.validate_application_contact();

-- Risorse selezionate per aiutare chi sta avviando un progetto.
create table if not exists public.founder_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null,
  url text not null,
  is_recommended boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.founder_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  subject text not null,
  message text not null,
  contact_email text,
  contact_phone text,
  contact_consent boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'answered', 'closed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (nullif(trim(contact_email), '') is not null or nullif(trim(contact_phone), '') is not null),
  check (contact_consent)
);

insert into public.founder_resources (title, description, category, url, is_recommended, is_published, sort_order)
select seed.title, seed.description, seed.category, seed.url, true, true, seed.sort_order
from (values
  ('Lean Canvas', 'Una pagina per mettere a fuoco problema, soluzione, clienti e ipotesi da verificare.', 'Validazione', 'https://leanstack.com/lean-canvas', 1),
  ('Figma', 'Progetta schermate e prototipi interattivi prima di scrivere codice.', 'Design', 'https://www.figma.com/', 2),
  ('GitHub', 'Conserva il codice, collabora con il team e tieni traccia delle attività.', 'Sviluppo', 'https://github.com/', 3),
  ('Supabase', 'Database, autenticazione e archiviazione per applicazioni web e mobile.', 'Sviluppo', 'https://supabase.com/', 4),
  ('Vercel', 'Pubblica applicazioni web e anteprime di sviluppo con flussi semplici.', 'Pubblicazione', 'https://vercel.com/', 5)
) as seed(title, description, category, url, sort_order)
where not exists (select 1 from public.founder_resources existing where existing.url = seed.url);

-- Restituisce solo il ruolo dell'utente corrente; gli anonimi ottengono sempre false.
create or replace function public.is_current_user_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- Profilo sintetico solo per persone collegate a contenuti pubblici o al progetto dell'utente.
create or replace function public.get_public_profiles(profile_ids uuid[])
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  role_badge text,
  role_custom text,
  university text,
  profile_color text
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.full_name, p.avatar_url, p.role_badge, p.role_custom, p.university, p.profile_color
  from public.profiles p
  where p.id = any(coalesce(profile_ids, '{}'::uuid[]))
    and (
      p.id = auth.uid()
      or exists (select 1 from public.projects pr where pr.owner_id = p.id and pr.is_active)
      or exists (
        select 1
        from public.project_comments c
        join public.projects pr on pr.id = c.project_id
        where c.author_id = p.id and pr.is_active
      )
      or exists (
        select 1
        from public.applications a
        join public.projects pr on pr.id = a.project_id
        where a.applicant_id = p.id and pr.owner_id = auth.uid()
      )
      or public.is_current_user_admin()
    );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_stars enable row level security;
alter table public.project_comments enable row level security;
alter table public.applications enable row level security;
alter table public.founder_resources enable row level security;
alter table public.founder_requests enable row level security;
grant select, insert, update, delete on public.founder_resources to authenticated;
grant select, insert, update on public.founder_requests to authenticated;
revoke all on public.founder_resources, public.founder_requests from anon;

-- PROFILES: tabella privata (proprio profilo o admin); i profili pubblici passano dal lookup sintetico.
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_admin_select" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
revoke select on public.profiles from public, anon;
grant select on public.profiles to authenticated;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_admin_select" on public.profiles for select using (public.is_current_user_admin());
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- PROJECTS: tutti leggono, CRUD solo owner
drop policy if exists "projects_select_all" on public.projects;
drop policy if exists "projects_insert_auth" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_select_all" on public.projects for select
  using (is_active or auth.uid() = owner_id);
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

-- COMMENTS: leggibili per progetti attivi e proprietario; scrivi/elimini solo i tuoi.
drop policy if exists "comments_select_all" on public.project_comments;
drop policy if exists "comments_insert_auth" on public.project_comments;
drop policy if exists "comments_delete_own" on public.project_comments;
create policy "comments_select_all" on public.project_comments for select
  using (
    auth.uid() = author_id
    or exists (select 1 from public.projects p where p.id = project_id and p.is_active)
    or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );
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
  with check (
    auth.uid() = applicant_id
    and exists (select 1 from public.projects p where p.id = project_id and p.is_active and p.owner_id <> auth.uid())
  );
create policy "applications_update_owner" on public.applications for update
  using (auth.uid() = (select owner_id from public.projects where id = project_id))
  with check (auth.uid() = (select owner_id from public.projects where id = project_id));

-- Solo il campo stato è aggiornabile dai client autenticati per le candidature.
revoke update on public.applications from authenticated;
grant update (status, updated_at) on public.applications to authenticated;

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

create or replace function public.protect_admin_flag()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin
     and auth.uid() is not null
     and not public.is_current_user_admin() then
    raise exception 'Solo un amministratore può modificare il ruolo amministratore.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_admin_flag on public.profiles;
create trigger profiles_protect_admin_flag
  before update of is_admin on public.profiles
  for each row execute function public.protect_admin_flag();

drop policy if exists "projects_admin_select" on public.projects;
create policy "projects_admin_select" on public.projects for select
  using (public.is_current_user_admin());

-- Risorse: visibili agli admin e agli utenti con almeno un progetto attivo.
drop policy if exists "founder_resources_select_eligible" on public.founder_resources;
create policy "founder_resources_select_eligible" on public.founder_resources for select
  using (
    public.is_current_user_admin()
    or (
      auth.uid() is not null
      and is_published
      and exists (select 1 from public.projects p where p.owner_id = auth.uid() and p.is_active)
    )
  );
drop policy if exists "founder_resources_admin_manage" on public.founder_resources;
create policy "founder_resources_admin_manage" on public.founder_resources for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- Richieste: proprietario e amministratori possono leggerle; solo admin può aggiornarle.
drop policy if exists "founder_requests_select_involved" on public.founder_requests;
create policy "founder_requests_select_involved" on public.founder_requests for select
  using (auth.uid() = user_id or public.is_current_user_admin());
drop policy if exists "founder_requests_insert_owner" on public.founder_requests;
create policy "founder_requests_insert_owner" on public.founder_requests for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid() and p.is_active)
  );
drop policy if exists "founder_requests_admin_update" on public.founder_requests;
create policy "founder_requests_admin_update" on public.founder_requests for update
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- Profili: admin può leggere/modificare/eliminare qualsiasi profilo
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles for update
  using (public.is_current_user_admin());

drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete" on public.profiles for delete
  using (public.is_current_user_admin());

-- Progetti: admin può eliminare qualsiasi progetto
drop policy if exists "projects_admin_delete" on public.projects;
create policy "projects_admin_delete" on public.projects for delete
  using (public.is_current_user_admin());

-- Commenti: admin può eliminare qualsiasi commento (moderazione)
drop policy if exists "comments_admin_delete" on public.project_comments;
create policy "comments_admin_delete" on public.project_comments for delete
  using (public.is_current_user_admin());

-- ============================================================
-- SECURITY HARDENING (Supabase security advisor)
-- Le funzioni trigger non devono essere chiamabili via REST RPC.
-- NB: i trigger continuano a funzionare (girano con i privilegi
-- del proprietario, il check EXECUTE avviene alla creazione).
-- ============================================================

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_stars_count() from public, anon, authenticated;
revoke execute on function public.validate_application_contact() from public, anon, authenticated;
revoke execute on function public.protect_admin_flag() from public, anon, authenticated;

-- The parameterized legacy helper is not exposed; RLS uses the no-argument
-- current-user helper, which safely returns false for anonymous visitors.
revoke execute on function public.is_admin(uuid) from public, anon, authenticated;
revoke execute on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to anon, authenticated;
revoke execute on function public.get_public_profiles(uuid[]) from public;
grant execute on function public.get_public_profiles(uuid[]) to anon, authenticated;

-- ============================================================
-- WAVE 1A (vedi supabase/migrations/2026-11-08_wave1a.sql)
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

-- ============================================================
-- WAVE 1B (vedi supabase/migrations/2026-11-08_wave1b.sql)
-- ============================================================
-- 1) PROFILES: nuovi campi (tutti opzionali) ------------------
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists interests text[] not null default '{}';
alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists portfolio_url text;
alter table public.profiles add column if not exists looking_for text[] not null default '{}';

-- Bio breve: max 160 caratteri (tronca eventuali bio più lunghe prima del vincolo)
update public.profiles set bio = left(bio, 160) where bio is not null and char_length(bio) > 160;
alter table public.profiles drop constraint if exists profiles_bio_len_check;
alter table public.profiles add constraint profiles_bio_len_check check (bio is null or char_length(bio) <= 160);

alter table public.profiles drop constraint if exists profiles_linkedin_url_check;
alter table public.profiles add constraint profiles_linkedin_url_check
  check (linkedin_url is null or (linkedin_url ~* '^https?://[^[:space:]]+$' and char_length(linkedin_url) <= 200));
alter table public.profiles drop constraint if exists profiles_portfolio_url_check;
alter table public.profiles add constraint profiles_portfolio_url_check
  check (portfolio_url is null or (portfolio_url ~* '^https?://[^[:space:]]+$' and char_length(portfolio_url) <= 200));

alter table public.profiles drop constraint if exists profiles_looking_for_check;
alter table public.profiles add constraint profiles_looking_for_check
  check (looking_for <@ array['cofounder', 'side_project', 'collaborator', 'internship', 'exploring']::text[]);

-- Availability: nuovi valori (vecchi: available → h5_10, busy → exploring, consulting → h1_5)
alter table public.profiles drop constraint if exists profiles_availability_check;
update public.profiles
set availability = case availability
  when 'available' then 'h5_10'
  when 'busy' then 'exploring'
  when 'consulting' then 'h1_5'
  else availability
end
where availability in ('available', 'busy', 'consulting');
alter table public.profiles alter column availability set default 'exploring';
alter table public.profiles add constraint profiles_availability_check
  check (availability in ('exploring', 'h1_5', 'h5_10', 'h10_20', 'full'));

-- 2) CONNECTIONS: richieste di collegamento tra persone --------
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  message text check (message is null or char_length(message) <= 280),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);
-- Una sola relazione per coppia, indipendentemente dalla direzione
create unique index if not exists connections_pair_idx
  on public.connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists connections_addressee_idx on public.connections (addressee_id, status);

alter table public.connections enable row level security;
revoke all on public.connections from anon;
revoke update on public.connections from authenticated;
grant update (status, responded_at) on public.connections to authenticated;

drop policy if exists "connections_select_party" on public.connections;
drop policy if exists "connections_insert_requester" on public.connections;
drop policy if exists "connections_update_addressee" on public.connections;
drop policy if exists "connections_delete_party" on public.connections;
create policy "connections_select_party" on public.connections for select
  using (auth.uid() in (requester_id, addressee_id) or public.is_current_user_admin());
create policy "connections_insert_requester" on public.connections for insert
  with check (auth.uid() = requester_id and status = 'pending');
create policy "connections_update_addressee" on public.connections for update
  using (auth.uid() = addressee_id) with check (auth.uid() = addressee_id);
create policy "connections_delete_party" on public.connections for delete
  using (auth.uid() in (requester_id, addressee_id));

-- 3) Privacy: chi può vedere il profilo completo ---------------
-- Vero se: stesso utente, collegamento accettato, oppure stesso team
-- (founder ↔ candidato accettato, o due candidati accettati dello stesso progetto).
create or replace function public.are_profiles_connected(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select a is not null and b is not null and (
    a = b
    or exists (
      select 1 from public.connections c
      where c.status = 'accepted'
        and ((c.requester_id = a and c.addressee_id = b) or (c.requester_id = b and c.addressee_id = a))
    )
    or exists (
      select 1 from public.applications ap
      join public.projects pr on pr.id = ap.project_id
      where ap.status = 'accepted'
        and ((pr.owner_id = a and ap.applicant_id = b) or (pr.owner_id = b and ap.applicant_id = a))
    )
    or exists (
      select 1 from public.applications x
      join public.applications y on y.project_id = x.project_id
      where x.status = 'accepted' and y.status = 'accepted'
        and x.applicant_id = a and y.applicant_id = b
    )
  );
$$;

-- Elenco builder: SOLO campi minimali, visibile anche ai non loggati.
drop function if exists public.get_builder_profiles();
create function public.get_builder_profiles()
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  role_badge text,
  role_custom text,
  skills text[],
  bio text,
  availability text,
  looking_for text[],
  university text,
  city text,
  profile_color text,
  created_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.full_name, p.avatar_url, p.role_badge, p.role_custom, p.skills,
         p.bio, p.availability, p.looking_for, p.university, p.city, p.profile_color, p.created_at
  from public.profiles p
  order by p.created_at desc;
$$;

-- Dettaglio profilo: minimale per tutti; interessi e link solo se is_full.
-- Email e telefono NON fanno parte del profilo: si condividono solo con il
-- consenso esplicito nelle candidature.
drop function if exists public.get_profile_detail(uuid);
create function public.get_profile_detail(profile_id uuid)
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  role_badge text,
  role_custom text,
  skills text[],
  bio text,
  availability text,
  looking_for text[],
  university text,
  city text,
  profile_color text,
  created_at timestamptz,
  interests text[],
  linkedin_url text,
  portfolio_url text,
  is_full boolean
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.full_name, p.avatar_url, p.role_badge, p.role_custom, p.skills,
         p.bio, p.availability, p.looking_for, p.university, p.city, p.profile_color, p.created_at,
         case when f.ok then p.interests else '{}'::text[] end,
         case when f.ok then p.linkedin_url end,
         case when f.ok then p.portfolio_url end,
         f.ok
  from public.profiles p
  cross join lateral (
    select auth.uid() is not null
      and (public.are_profiles_connected(auth.uid(), p.id) or public.is_current_user_admin()) as ok
  ) f
  where p.id = profile_id;
$$;

revoke all on function public.are_profiles_connected(uuid, uuid) from public, anon, authenticated;
revoke all on function public.get_builder_profiles() from public;
revoke all on function public.get_profile_detail(uuid) from public;
grant execute on function public.get_builder_profiles() to anon, authenticated;
grant execute on function public.get_profile_detail(uuid) to anon, authenticated;

-- 4) PROJECTS: campi testo semplice (niente Markdown) ----------
alter table public.projects add column if not exists problem text not null default '';
alter table public.projects add column if not exists solution text not null default '';
alter table public.projects add column if not exists progress text not null default '';
alter table public.projects add column if not exists university text;
alter table public.projects drop constraint if exists projects_text_len_check;
alter table public.projects add constraint projects_text_len_check
  check (char_length(problem) <= 2000 and char_length(solution) <= 2000 and char_length(progress) <= 2000);

-- 5) PROJECT_ROLES: posizioni aperte strutturate (1 progetto → N ruoli)
create table if not exists public.project_roles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 60),
  skills text[] not null default '{}',
  hours_per_week integer check (hours_per_week is null or hours_per_week between 1 and 80),
  mode text not null default 'remote' check (mode in ('remote', 'onsite', 'hybrid')),
  city text,
  collab_type text not null default 'cofounder' check (collab_type in ('cofounder', 'equity', 'unpaid', 'paid')),
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists project_roles_project_idx on public.project_roles (project_id);

create or replace function public.touch_project_role_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists project_roles_touch_updated_at on public.project_roles;
create trigger project_roles_touch_updated_at
  before update on public.project_roles
  for each row execute function public.touch_project_role_updated_at();

-- Mantiene projects.open_roles (titoli dei ruoli aperti) allineato ai ruoli strutturati.
-- Il trigger di updated_at su projects scatta perché open_roles viene riscritto.
create or replace function public.sync_project_open_roles()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  pid uuid := coalesce(new.project_id, old.project_id);
begin
  update public.projects
  set open_roles = coalesce(
    (select array_agg(r.title order by r.created_at) from public.project_roles r where r.project_id = pid and r.is_open),
    '{}'::text[]
  )
  where id = pid;
  return coalesce(new, old);
end;
$$;
drop trigger if exists project_roles_sync_open_roles on public.project_roles;
create trigger project_roles_sync_open_roles
  after insert or update or delete on public.project_roles
  for each row execute function public.sync_project_open_roles();

alter table public.project_roles enable row level security;
revoke all on public.project_roles from anon;
grant select on public.project_roles to anon;
drop policy if exists "project_roles_select_all" on public.project_roles;
drop policy if exists "project_roles_insert_owner" on public.project_roles;
drop policy if exists "project_roles_update_owner" on public.project_roles;
drop policy if exists "project_roles_delete_owner" on public.project_roles;
create policy "project_roles_select_all" on public.project_roles for select using (true);
create policy "project_roles_insert_owner" on public.project_roles for insert
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "project_roles_update_owner" on public.project_roles for update
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "project_roles_delete_owner" on public.project_roles for delete
  using (exists (select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_current_user_admin())));

revoke execute on function public.sync_project_open_roles() from public, anon, authenticated;

-- Backfill: ogni voce di open_roles diventa un ruolo strutturato (solo per progetti senza ruoli).
-- Il trigger di updated_at viene disattivato per non alterare la data di ultimo aggiornamento.
alter table public.projects disable trigger projects_touch_updated_at;
insert into public.project_roles (project_id, title)
select pr.id, trim(r)
from public.projects pr
cross join lateral unnest(pr.open_roles) as r
where char_length(trim(r)) between 2 and 60
  and not exists (select 1 from public.project_roles x where x.project_id = pr.id);
alter table public.projects enable trigger projects_touch_updated_at;

-- ============================================================
-- WAVE 2 (vedi supabase/migrations/2026-11-08_wave2.sql)
-- ============================================================
-- ============================================================
-- Wave 2 — Candidature avanzate, Mutual Match & Messaggi 1:1
-- Esegui nel SQL Editor di Supabase
-- ============================================================

-- 1) Aggiornamento stati tabella applications
-- Supporto a 'mutual_match'
alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in ('pending', 'accepted', 'rejected', 'mutual_match'));

-- Aggiunta colonna opzionale role_id
alter table public.applications add column if not exists role_id uuid references public.project_roles(id) on delete set null;

-- 2) Tabella MESSAGES (Chat 1:1 post-match / team)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0 and char_length(content) <= 3000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_sender_recipient_idx on public.messages (sender_id, recipient_id, created_at);
create index if not exists messages_recipient_unread_idx on public.messages (recipient_id, read_at);

alter table public.messages enable row level security;
revoke all on public.messages from anon;
grant select, insert, update (read_at) on public.messages to authenticated;

drop policy if exists "messages_select_parties" on public.messages;
drop policy if exists "messages_insert_sender" on public.messages;
drop policy if exists "messages_update_recipient" on public.messages;

-- Possono leggere solo mittente, destinatario o admin
create policy "messages_select_parties" on public.messages for select
  using (auth.uid() in (sender_id, recipient_id) or public.is_current_user_admin());

-- Può inserire solo chi manda il messaggio e se c'è un collegamento o mutual match
create policy "messages_insert_sender" on public.messages for insert
  with check (auth.uid() = sender_id);

-- Solo il destinatario può marcare come letto
create policy "messages_update_recipient" on public.messages for update
  using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- 3) Mutual match trigger helper: un'application accettata sblocca la visibilità e la connessione
create or replace function public.on_application_status_changed()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'accepted' then
    new.status := 'mutual_match';
  end if;
  return new;
end;
$$;

drop trigger if exists application_auto_mutual_match on public.applications;
create trigger application_auto_mutual_match
  before update of status on public.applications
  for each row execute function public.on_application_status_changed();
