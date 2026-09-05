-- H@rts — core transactional tables: `leads` and `payments`
--
-- WHY THIS FILE EXISTS
-- api/lead.js, api/trainee/profile.js and api/pay/*.js all write to these two
-- tables, but their DDL was never committed to the repo — it lived only in setup
-- notes. This file is the missing definition, so a fresh or restored Supabase
-- project can be stood up correctly and the expected shape is reviewable in
-- version control. schema.sql covers the catalog tables (services /
-- service_addons); this one covers the two that carry leads and money.
--
-- SCOPE: every column here is one the application actually reads or writes.
-- Nothing speculative. Verified against the codebase:
--   leads    ← api/lead.js (name, business, phone, city, package, payment_pref,
--                           summary, lang, source)
--             api/trainee/profile.js (name, phone, package, summary, lang, source)
--   payments ← api/pay/collect.js (writes) and api/pay/webhook.js (reconciles)
--
-- HOW TO RUN
-- Paste into the Supabase SQL editor for the project referenced by SUPABASE_URL
-- and run it. Safe on a fresh project AND on one where these tables already
-- exist in an older shape: every step is guarded, so it adds only what's missing
-- and never rewrites, drops, or deletes anything.
--
-- After running, verify with:  curl -sL https://hartsdigitalhub.com/api/health

-- ── leads ──────────────────────────────────────────────────────────────────
-- Sources seen in `source`: 'website-lead' (homepage quote form, via hub.js),
-- 'chat' (AI assistant lead flow, via app.js), 'training-foundations'
-- (Training Hub enrolment, via api/trainee/profile.js).

-- Fresh project: creates it. Existing project: no-op — the guarded ALTERs below
-- bring an older table up to date instead.
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.leads add column if not exists name         text;
alter table public.leads add column if not exists business     text;
alter table public.leads add column if not exists phone        text;
alter table public.leads add column if not exists city         text;
alter table public.leads add column if not exists package      text;   -- e.g. 'growth', 'training-foundations'
alter table public.leads add column if not exists payment_pref text;   -- 'full' | 'installments' | free text
alter table public.leads add column if not exists summary      text;   -- conversation summary / folded form fields
alter table public.leads add column if not exists lang         text not null default 'en';
alter table public.leads add column if not exists source       text not null default 'chat';
alter table public.leads add column if not exists created_at   timestamptz not null default now();

-- Newest-first is how leads are read (the follow-up queue); phone is how a
-- returning enquiry gets matched to an earlier one.
create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_phone_idx   on public.leads (phone);

-- ── payments ───────────────────────────────────────────────────────────────
-- Written by api/pay/collect.js, reconciled by api/pay/webhook.js.
-- `amount` is XAF (what Campay actually charges); `amount_usd` is the billed
-- price we display. Both are kept so the webhook can verify the gateway amount
-- matches what we intended to collect before marking a payment SUCCESSFUL.

create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.payments add column if not exists lead_id            uuid;
alter table public.payments add column if not exists external_reference text;    -- our UUID, made before calling Campay
alter table public.payments add column if not exists reference          text;    -- Campay's reference, saved on accept
alter table public.payments add column if not exists package            text;
alter table public.payments add column if not exists payment_type       text not null default 'setup';
alter table public.payments add column if not exists add_ons            text;    -- comma-separated add-on keys
alter table public.payments add column if not exists amount             numeric; -- XAF actually charged
alter table public.payments add column if not exists amount_usd         numeric; -- USD price shown to the customer
alter table public.payments add column if not exists currency           text not null default 'XAF';
alter table public.payments add column if not exists phone              text;
alter table public.payments add column if not exists status             text not null default 'PENDING';
alter table public.payments add column if not exists operator           text;
alter table public.payments add column if not exists operator_reference text;
alter table public.payments add column if not exists signature_verified boolean;
alter table public.payments add column if not exists paid_at            timestamptz;
alter table public.payments add column if not exists created_at         timestamptz not null default now();

-- Uniqueness the reconciliation logic depends on: api/pay/webhook.js looks a
-- payment up by `reference` or `external_reference` and expects a single row.
create unique index if not exists payments_external_reference_key on public.payments (external_reference);
create unique index if not exists payments_reference_key          on public.payments (reference);

create index if not exists payments_status_idx on public.payments (status, created_at desc);
create index if not exists payments_lead_idx   on public.payments (lead_id);

-- Constraints are added only if absent, and NOT VALID first so pre-existing rows
-- can never make this script fail. VALIDATE then promotes each to fully enforced
-- when the existing data already conforms.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.payments'::regclass and conname = 'payments_lead_id_fkey'
  ) then
    alter table public.payments
      add constraint payments_lead_id_fkey
      foreign key (lead_id) references public.leads (id) on delete set null not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.payments'::regclass and conname = 'payments_status_check'
  ) then
    alter table public.payments
      add constraint payments_status_check
      check (status in ('PENDING','SUCCESSFUL','FAILED')) not valid;

    begin
      alter table public.payments validate constraint payments_status_check;
    exception when check_violation then
      raise notice 'payments.status holds unexpected values; constraint left NOT VALID.';
    end;
  end if;
end $$;

-- ── Row Level Security ─────────────────────────────────────────────────────
-- Same trust model as services/service_addons: RLS on, and deliberately NO
-- anon/authenticated policies. Only the service_role key (server-side only, in
-- api/_supabase.js and api/pay/_lib.js) can touch these — it bypasses RLS.
-- Never expose an anon key against these tables: `leads` holds customer contact
-- details and `payments` holds money records.
--
-- If some other tool reads these tables with an ANON key, enabling RLS cuts off
-- that access. Nothing in this repo does.
alter table public.leads    enable row level security;
alter table public.payments enable row level security;

-- ── Verify ─────────────────────────────────────────────────────────────────
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name in ('leads','payments')
order by table_name, ordinal_position;
