// Vercel Serverless Function — POST /api/trainee/progress
// Marks a module of the Git & GitHub with SSH keys course complete for the
// signed-in trainee. When all 7 modules are complete, issues a server-side
// certificate ID (HDH-GIT-XXXXXXXX) in git_cert_id.
//
// Body: { module: 11-17 }
//
// Module ids start at 11 because ids 1-10 belonged to the retired AI course and
// may still sit in a trainee's `completed` list. Those old ids are kept as they
// are (so an old cert_id still matches its record) but never count here.
// dashboard.js holds the same list and must stay in step.

import crypto from 'crypto';
import { supabaseConfigured, sbSelectOne, sbUpdate } from '../pay/_lib.js';
import { getSessionUser } from '../_auth.js';

const MODULE_IDS = [11, 12, 13, 14, 15, 16, 17];

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
  if (!MODULE_IDS.includes(moduleNum)) {
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
    const doneInCourse = MODULE_IDS.filter(id => completed.includes(id)).length;
    if (doneInCourse === MODULE_IDS.length && !profile.git_cert_id) {
      patch.git_cert_id = 'HDH-GIT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    }

    const rows = await sbUpdate('trainee_profiles', 'user_id', user.id, patch);
    const updated = Array.isArray(rows) ? rows[0] : rows;

    return res.status(200).json({
      email: user.email,
      name: updated.name || null,
      phone: updated.phone || null,
      country: updated.country || null,
      completed: updated.completed || [],
      git_cert_id: updated.git_cert_id || null
    });
  } catch (err) {
    console.error('Error saving progress:', err);
    return res.status(500).json({ error: 'Failed to save progress' });
  }
}
