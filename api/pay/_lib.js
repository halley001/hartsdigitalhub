// Shared helpers for the Campay payment endpoints.
// Underscore-prefixed → Vercel does NOT expose this as a route, but it can be imported.
//
// Required env vars (set in Vercel):
//   CAMPAY_BASE_URL              — https://demo.campay.net (sandbox) or https://www.campay.net (live)
//   CAMPAY_PERMANENT_TOKEN       — permanent access token from Campay app "APP KEYS" (preferred)
//     ...or CAMPAY_USERNAME + CAMPAY_PASSWORD (app username/password) to fetch a temp token
//   CAMPAY_WEBHOOK_KEY           — webhook/signature key from Campay app settings (optional, for signature check)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  — same as the leads endpoint

import crypto from 'crypto';

export const CAMPAY_BASE = (process.env.CAMPAY_BASE_URL || 'https://demo.campay.net').replace(/\/+$/, '');

// Server-authoritative setup fees (XAF). The client never sends the price.
export const SETUP_FEES_XAF = {
  starter: 50000,
  growth: 120000,
  pro: 250000,
  build_only: 180000
};

// --- Campay ---------------------------------------------------------------

export async function getCampayToken() {
  const permanent = process.env.CAMPAY_PERMANENT_TOKEN;
  if (permanent) return permanent;

  const username = process.env.CAMPAY_USERNAME;
  const password = process.env.CAMPAY_PASSWORD;
  if (!username || !password) throw new Error('Campay credentials not configured');

  const r = await fetch(`${CAMPAY_BASE}/api/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!r.ok) throw new Error(`Campay token request failed (${r.status})`);
  const data = await r.json();
  return data.token;
}

// Normalize a Cameroon number to Campay's expected 237XXXXXXXXX form.
export function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('237') && digits.length === 12) return digits;
  if (digits.length === 9) return '237' + digits;
  return null; // invalid
}

// Ask Campay for the true status of a transaction (authenticated) — source of truth.
export async function fetchCampayTransaction(reference, token) {
  const t = token || (await getCampayToken());
  const r = await fetch(`${CAMPAY_BASE}/api/transaction/${encodeURIComponent(reference)}/`, {
    headers: { Authorization: `Token ${t}` }
  });
  if (!r.ok) throw new Error(`Campay status query failed (${r.status})`);
  return r.json(); // { reference, external_reference, status, amount, currency, operator, operator_reference, ... }
}

// Optional HS256 JWT signature check (Campay signs the callback with the webhook key).
// Best-effort: returns true/false. We do NOT rely on this alone — we always re-query the txn.
export function verifyCampaySignature(signature, webhookKey) {
  try {
    if (!signature || !webhookKey) return false;
    const [header, payload, sig] = signature.split('.');
    if (!header || !payload || !sig) return false;
    const expected = crypto
      .createHmac('sha256', webhookKey)
      .update(`${header}.${payload}`)
      .digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    // constant-time compare
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// --- Supabase (REST) ------------------------------------------------------

function sbHeaders(extra = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra
  };
}

export function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function sbInsert(table, row) {
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: sbHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(row)
  });
  if (!r.ok) throw new Error(`Supabase insert failed (${r.status}): ${await r.text()}`);
  const rows = await r.json();
  return rows[0];
}

export async function sbUpdate(table, matchColumn, matchValue, patch) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${table}?${matchColumn}=eq.${encodeURIComponent(matchValue)}`;
  const r = await fetch(url, {
    method: 'PATCH',
    headers: sbHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(patch)
  });
  if (!r.ok) throw new Error(`Supabase update failed (${r.status}): ${await r.text()}`);
  return r.json();
}

export async function sbSelectOne(table, matchColumn, matchValue) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${table}?${matchColumn}=eq.${encodeURIComponent(matchValue)}&limit=1`;
  const r = await fetch(url, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`Supabase select failed (${r.status})`);
  const rows = await r.json();
  return rows[0] || null;
}
