// Vercel Serverless Function — POST /api/auth/refresh
// Exchanges the long-lived refresh cookie for a new access token when a
// trainee API call gets a 401 because the short-lived access token expired.
//
// Required Vercel env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (already set).

import { supabaseConfigured } from '../pay/_lib.js';
import { parseCookies, serializeCookie } from '../_cookies.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!supabaseConfigured()) {
    return res.status(500).json({ error: 'Auth not configured' });
  }

  const { sb_rt } = parseCookies(req);
  if (!sb_rt) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ refresh_token: sb_rt })
    });
    if (!r.ok) {
      return res.status(401).json({ error: 'Session expired' });
    }
    const data = await r.json();

    res.setHeader('Set-Cookie', [
      serializeCookie('sb_at', data.access_token, { maxAge: Number(data.expires_in) || 3600 }),
      serializeCookie('sb_rt', data.refresh_token, { maxAge: 60 * 60 * 24 * 30 })
    ]);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error refreshing session:', err);
    return res.status(500).json({ error: 'Failed to refresh session' });
  }
}
