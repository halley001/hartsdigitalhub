// Shared read-only Supabase REST helper for public catalog data (api/services.js
// and scripts/generate-services.js). Underscore-prefixed → Vercel does NOT expose
// this as a route, but it can be imported.
//
// Kept separate from api/pay/_lib.js, which is explicitly scoped to the Campay
// payment endpoints (money-charging authority) — this file never touches money.
//
// Required env vars (already configured in Vercel for the leads/payments tables):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

export function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function sbHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`
  };
}

// table: 'services' | 'service_addons'. query: a PostgREST query string, e.g.
// 'active=eq.true&order=kind.asc,sort_order.asc'
export async function sbSelectAll(table, query) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${table}?${query}`;
  const r = await fetch(url, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`Supabase select failed (${r.status}): ${await r.text()}`);
  return r.json();
}
