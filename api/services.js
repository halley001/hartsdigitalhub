// Vercel Serverless Function — GET /api/services
// Public read-only catalog endpoint: the knowledge base both chatbot surfaces
// (app.js's rule router and api/chat.js's LLM system prompt) hydrate from,
// instead of each keeping its own hardcoded copy of packages/pricing/features.
//
// No auth — this is the same catalog data already rendered in services.html,
// just served as JSON. Reads go through Supabase's REST API via api/_supabase.js
// (service_role key, server-side only — never expose it to the client).

import { supabaseConfigured, sbSelectAll } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseConfigured()) {
    return res.status(500).json({ error: 'Catalog store not configured' });
  }

  try {
    // The FAQ rows ride along on this endpoint rather than getting their own
    // route: the Vercel Hobby plan caps a deployment at 12 serverless functions
    // and this project is at exactly 12 (see the note in api/pay/collect.js,
    // which was merged for the same reason).
    //
    // Its failure is deliberately non-fatal. The `faq` table is created by
    // supabase/faq.sql, which is run by hand — until that happens PostgREST
    // returns 404 here, and letting that reject would take the service catalog
    // down with it for every visitor. app.js already falls back to its bundled
    // FAQ set, so an empty array is a graceful outcome, not an outage.
    const [items, addons, faqs] = await Promise.all([
      sbSelectAll('services', 'active=eq.true&order=kind.asc,sort_order.asc'),
      sbSelectAll('service_addons', 'active=eq.true&order=sort_order.asc'),
      sbSelectAll('faq', 'active=eq.true&order=category.asc,sort_order.asc')
        .catch(err => { console.warn('FAQ table unavailable (run supabase/faq.sql):', err.message); return []; })
    ]);

    // Edge-cached for 5 minutes (stale-while-revalidate up to an hour), so
    // Supabase gets hit roughly once per window total, not once per request.
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json({ items, addons, faqs, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error fetching services catalog:', err);
    return res.status(502).json({ error: 'Catalog unavailable' });
  }
}
