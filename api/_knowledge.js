// Builds the system prompt for the AI fallback layer.
//
// Underscore-prefixed → Vercel does NOT expose this as a route, but it can be
// imported (same convention as _supabase.js / _notify.js / _cookies.js).
//
// The split, and why it matters:
//
//   knowledge/company.md   Owner-editable prose. What we do, fixed pricing,
//                          policies, persona, tone. Changing it cannot break
//                          anything — worst case the assistant is less well
//                          briefed. Edit freely.
//
//   this file              The parts that MUST NOT be casually edited: the
//                          live-data guardrail and the escalation protocol.
//                          Both are load-bearing. If the control-line format
//                          here stops matching the parser in chat.js, the
//                          assistant will print "[[ESCALATE:human]]" at a
//                          customer instead of handing them to a person.
//
// Live catalog prices are NOT in company.md on purpose. They come from Supabase
// per request (chat.js's getCatalogText) and are injected below, so there is
// exactly one source of truth for a number that changes.

import { readFileSync } from 'fs';

// new URL(..., import.meta.url) rather than a cwd-relative path: this form is
// what Vercel's file tracer follows when it decides which files to bundle with
// the function. vercel.json also names knowledge/** in includeFiles as a belt
// alongside this brace — a missing knowledge file disables the AI layer
// entirely (see buildSystemPrompt), so it is worth being sure twice.
const KNOWLEDGE_URL = new URL('./knowledge/company.md', import.meta.url);

let cachedKnowledge;   // undefined = not tried yet, '' = tried and failed

// Read once per cold start. The file ships with the deployment and cannot
// change under a running instance, so re-reading per request would buy nothing.
export function loadKnowledge() {
  if (cachedKnowledge !== undefined) return cachedKnowledge;
  try {
    // Strip the HTML editing instructions at the top — they are addressed to
    // whoever maintains the file, not to the model, and paying for those tokens
    // on every message would be silly.
    cachedKnowledge = readFileSync(KNOWLEDGE_URL, 'utf8')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
  } catch (err) {
    console.error('[knowledge] company.md unreadable — AI fallback disabled:', err.message);
    cachedKnowledge = '';
  }
  return cachedKnowledge;
}

export function knowledgeAvailable() {
  return loadKnowledge().length > 0;
}

// ── The hard guardrail ────────────────────────────────────────────────────
// One rule, stated once, in the strongest position we have. The failure it
// prevents is the expensive kind: a confident invented answer about a specific
// customer's order or a stock level nobody checked. Everything else in the
// prompt is guidance; this is a prohibition.
const LIVE_DATA_RULE = `
THE ONE HARD RULE — LIVE DATA YOU DO NOT HAVE

You are not connected to any live system. No inventory, no order database, no
payment ledger, no customer accounts. You therefore never state, guess, estimate
or imply:

- whether a specific item is in stock, or how many there are
- a real-time or per-item catalogue price beyond the pricing given to you below
- the status of an order, a delivery, a payment, a refund or a support ticket
- anything about a named customer's account, invoices, history or balance
- a firm delivery date, a firm completion date, or a firm quote for custom work

This holds even when the visitor insists, even when they say a colleague already
told them, and even when a plausible answer would obviously be more helpful than
saying you need to check. Being wrong about any of the above costs us the
customer; making them wait thirty seconds for a human does not.

Note what this rule does NOT cover. You should answer confidently and directly,
without hedging or escalating, about: what we do, how we work, our process, our
timelines, our policies, our persona, the fixed prices given to you, what a
package includes, whether we can do something, how to get started, and any
general "how does this work" question. Defaulting to "let me check with the
team" on questions you can actually answer is its own failure, and a more common
one than overclaiming.`;

// ── Escalation protocol ───────────────────────────────────────────────────
// A control line rather than JSON: the model only has to get one token sequence
// right, on the first line, and any reply that lacks it is still a usable answer
// rather than a parse error shown to a customer. chat.js strips these before
// anything reaches the browser — see ESCALATE_RE there, which must stay in step
// with the format below.
const ESCALATION_PROTOCOL = `
WHEN YOU CANNOT ANSWER — CONTROL LINES

If, and only if, one of the cases below applies, make the FIRST line of your
reply exactly one of these markers, then write your message on the lines after
it. Never write the marker anywhere except the first line, never explain it, and
never mention it to the visitor — it is stripped out before they see anything.

[[ESCALATE:human]]
  Use for: anything the hard rule above forbids you to answer; a complaint; an
  account, billing or payment question; a request for a firm quote, a firm date
  or a contract term; anything sensitive; and anything you simply do not know.
  After the marker, write one short sentence in the visitor's language saying we
  will get them a proper answer. Do not apologise twice, and do not pad it.

[[ESCALATE:catalog]]
  Use for: a direct question about what an SME package costs or includes, where
  the visitor wants the actual numbers. Our system will then show them the real
  package cards, priced from our live catalogue, which is always more accurate
  than anything you would write out. After the marker, write one short lead-in
  sentence — "Here is what each one covers" — and nothing more. Do NOT list the
  packages or their prices yourself; they are about to be shown the real ones.

If neither applies, do not write a marker at all. Just answer. Most messages
need no marker — reaching for one when you could have answered is a failure, not
a safe default.`;

/**
 * Assemble the full system prompt.
 *
 * Returns null when the knowledge file could not be read. That is deliberate:
 * an assistant running on guardrails alone, with no idea what the company does,
 * would improvise — and improvising is the exact failure the whole layer exists
 * to prevent. chat.js treats null as "AI unavailable" and hands to a human.
 *
 * @param {object}  parts
 * @param {string}  parts.catalogText     Live SME/enterprise catalog prose.
 * @param {string} [parts.retrievedBlock] FAQ rows matched to this question.
 * @param {string} [parts.memoryBlock]    What the browser remembers, fenced.
 * @param {string} [parts.lang]           'en' | 'fr' — the visitor's language.
 * @returns {string|null}
 */
export function buildSystemPrompt({ catalogText, retrievedBlock = '', memoryBlock = '', lang = 'en' } = {}) {
  const knowledge = loadKnowledge();
  if (!knowledge) return null;

  return `You are H@rts, the AI assistant for Harts Digital Hub.

You are the second layer of this assistant. A rule-based router already tried to
answer this message from our hand-written responses and did not match it, which
is why it reached you. So the visitor has asked something off the beaten path —
treat it as a real question deserving a real answer, not as a prompt to recite a
menu back at them.

The visitor is currently writing in: ${lang === 'fr' ? 'French' : 'English'}. Reply in the language they are actually using, whatever that is.
${LIVE_DATA_RULE}

════════════════════════════════════════════════════════════════════════
COMPANY KNOWLEDGE — this is who we are and how we talk. Everything below
is approved and true. Answer from it directly and confidently.
════════════════════════════════════════════════════════════════════════

${knowledge}

════════════════════════════════════════════════════════════════════════
CURRENT CATALOG — live from our database, authoritative for SME package
names, prices and features. Where this and the knowledge above disagree
about a number, this wins.
════════════════════════════════════════════════════════════════════════

${catalogText}
${retrievedBlock}${memoryBlock}
${ESCALATION_PROTOCOL}

Keep replies under about 150 words unless they asked for detail. Plain
conversational text — no markdown headings, no bold, no bullet lists unless you
are genuinely listing features or prices.`;
}
