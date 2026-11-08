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
