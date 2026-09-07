// Google Gemini client for the chat assistant's AI fallback layer.
//
// Underscore-prefixed → not exposed as a route, importable by api/chat.js.
// Zero dependencies: global fetch + AbortController only, matching the style of
// api/_supabase.js and api/lead.js.
//
// Required env var (set it in Vercel → Project → Settings → Environment
// Variables, the same place SUPABASE_SERVICE_ROLE_KEY and XAI_API_KEY live —
// this repo has no committed .env; .gitignore excludes .env*):
//
//   GEMINI_API_KEY            Google AI Studio key (server-side only).
//
// Optional:
//   GEMINI_MODEL              Default 'gemini-flash-latest'.
//   GEMINI_TIMEOUT_MS         Default 12000. A visitor is watching a typing
//                             indicator; past ~12s a human handover is the
//                             better answer than a slower one.
//   GEMINI_THINKING_BUDGET    Unset by default. Set to 0 to switch off the
//                             model's internal reasoning tokens on models that
//                             support it (faster, cheaper). Left unset because
//                             sending thinkingConfig to a model alias that does
//                             not support it is a hard 400 — opt in only once
//                             you have confirmed the alias you are pinned to.

const ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export function geminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function geminiModel() {
  return process.env.GEMINI_MODEL || 'gemini-flash-latest';
}

// Gemini names the assistant role 'model', and requires the turn list to begin
// with a user turn. Our client sends whatever is in the visible transcript,
// which can legitimately open on a bot greeting — so leading model turns are
// dropped rather than passed through to a 400.
function toGeminiContents(messages) {
  const mapped = (Array.isArray(messages) ? messages : [])
    .filter(m => m && typeof m.content === 'string' && m.content.trim())
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content.trim().slice(0, 4000) }]
    }));

  while (mapped.length && mapped[0].role === 'model') mapped.shift();
  return mapped;
}

// A blocked or truncated response comes back shaped like a success, just with
// no usable text in it. Pulling the reason out separately is what lets the
// caller log "SAFETY" or "MAX_TOKENS" instead of a bare "empty reply".
function extractText(data) {
  const candidate = data?.candidates?.[0];
  const text = (candidate?.content?.parts || [])
    .map(p => (typeof p?.text === 'string' ? p.text : ''))
    .join('')
    .trim();

  if (text) return { text, reason: candidate?.finishReason || null };

  const reason =
    data?.promptFeedback?.blockReason ||
    candidate?.finishReason ||
    'EMPTY_RESPONSE';
  return { text: '', reason };
}

/**
 * One call to gemini-flash-latest:generateContent.
 *
 * Never throws. Every failure path — missing key, network error, timeout,
 * non-2xx, safety block, empty candidate — resolves to { ok: false, error },
 * because the one thing this layer must never do is take the chat down. The
 * caller decides what to do with a failure; here we only report it.
 *
 * @param {object} args
 * @param {string} args.systemPrompt  Full system instruction.
 * @param {Array}  args.messages      [{ role: 'user'|'assistant', content }]
 * @returns {Promise<{ok: boolean, text?: string, error?: string, finishReason?: string|null, model: string, latencyMs: number}>}
 */
export async function callGemini({ systemPrompt, messages }) {
  const model = geminiModel();
  const startedAt = Date.now();
  const done = extra => ({ model, latencyMs: Date.now() - startedAt, ...extra });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return done({ ok: false, error: 'GEMINI_API_KEY not set' });

  const contents = toGeminiContents(messages);
  if (!contents.length) return done({ ok: false, error: 'No user turn to send' });

  const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    // Generous, because on thinking-capable models this budget is shared with
    // the reasoning tokens. Too tight and the model spends the lot thinking and
    // returns MAX_TOKENS with an empty answer.
    maxOutputTokens: 1024
  };

  const budget = process.env.GEMINI_THINKING_BUDGET;
  if (budget !== undefined && budget !== '') {
    generationConfig.thinkingConfig = { thinkingBudget: Number(budget) };
  }

  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS) || 12000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${ENDPOINT_BASE}/${model}:generateContent`, {
      method: 'POST',
      // Header rather than ?key= — keeps the secret out of any URL that a proxy,
      // a redirect or an error log might record.
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const body = (await res.text().catch(() => '')).slice(0, 400);
      return done({ ok: false, error: `Gemini HTTP ${res.status}: ${body}` });
    }

    const { text, reason } = extractText(await res.json());
    if (!text) return done({ ok: false, error: `Gemini returned no text (${reason})`, finishReason: reason });

    return done({ ok: true, text, finishReason: reason });
  } catch (err) {
    const aborted = err?.name === 'AbortError';
    return done({ ok: false, error: aborted ? `Gemini timed out after ${timeoutMs}ms` : `Gemini request failed: ${err.message}` });
  } finally {
    clearTimeout(timer);
  }
}
