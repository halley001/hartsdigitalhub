// POST /api/pay/initiate
// Starts a Campay Mobile Money "collect" for a package SETUP fee.
// The customer approves the USSD prompt on their phone; confirmation
// arrives via /api/pay/webhook. Amount is computed server-side.

import {
  CAMPAY_BASE, SETUP_FEES_USD, ADDON_PRICES_USD, usdToXaf, getCampayToken, normalizePhone,
  supabaseConfigured, sbInsert, sbUpdate
} from './_lib.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
