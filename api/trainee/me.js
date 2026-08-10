// Vercel Serverless Function — GET /api/trainee/me
// Returns the signed-in trainee's profile + course progress. Used by
// dashboard.js on load; a 401 here sends the browser back to /login.html.

import { supabaseConfigured, sbSelectOne, sbInsert } from '../pay/_lib.js';
import { getSessionUser } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!supabaseConfigured()) {
    return res.status(500).json({ error: 'Auth not configured' });
  }

  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    let profile = await sbSelectOne('trainee_profiles', 'user_id', user.id);
    if (!profile) {
      profile = await sbInsert('trainee_profiles', { user_id: user.id, completed: [] });
    }
    return res.status(200).json({
      email: user.email,
      name: profile.name || null,
      phone: profile.phone || null,
      country: profile.country || null,
      completed: profile.completed || [],
      cert_id: profile.cert_id || null
    });
  } catch (err) {
    console.error('Error loading trainee profile:', err);
    return res.status(500).json({ error: 'Failed to load profile' });
  }
}
