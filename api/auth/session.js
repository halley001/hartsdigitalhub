// Vercel Serverless Function — POST /api/auth/session
// Called by login.html right after Supabase emails a magic link and the
// browser lands back with a session in the URL hash. Validates the access
// token against Supabase, ensures a trainee_profiles row exists, and hands
// back httpOnly cookies so the browser never has to hold the raw tokens.
//
// Required Vercel env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (already set).

import { supabaseConfigured, sbSelectOne, sbInsert } from '../pay/_lib.js';
import { serializeCookie } from '../_cookies.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!supabaseConfigured()) {
    return res.status(500).json({ error: 'Auth not configured' });
  }

  const { access_token, refresh_token, expires_in } = req.body || {};
  if (!access_token || !refresh_token) {
    return res.status(400).json({ error: 'Missing tokens' });
  }

  try {
    const userResp = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
    if (!userResp.ok) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    const user = await userResp.json();

    let profile = await sbSelectOne('trainee_profiles', 'user_id', user.id);
    if (!profile) {
      profile = await sbInsert('trainee_profiles', { user_id: user.id, completed: [] });
    }

    const atMaxAge = Number(expires_in) > 0 ? Number(expires_in) : 3600;
    res.setHeader('Set-Cookie', [
      serializeCookie('sb_at', access_token, { maxAge: atMaxAge }),
      serializeCookie('sb_rt', refresh_token, { maxAge: 60 * 60 * 24 * 30 })
    ]);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error establishing session:', err);
    return res.status(500).json({ error: 'Failed to establish session' });
  }
}
