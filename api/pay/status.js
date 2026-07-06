// GET /api/pay/status?ref=<external_reference>
// The chat polls this to know when the phone-approved payment has cleared.
// Reads our own record; if still PENDING, does one live re-query to Campay
// so status updates even if the webhook is delayed/not yet configured.

import {
  fetchCampayTransaction, supabaseConfigured, sbSelectOne, sbUpdate
} from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
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
