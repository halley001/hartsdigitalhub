// POST /api/pay/collect — starts a Campay Mobile Money "collect" for a package
//   SETUP fee (was /api/pay/initiate). Confirmation arrives via /api/pay/webhook.
// GET  /api/pay/collect?ref=<external_reference> — polls a collection's status
//   (was /api/pay/status).
//
// Merged into one file (dispatched by req.method) to stay within the Vercel
// Hobby plan's 12-serverless-function-per-deployment limit — adding
// api/services.js as a 13th function pushed deploys over it. Safe to merge:
// both directions are called only from our own client code (app.js's
// initiatePayment/pollPaymentStatus, currently unreachable dead code kept for
// when Campay goes to production) — unlike /api/pay/webhook.js, which is
// Campay's registered external callback URL and is untouched.

import {
  CAMPAY_BASE, SETUP_FEES_USD, ADDON_PRICES_USD, usdToXaf, getCampayToken, normalizePhone,
  fetchCampayTransaction, supabaseConfigured, sbInsert, sbUpdate, sbSelectOne
} from './_lib.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method === 'POST') return handleInitiate(req, res);
  if (req.method === 'GET') return handleStatus(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleInitiate(req, res) {
  if (!supabaseConfigured()) return res.status(500).json({ error: 'Payment store not configured' });

  const { package: pkg, phone, lead_id = null, add_ons = [] } = req.body || {};

  // Server-authoritative price (USD) — never trust an amount from the client
  const setupUsd = SETUP_FEES_USD[pkg];
  if (!setupUsd) return res.status(400).json({ error: 'Unknown package' });

  // Validate add-ons against the known catalog and sum their USD prices
  const addonKeys = (Array.isArray(add_ons) ? add_ons : [])
    .filter(k => ADDON_PRICES_USD[k]);
  const addonUsd = addonKeys.reduce((sum, k) => sum + ADDON_PRICES_USD[k], 0);

  const amountUsd = setupUsd + addonUsd;   // what we display/bill in USD
  const amountXaf = usdToXaf(amountUsd);   // what Campay actually collects (Mobile Money is XAF)

  const from = normalizePhone(phone);
  if (!from) return res.status(400).json({ error: 'Invalid phone number' });

  const external_reference = crypto.randomUUID();

  // 1) Record the intent as PENDING before calling the gateway.
  //    amount = XAF actually charged (matches Campay for reconciliation); amount_usd = billed price.
  let row;
  try {
    row = await sbInsert('payments', {
      lead_id,
      external_reference,
      package: pkg,
      payment_type: 'setup',
      add_ons: addonKeys.join(',') || null,
      amount: amountXaf,
      amount_usd: amountUsd,
      currency: 'XAF',
      phone: from,
      status: 'PENDING'
    });
  } catch (e) {
    console.error('payments insert failed:', e);
    return res.status(500).json({ error: 'Could not create payment' });
  }

  // 2) Ask Campay to collect from the customer's phone
  try {
    const token = await getCampayToken();
    const resp = await fetch(`${CAMPAY_BASE}/api/collect/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Token ${token}` },
      body: JSON.stringify({
        amount: String(amountXaf),
        currency: 'XAF',
        from,
        description: `Harts ${pkg} setup${addonKeys.length ? ' + ' + addonKeys.join('+') : ''} ($${amountUsd})`,
        external_reference
      })
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.reference) {
      console.error('Campay collect failed:', resp.status, data);
      await sbUpdate('payments', 'external_reference', external_reference, { status: 'FAILED' });
      return res.status(502).json({ error: 'Could not start payment', detail: data?.message || null });
    }

    // 3) Save Campay's reference so the webhook/status can match it
    await sbUpdate('payments', 'external_reference', external_reference, { reference: data.reference });

    return res.status(201).json({
      external_reference,
      reference: data.reference,
      ussd_code: data.ussd_code || null,
      operator: data.operator || null,
      amount_usd: amountUsd,
      amount_xaf: amountXaf,
      currency: 'XAF'
    });
  } catch (e) {
    console.error('initiate error:', e);
    await sbUpdate('payments', 'external_reference', external_reference, { status: 'FAILED' }).catch(() => {});
    return res.status(500).json({ error: 'Payment initiation failed' });
  }
}

async function handleStatus(req, res) {
  if (!supabaseConfigured()) return res.status(500).json({ error: 'Payment store not configured' });

  const ref = req.query?.ref;
  if (!ref) return res.status(400).json({ error: 'Missing ref' });

  try {
    const record = await sbSelectOne('payments', 'external_reference', ref);
    if (!record) return res.status(404).json({ error: 'Not found' });

    // Finalized already
    if (record.status === 'SUCCESSFUL' || record.status === 'FAILED') {
      return res.status(200).json({ status: record.status });
    }

    // Still pending and we have a gateway reference → live check
    if (record.reference) {
      try {
        const txn = await fetchCampayTransaction(record.reference);
        const trueStatus = (txn.status || '').toUpperCase();
        const amountOk = Number(txn.amount) === Number(record.amount);
        let finalStatus = 'PENDING';
        if (trueStatus === 'SUCCESSFUL' && amountOk) finalStatus = 'SUCCESSFUL';
        else if (trueStatus === 'FAILED' || (trueStatus === 'SUCCESSFUL' && !amountOk)) finalStatus = 'FAILED';

        if (finalStatus !== 'PENDING') {
          await sbUpdate('payments', 'external_reference', ref, {
            status: finalStatus,
            operator: txn.operator || null,
            operator_reference: txn.operator_reference || null,
            paid_at: finalStatus === 'SUCCESSFUL' ? new Date().toISOString() : null
          });
        }
        return res.status(200).json({ status: finalStatus });
      } catch (e) {
        console.error('status live-check failed:', e);
        return res.status(200).json({ status: 'PENDING' });
      }
    }

    return res.status(200).json({ status: record.status || 'PENDING' });
  } catch (e) {
    console.error('status error:', e);
    return res.status(500).json({ error: 'Status check failed' });
  }
}
