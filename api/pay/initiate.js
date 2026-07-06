// POST /api/pay/initiate
// Starts a Campay Mobile Money "collect" for a package SETUP fee.
// The customer approves the USSD prompt on their phone; confirmation
// arrives via /api/pay/webhook. Amount is computed server-side.

import {
  CAMPAY_BASE, SETUP_FEES_XAF, getCampayToken, normalizePhone,
  supabaseConfigured, sbInsert, sbUpdate
} from './_lib.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!supabaseConfigured()) return res.status(500).json({ error: 'Payment store not configured' });

  const { package: pkg, phone, lead_id = null } = req.body || {};

  // Server-authoritative amount — never trust a price from the client
  const amount = SETUP_FEES_XAF[pkg];
  if (!amount) return res.status(400).json({ error: 'Unknown package' });

  const from = normalizePhone(phone);
  if (!from) return res.status(400).json({ error: 'Invalid phone number' });

  const external_reference = crypto.randomUUID();

  // 1) Record the intent as PENDING before calling the gateway
  let row;
  try {
    row = await sbInsert('payments', {
      lead_id,
      external_reference,
      package: pkg,
      payment_type: 'setup',
      amount,
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
        amount: String(amount),
        currency: 'XAF',
        from,
        description: `Harts ${pkg} setup fee`,
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
      amount,
      currency: 'XAF'
    });
  } catch (e) {
    console.error('initiate error:', e);
    await sbUpdate('payments', 'external_reference', external_reference, { status: 'FAILED' }).catch(() => {});
    return res.status(500).json({ error: 'Payment initiation failed' });
  }
}
