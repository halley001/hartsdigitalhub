// Lead notification fan-out. Underscore-prefixed → Vercel does NOT expose this
// as a route, but it can be imported (same convention as _supabase.js).
//
// WHY: before this existed, a lead landed in a Postgres row and nobody was told.
// A prospect could fill in the quote form on a Friday night and sit unanswered
// until someone happened to open the dashboard.
//
// Both channels are OPTIONAL and independent — configure either, both, or
// neither. Nothing here can throw: a failed notification must never turn a
// successfully-captured lead into an error for the visitor.
//
// Optional env vars (set in Vercel → Project → Settings → Environment Variables):
//
//   Telegram (free, instant, easiest — recommended):
//     TELEGRAM_BOT_TOKEN   — from @BotFather
//     TELEGRAM_CHAT_ID     — your user/group id (message @userinfobot to get it)
//
//   Email (via Resend — needs a verified sending domain):
//     RESEND_API_KEY
//     LEAD_NOTIFY_TO       — where alerts go, e.g. support@hartsdigitalhub.com
//     LEAD_NOTIFY_FROM     — verified sender, e.g. "H@rts <alerts@hartsdigitalhub.com>"

const TIMEOUT_MS = 4000;

function timeoutSignal() {
  // AbortSignal.timeout is available on Node 18+ (Vercel's runtime).
  try {
    return AbortSignal.timeout(TIMEOUT_MS);
  } catch {
    return undefined;
  }
}

// Human-readable one-screen summary. Deliberately plain text so it reads well in
// a Telegram push notification on a phone, which is where this actually gets seen.
function formatLead(lead) {
  const line = (label, value) => (value ? `${label}: ${value}\n` : '');
  const where = lead.source === 'website-lead' ? 'Website quote form' : 'AI assistant chat';

  return (
    `NEW LEAD — ${where}\n\n` +
    line('Name', lead.name) +
    line('Business', lead.business) +
    line('Phone', lead.phone) +
    line('City', lead.city) +
    line('Package', lead.package) +
    line('Payment', lead.payment_pref) +
    line('Language', lead.lang) +
    (lead.summary ? `\nDetails:\n${lead.summary}\n` : '') +
    (lead.phone ? `\nReply on WhatsApp: https://wa.me/${String(lead.phone).replace(/[^0-9]/g, '')}\n` : '')
  );
}

async function sendTelegram(lead) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return null; // not configured — not an error

  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatLead(lead),
      disable_web_page_preview: true
    }),
    signal: timeoutSignal()
  });
  if (!r.ok) throw new Error(`telegram ${r.status}: ${await r.text()}`);
  return 'telegram';
}

async function sendEmail(lead) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_TO;
  const from = process.env.LEAD_NOTIFY_FROM;
  if (!key || !to || !from) return null; // not configured — not an error

  const who = lead.name || lead.business || lead.phone || 'someone';
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      from,
      to: to.split(',').map(s => s.trim()).filter(Boolean),
      reply_to: lead.email || undefined,
      subject: `New lead: ${who}`,
      text: formatLead(lead)
    }),
    signal: timeoutSignal()
  });
  if (!r.ok) throw new Error(`resend ${r.status}: ${await r.text()}`);
  return 'email';
}

// Returns { sent: [...channels], failed: [...channels], configured: boolean }.
// Never throws, never rejects — callers can await it without a try/catch.
export async function notifyNewLead(lead) {
  const results = await Promise.allSettled([sendTelegram(lead), sendEmail(lead)]);

  const sent = [];
  const failed = [];
  let configured = false;

  for (const r of results) {
    if (r.status === 'fulfilled') {
      if (r.value) { sent.push(r.value); configured = true; }
    } else {
      configured = true;
      failed.push(String(r.reason?.message || r.reason));
      console.error('Lead notification failed:', r.reason);
    }
  }

  if (!configured) {
    // Loud enough to spot in Vercel logs, but not an error — a project can
    // legitimately run without notifications while it's being set up.
    console.warn(
      'No lead notification channel configured. Set TELEGRAM_BOT_TOKEN + ' +
      'TELEGRAM_CHAT_ID, or RESEND_API_KEY + LEAD_NOTIFY_TO + LEAD_NOTIFY_FROM.'
    );
  }

  return { sent, failed, configured };
}
