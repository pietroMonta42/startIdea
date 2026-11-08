-- ============================================================
-- Wave 1B — migrazione (idempotente, sicura da rieseguire)
--   SPARK-1/2: campi profilo (città, interessi, link, looking_for, availability)
--   Privacy:   profilo pubblico minimale + profilo completo solo a team e collegati
--   SPARK-4:   tabella project_roles (ruoli aperti strutturati)
--   SPARK-5:   campi testo semplice del progetto (problema, soluzione, avanzamento, ateneo)
-- Esegui nel SQL Editor di Supabase (dopo la migrazione wave1a).
-- Le stesse istruzioni sono incluse in supabase/schema.sql.
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
