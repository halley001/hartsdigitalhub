// Vercel Serverless Function — POST /api/lead
// Captures a lead from the website quote form or the AI assistant.
//
// Capture is treated as two independent channels: persist it to Supabase, and
// notify a human. They are attempted in parallel and judged separately, because
// losing a lead is far worse than storing it twice. As long as ONE channel
// succeeds the visitor is told their request went through; only if BOTH fail do
// we return an error, which is the client's signal to keep its local copy and
// steer the visitor to WhatsApp.
//
// Required Vercel env vars:
//   SUPABASE_URL                — e.g. https://xxxxxxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   — service_role key (server-side only, never expose)
//
// The `leads` table DDL lives in supabase/leads-and-payments.sql — run it once.
// Optional notification env vars are documented in api/_notify.js.

import { notifyNewLead } from './_notify.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const clean = (v, max = 300) =>
    (typeof v === 'string' ? v.trim().slice(0, max) : v == null ? null : String(v).slice(0, max));

  const lead = {
    name: clean(body.name, 120),
    business: clean(body.business, 160),
    phone: clean(body.phone, 40),
    city: clean(body.city, 80),
    package: clean(body.package, 40),
    payment_pref: clean(body.payment_pref, 40),
    summary: clean(body.summary, 2000),
    lang: clean(body.lang, 5) || 'en',
    source: clean(body.source, 40) || 'chat'
  };

  // Require at least one piece of contact info — ignore empty pings
  if (!lead.name && !lead.phone && !lead.business) {
    return res.status(400).json({ error: 'Empty lead' });
  }

  // `email` isn't a column on `leads` (the form folds it into `summary`), but the
  // notifier uses it as a reply-to when it's there.
  const notifyPayload = { ...lead, email: clean(body.email, 160) };

  const [stored, notified] = await Promise.all([
    saveToSupabase(lead),
    notifyNewLead(notifyPayload)
  ]);

  const captured = stored.ok || notified.sent.length > 0;

  if (!captured) {
    // Nothing worked. Say so honestly so the client keeps its local copy rather
    // than telling the visitor everything is fine.
    console.error('LEAD NOT CAPTURED — all channels failed', {
      store: stored.error,
      notify: notified.failed
    });
    return res.status(502).json({ error: 'Could not save lead', captured: false });
  }

  if (!stored.ok) {
    // A human was told, but nothing is in the database — worth shouting about in
    // the logs, since the lead exists only in a notification.
    console.error('Lead notified but NOT stored:', stored.error);
  }

  return res.status(201).json({
    ok: true,
    captured: true,
    id: stored.id || null,
    stored: stored.ok,
    notified: notified.sent
  });
}

// Never throws — returns { ok, id, error } so the caller can weigh it against
// the notification result.
async function saveToSupabase(lead) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return { ok: false, id: null, error: 'Supabase env vars not configured' };
  }

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify(lead)
    });

    if (!resp.ok) {
      const detail = await resp.text();
      // A 404 here almost always means the `leads` table doesn't exist yet.
      const hint = resp.status === 404
        ? ' — does the `leads` table exist? Run supabase/leads-and-payments.sql'
        : '';
      return { ok: false, id: null, error: `Supabase ${resp.status}: ${detail}${hint}` };
    }

    const rows = await resp.json().catch(() => []);
    const id = Array.isArray(rows) && rows[0] ? rows[0].id : null;
    return { ok: true, id, error: null };
  } catch (err) {
    return { ok: false, id: null, error: String(err?.message || err) };
  }
}
