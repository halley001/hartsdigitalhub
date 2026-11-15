// Client review capture. Underscore-prefixed → not a route of its own.
//
// Reached as POST /api/lead with { "type": "review", ... }. It is not its own
// function because the Vercel Hobby plan caps a deployment at 12 serverless
// functions and this project is at exactly 12 (see api/pay/collect.js and
// api/services.js for the same constraint).
//
// Same capture philosophy as api/lead.js: store it AND tell a human, judged
// separately, and only report failure when both channels failed — a review a
// client took the time to write must not vanish.
//
// Nothing here publishes anything. A review is stored with approved = false and
// only becomes showable once someone sets approved = true in Supabase, and only
// if the client ticked publish_consent. DDL: supabase/reviews.sql.

import { notifyNewReview } from './_notify.js';

const SERVICES = new Set([
  'ai-chatbot', 'website', 'custom-software', 'cloud-database',
  'managed-it', 'branding', 'training', 'other'
]);

export async function handleReview(req, res) {
  const body = req.body || {};

  // Honeypot: a field real visitors never see. Bots fill every input. Answer as
  // if it worked so the bot learns nothing.
  if (typeof body.website === 'string' && body.website.trim()) {
    return res.status(201).json({ ok: true, captured: true });
  }

  const clean = (v, max) =>
    (typeof v === 'string' ? v.trim().slice(0, max) : null) || null;

  const rating = Number(body.rating);
  const service = clean(body.service, 40);
  const email = clean(body.email, 160);

  const review = {
    name: clean(body.name, 120),
    company: clean(body.company, 160),
    role: clean(body.role, 120),
    service: service && SERVICES.has(service) ? service : (service ? 'other' : null),
    rating,
    comment: clean(body.comment, 2000),
    email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
    publish_consent: body.publish_consent === true,
    lang: body.lang === 'fr' ? 'fr' : 'en',
    source: body.source === 'chat' ? 'chat' : 'review-page'
  };

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be a whole number from 1 to 5' });
  }
  if (!review.name) {
    // The chat flow may not know a name; the review page always asks for one.
    if (review.source === 'chat') review.name = 'Chat visitor';
    else return res.status(400).json({ error: 'Name is required' });
  }

  const [stored, notified] = await Promise.all([
    saveReview(review),
    notifyNewReview(review)
  ]);

  if (!stored.ok && notified.sent.length === 0) {
    console.error('REVIEW NOT CAPTURED — all channels failed', {
      store: stored.error,
      notify: notified.failed
    });
    return res.status(502).json({ error: 'Could not save review', captured: false });
  }
  if (!stored.ok) console.error('Review notified but NOT stored:', stored.error);

  return res.status(201).json({ ok: true, captured: true, stored: stored.ok });
}

// Never throws.
async function saveReview(review) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, error: 'Supabase env vars not configured' };

  try {
    const r = await fetch(`${url}/rest/v1/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(review)
    });
    if (!r.ok) {
      const detail = await r.text();
      const hint = r.status === 404 ? ' — run supabase/reviews.sql to create the table' : '';
      return { ok: false, error: `Supabase ${r.status}: ${detail}${hint}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}
