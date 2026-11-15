-- H@rts — client reviews
--
-- Written by api/_reviews.js, which is reached through POST /api/lead with
-- { "type": "review" } (routed there because the Vercel Hobby plan caps the
-- deployment at 12 functions and this project is already at 12).
--
-- Sources seen in `source`: 'review-page' (reviews.html), 'chat' (the rating the
-- assistant asks for at the end of an order, via app.js).
--
-- Nothing is published automatically. A review becomes eligible for display only
-- when BOTH are true:
--   publish_consent = true   the client ticked "you may publish this"
--   approved        = true   someone at H@rts set it, in the Supabase table editor
--
-- HOW TO RUN: paste into the Supabase SQL editor for the project referenced by
-- SUPABASE_URL and run it once. Guarded, so re-running is safe.

create table if not exists public.reviews (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),
  name             text not null,
  company          text,
  role             text,
  service          text,
  rating           smallint not null check (rating between 1 and 5),
  comment          text,
  email            text,            -- private: used only to confirm the review is genuine
  publish_consent  boolean not null default false,
  approved         boolean not null default false,
  lang             text not null default 'en',
  source           text not null default 'review-page'
);

create index if not exists reviews_created_at_idx on public.reviews (created_at desc);
create index if not exists reviews_published_idx on public.reviews (approved, publish_consent);

-- Row Level Security on, with no policies: the anon key can neither read nor
-- write. Only the service_role key (server-side, in api/) can, and it bypasses RLS.
alter table public.reviews enable row level security;
