// Vercel Serverless Function — POST /api/lead
// Persists a chat lead to Supabase (Postgres) so no lead is lost if the
// customer doesn't tap the WhatsApp button. Zero dependencies: uses the
// Supabase REST API via global fetch (Node 18+ on Vercel).
//
// Required Vercel env vars:
//   SUPABASE_URL                — e.g. https://xxxxxxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   — service_role key (server-side only, never expose)
//
// Expected Supabase table `leads` (SQL to create it is in the setup notes).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Supabase env vars not configured');
    return res.status(500).json({ error: 'Lead store not configured' });
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

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(lead)
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error('Supabase insert failed:', resp.status, detail);
      return res.status(502).json({ error: 'Could not save lead' });
    }

    // Return the new row id so the client can link a payment to this lead
    const rows = await resp.json().catch(() => []);
    const id = Array.isArray(rows) && rows[0] ? rows[0].id : null;
    return res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error('Error saving lead:', err);
    return res.status(500).json({ error: 'Failed to save lead' });
  }
}
