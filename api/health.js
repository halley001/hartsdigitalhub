// GET /api/health
// Confirms the deployment is wired correctly WITHOUT revealing any secret values.
// Reports which env vars are present and whether Supabase + Campay actually respond.
//
// Optional: set HEALTH_CHECK_KEY in Vercel and call /api/health?key=... to gate access.

import { CAMPAY_BASE, getCampayToken } from './pay/_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Optional access gate
  const gate = process.env.HEALTH_CHECK_KEY;
  if (gate && req.query?.key !== gate) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const hasCampayAuth = Boolean(
    process.env.CAMPAY_PERMANENT_TOKEN ||
    (process.env.CAMPAY_USERNAME && process.env.CAMPAY_PASSWORD)
  );

  const env = {
    supabase_url: Boolean(process.env.SUPABASE_URL),
    supabase_service_key: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    campay_base_url: CAMPAY_BASE,                 // not secret — helps confirm demo vs live
    campay_auth: hasCampayAuth,
    campay_webhook_key: Boolean(process.env.CAMPAY_WEBHOOK_KEY),
    lead_notify_telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    lead_notify_email: Boolean(
      process.env.RESEND_API_KEY && process.env.LEAD_NOTIFY_TO && process.env.LEAD_NOTIFY_FROM
    )
  };

  const checks = { supabase: 'skipped', campay: 'skipped', lead_notify: 'skipped' };

  // A lead can still be captured with no notification channel, but nobody is told
  // about it until someone opens the database — worth flagging loudly.
  checks.lead_notify = (env.lead_notify_telegram || env.lead_notify_email)
    ? 'ok'
    : 'warn (no channel configured — leads are stored silently)';

  // Live check 1: Supabase reachable + authorized + tables exist
  if (env.supabase_url && env.supabase_service_key) {
    try {
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const [leadsRes, paymentsRes] = await Promise.all([
        fetch(`${process.env.SUPABASE_URL}/rest/v1/leads?limit=1`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` }
        }),
        fetch(`${process.env.SUPABASE_URL}/rest/v1/payments?limit=1`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` }
        })
      ]);
      checks.supabase = leadsRes.ok && paymentsRes.ok
        ? 'ok'
        : `fail (leads ${leadsRes.status}, payments ${paymentsRes.status})`;
    } catch (e) {
      checks.supabase = 'fail (unreachable)';
    }
  } else {
    checks.supabase = 'fail (env missing)';
  }

  // Live check 2: Campay credentials produce a usable token
  if (hasCampayAuth) {
    try {
      const token = await getCampayToken();
      checks.campay = token ? 'ok' : 'fail (no token)';
    } catch (e) {
      checks.campay = 'fail (auth rejected)';
    }
  } else {
    checks.campay = 'fail (env missing)';
  }

  const allGood = checks.supabase === 'ok' && checks.campay === 'ok';
  return res.status(allGood ? 200 : 503).json({ ok: allGood, env, checks });
}
