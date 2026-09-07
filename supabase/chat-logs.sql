-- ===========================================================================
-- chat_logs — quality log for the AI fallback layer
-- ===========================================================================
-- Run once in the Supabase SQL editor, same as leads-and-payments.sql.
-- Written by api/_chatlog.js on every message the AI answers. Until this runs,
-- that sink is skipped and logging falls back to `vercel logs` only — the chat
-- itself is unaffected either way.
--
-- What it is for: reading back what the assistant actually said, so a wrong or
-- off-tone answer can be found and fixed in api/knowledge/company.md.
--
-- Idempotent — safe to re-run.
-- ===========================================================================

create table if not exists public.chat_logs (
  id           bigserial primary key,
  created_at   timestamptz not null default now(),

  question     text,                      -- what the visitor asked
  answer       text,                      -- what we sent back (markers stripped)

  provider     text,                      -- 'gemini' | 'xai' | 'none'
  model        text,                      -- e.g. 'gemini-flash-latest'
  lang         text not null default 'en',

  -- null = the model answered outright. 'human' = handed to a person.
  -- 'catalog' = deferred to the live package cards rather than quoting prices.
  escalate     text,

  ok           boolean not null default false,
  error        text,                      -- failure detail when ok is false
  latency_ms   integer,
  attempts     integer                    -- how many providers were tried
);

-- Review queries are "what happened lately" and "what went wrong lately".
create index if not exists chat_logs_created_idx  on public.chat_logs (created_at desc);
create index if not exists chat_logs_failed_idx   on public.chat_logs (created_at desc) where ok = false;
create index if not exists chat_logs_escalate_idx on public.chat_logs (escalate, created_at desc) where escalate is not null;

-- Constraint added NOT VALID first so pre-existing rows can never make this
-- script fail, then promoted when the existing data already conforms — same
-- pattern as payments_status_check in leads-and-payments.sql.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.chat_logs'::regclass and conname = 'chat_logs_escalate_check'
  ) then
    alter table public.chat_logs
      add constraint chat_logs_escalate_check
      check (escalate is null or escalate in ('human','catalog')) not valid;

    begin
      alter table public.chat_logs validate constraint chat_logs_escalate_check;
    exception when check_violation then
      raise notice 'chat_logs.escalate holds unexpected values; constraint left NOT VALID.';
    end;
  end if;
end $$;

-- ── Row Level Security ─────────────────────────────────────────────────────
-- Same trust model as leads/payments: RLS on, and deliberately NO anon or
-- authenticated policies. Only the service_role key (server-side only, used by
-- api/_chatlog.js) can read or write this — it bypasses RLS.
--
-- This matters more here than it looks: chat_logs holds whatever visitors typed
-- into the assistant, which regularly includes names, phone numbers and
-- business details. It is personal data. Do not expose it to an anon key, and
-- do not build a client-side dashboard against it.
alter table public.chat_logs enable row level security;

-- ── Retention ──────────────────────────────────────────────────────────────
-- Nothing prunes this automatically. Once there is enough history to be useful,
-- consider a scheduled delete — reviewing answer quality needs weeks, not years,
-- and the privacy note above argues for keeping the window short:
--
--   delete from public.chat_logs where created_at < now() - interval '90 days';

-- ── Verify ─────────────────────────────────────────────────────────────────
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'chat_logs'
order by ordinal_position;
