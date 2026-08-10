// Vercel Serverless Function — POST /api/trainee/progress
// Marks a module complete for the signed-in trainee. When the 10th module
// completes, issues a server-side certificate ID (unlike the old anonymous
// flow, this one is actually recorded and could be checked against later).
//
// Body: { module: 1-10 }

import crypto from 'crypto';
import { supabaseConfigured, sbSelectOne, sbUpdate } from '../pay/_lib.js';
import { getSessionUser } from '../_auth.js';

const TOTAL_MODULES = 10;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!supabaseConfigured()) {
    return res.status(500).json({ error: 'Auth not configured' });
  }

  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const moduleNum = Number((req.body || {}).module);
  if (!Number.isInteger(moduleNum) || moduleNum < 1 || moduleNum > TOTAL_MODULES) {
    return res.status(400).json({ error: 'Invalid module number' });
  }

  try {
    const profile = await sbSelectOne('trainee_profiles', 'user_id', user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const completed = Array.isArray(profile.completed) ? profile.completed.slice() : [];
    if (!completed.includes(moduleNum)) completed.push(moduleNum);
    completed.sort((a, b) => a - b);

    const patch = { completed, updated_at: new Date().toISOString() };
    if (completed.length === TOTAL_MODULES && !profile.cert_id) {
      patch.cert_id = 'HDH-AI-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    }

    const rows = await sbUpdate('trainee_profiles', 'user_id', user.id, patch);
    const updated = Array.isArray(rows) ? rows[0] : rows;

    return res.status(200).json({
      email: user.email,
      name: updated.name || null,
      phone: updated.phone || null,
      country: updated.country || null,
      completed: updated.completed || [],
      cert_id: updated.cert_id || null
    });
  } catch (err) {
    console.error('Error saving progress:', err);
    return res.status(500).json({ error: 'Failed to save progress' });
  }
}
