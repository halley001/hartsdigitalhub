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
    const [items, addons] = await Promise.all([
      sbSelectAll('services', 'active=eq.true&order=kind.asc,sort_order.asc'),
      sbSelectAll('service_addons', 'active=eq.true&order=sort_order.asc')
    ]);

    // Edge-cached for 5 minutes (stale-while-revalidate up to an hour), so
    // Supabase gets hit roughly once per window total, not once per request.
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json({ items, addons, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error fetching services catalog:', err);
    return res.status(502).json({ error: 'Catalog unavailable' });
  }
}
