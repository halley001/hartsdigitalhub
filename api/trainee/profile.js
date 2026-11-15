// Vercel Serverless Function — POST /api/trainee/profile
// Saves name/phone/country for a signed-in trainee (asked once, right after
// their first login, since the magic-link flow only ever collects an email).
// Also drops a row into the existing `leads` table so new trainees still
// flow into the same pipeline chat leads use (see api/lead.js).
//
// Body: { name, phone, country }

import { supabaseConfigured, sbSelectOne, sbUpdate, sbInsert } from '../pay/_lib.js';
import { getSessionUser } from '../_auth.js';

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

  const body = req.body || {};
  const clean = (v, max = 160) => (typeof v === 'string' ? v.trim().slice(0, max) : null);
  const name = clean(body.name, 120);
  const phone = clean(body.phone, 40);
  const country = clean(body.country, 80);

  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Please provide your full name' });
  }

  try {
    const existing = await sbSelectOne('trainee_profiles', 'user_id', user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const rows = await sbUpdate('trainee_profiles', 'user_id', user.id, {
      name, phone, country, updated_at: new Date().toISOString()
    });
    const updated = Array.isArray(rows) ? rows[0] : rows;

    sbInsert('leads', {
      name, phone,
      package: 'training-git-github',
      summary: `Git & GitHub course enrolment (dashboard) | Email: ${user.email} | Country: ${country}`,
      lang: 'en',
      source: 'training-git-github'
    }).catch(err => console.error('Non-fatal: lead insert failed', err));

    return res.status(200).json({
      email: user.email,
      name: updated.name || null,
      phone: updated.phone || null,
      country: updated.country || null,
      completed: updated.completed || [],
      git_cert_id: updated.git_cert_id || null
    });
  } catch (err) {
    console.error('Error saving trainee profile:', err);
    return res.status(500).json({ error: 'Failed to save profile' });
  }
}
