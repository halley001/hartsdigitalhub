// Quality log for every message the AI fallback layer handles.
//
// Underscore-prefixed → not exposed as a route, importable by api/chat.js.
//
// Two sinks, deliberately:
//
//   console  Always. Shows up in `vercel logs` with no setup at all, which
//            means the log works on the very first deploy, before anyone has
//            run any SQL. One line, prefixed [chat-ai], greppable.
//
//   Supabase Only when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are set AND
//            the chat_logs table exists. This is the one you actually review —
//            sortable, filterable, and it survives log retention.
//
// The table DDL lives in supabase/chat-logs.sql — run it once, same as
// leads-and-payments.sql. Until it is run, the Supabase write 404s, that is
// caught, and the console line still gets written.
//
// Nothing here is ever awaited on the reply path. A logging failure must never
// cost a visitor their answer, so every entry point swallows its own errors.

import { supabaseConfigured } from './_supabase.js';

const MAX_TEXT = 4000;

function clip(v, max = MAX_TEXT) {
  if (typeof v !== 'string') return v == null ? null : String(v).slice(0, max);
  return v.slice(0, max);
}

// Cuts the noise once the table is known to be missing: without this, every
// single message logs the same 404 and buries anything worth reading.
let supabaseSinkDisabled = false;

async function writeToSupabase(row) {
  if (supabaseSinkDisabled || !supabaseConfigured()) return;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/chat_logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(row)
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404 || /relation .*chat_logs.* does not exist/i.test(body)) {
      supabaseSinkDisabled = true;
      console.warn('[chat-ai] chat_logs table missing — run supabase/chat-logs.sql. Console logging continues.');
      return;
    }
    console.warn(`[chat-ai] log insert failed (${res.status}): ${body.slice(0, 200)}`);
  }
}

/**
 * Record one AI-handled turn.
 *
 * Fire-and-forget by design — call it without awaiting. Returns a promise only
 * so a caller that genuinely wants to wait (a test, say) can.
 *
 * @param {object}  entry
 * @param {string}  entry.question      What the visitor asked.
 * @param {string} [entry.answer]       What we sent back, after marker stripping.
 * @param {string}  entry.provider      'gemini' | 'xai' | 'none'
 * @param {string} [entry.model]        Model id that answered.
 * @param {string} [entry.lang]         'en' | 'fr'
 * @param {string} [entry.escalate]     'human' | 'catalog' | null
 * @param {boolean} entry.ok            Did a provider answer at all?
 * @param {string} [entry.error]        Failure detail when ok is false.
 * @param {number} [entry.latencyMs]
 * @param {number} [entry.attempts]     How many providers were tried.
 */
export function logChatTurn(entry) {
  const row = {
    question: clip(entry.question),
    answer: clip(entry.answer),
    provider: clip(entry.provider, 40),
    model: clip(entry.model, 80),
    lang: clip(entry.lang, 5) || 'en',
    escalate: clip(entry.escalate, 20),
    ok: Boolean(entry.ok),
    error: clip(entry.error, 500),
    latency_ms: Number.isFinite(entry.latencyMs) ? Math.round(entry.latencyMs) : null,
    attempts: Number.isFinite(entry.attempts) ? entry.attempts : null
  };

  // One structured line. Question and answer are truncated hard here — the full
  // text goes to the table; this is for spotting patterns while tailing logs.
  console.log('[chat-ai] ' + JSON.stringify({
    ok: row.ok,
    provider: row.provider,
    model: row.model,
    lang: row.lang,
    escalate: row.escalate,
    ms: row.latency_ms,
    q: clip(row.question, 160),
    a: clip(row.answer, 200),
    err: row.error
  }));

  return writeToSupabase(row).catch(err => {
    console.warn('[chat-ai] log sink error:', err.message);
  });
}
