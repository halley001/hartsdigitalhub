// POST (or GET) /api/pay/webhook
// Campay calls this when a collection completes. We do NOT trust the payload
// blindly: we always re-query the transaction from Campay (authenticated) and
// reconcile the amount before marking a payment successful.

import {
  fetchCampayTransaction, verifyCampaySignature,
  supabaseConfigured, sbSelectOne, sbUpdate
} from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!supabaseConfigured()) return res.status(500).json({ error: 'Payment store not configured' });

  // Campay may send params in body (POST) or query string (GET)
  const p = { ...(req.query || {}), ...(req.body || {}) };
  const reference = p.reference;
  const external_reference = p.external_reference;
  if (!reference && !external_reference) {
    return res.status(400).json({ error: 'Missing reference' });
  }

  // Best-effort signature check (we still re-query regardless)
  const signatureOk = verifyCampaySignature(p.signature, process.env.CAMPAY_WEBHOOK_KEY);

  try {
    // Find our pending record
    const record = reference
      ? await sbSelectOne('payments', 'reference', reference)
      : await sbSelectOne('payments', 'external_reference', external_reference);

    if (!record) {
      console.error('webhook: no matching payment', { reference, external_reference });
      return res.status(200).json({ ok: true }); // ack so Campay stops retrying
    }

    // Idempotent: if already finalized, just ack
    if (record.status === 'SUCCESSFUL' || record.status === 'FAILED') {
      return res.status(200).json({ ok: true });
    }

    // Source of truth: ask Campay directly
    const txn = await fetchCampayTransaction(record.reference || reference);
    const trueStatus = (txn.status || '').toUpperCase();
    const amountOk = Number(txn.amount) === Number(record.amount);

    let finalStatus = 'PENDING';
    if (trueStatus === 'SUCCESSFUL' && amountOk) finalStatus = 'SUCCESSFUL';
    else if (trueStatus === 'FAILED' || (trueStatus === 'SUCCESSFUL' && !amountOk)) finalStatus = 'FAILED';

    if (finalStatus !== 'PENDING') {
      await sbUpdate('payments', 'external_reference', record.external_reference, {
        status: finalStatus,
        operator: txn.operator || null,
        operator_reference: txn.operator_reference || null,
        signature_verified: signatureOk,
        paid_at: finalStatus === 'SUCCESSFUL' ? new Date().toISOString() : null
      });
    }

    return res.status(200).json({ ok: true, status: finalStatus });
  } catch (e) {
    console.error('webhook error:', e);
    // Return 200 so Campay retries later rather than hammering; we log for follow-up
    return res.status(200).json({ ok: true });
  }
}
