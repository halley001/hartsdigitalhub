-- H@rts Training Hub — trainee_profiles
--
-- One row per signed-in trainee of the Git & GitHub with SSH keys course.
-- Written only by the server (service role key) from:
--   api/trainee/me.js        creates the row on first visit to the dashboard
--   api/trainee/profile.js   saves name, phone, country
--   api/trainee/progress.js  records completed modules, issues git_cert_id
--
-- Run once in the Supabase SQL editor for the same project as `leads`.
-- Safe to re-run: CREATE ... IF NOT EXISTS and guarded ALTERs.
--
-- Module ids: the Git course uses 11-17. Ids 1-10 belonged to the retired AI
-- course; they may remain in `completed` for older trainees and are ignored.
-- cert_id holds certificates already issued for that AI course (HDH-AI-...),
-- and is kept so those IDs can still be confirmed. New certificates go in
-- git_cert_id (HDH-GIT-...).

create table if not exists public.trainee_profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  name        text,
  phone       text,
  country     text,
  completed   jsonb not null default '[]'::jsonb,
  cert_id     text,
  git_cert_id text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Existing project: the table is already there, so bring it up to date.
alter table public.trainee_profiles add column if not exists git_cert_id text;

create unique index if not exists trainee_profiles_cert_id_key     on public.trainee_profiles (cert_id);
create unique index if not exists trainee_profiles_git_cert_id_key on public.trainee_profiles (git_cert_id);

-- No policies: only the server's service role key reads or writes this table.
alter table public.trainee_profiles enable row level security;
