-- ============================================================
-- SparkLab — RESET COMPLETO DB
-- ATTENZIONE: cancella tutti i dati. Usare solo per reset totale.
-- Dopo aver eseguito questo, esegui schema.sql per ricreare.
-- ============================================================

-- Disabilita RLS temporaneamente per evitare conflitti durante il drop
-- (non necessario, i DROP CASCADE gestiscono tutto)

-- Drop triggers
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists project_stars_sync on public.project_stars;

-- Drop functions
drop function if exists public.handle_new_user() cascade;
drop function if exists public.sync_stars_count() cascade;
drop function if exists public.is_admin(uuid) cascade;

-- Drop tables (l'ordine cascade gestisce le dipendenze)
drop table if exists public.applications cascade;
drop table if exists public.project_comments cascade;
drop table if exists public.project_stars cascade;
drop table if exists public.projects cascade;
drop table if exists public.profiles cascade;

-- Pulisci eventuali auth.users se vuoi azzerare anche gli account
-- ATTENZIONE: decommenta solo se vuoi cancellare TUTTI gli utenti auth
-- delete from auth.users;

-- Fine reset — ora esegui schema.sql per ricreare tutto