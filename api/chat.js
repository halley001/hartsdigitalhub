// Vercel Serverless Function (or Netlify /api/chat.js equivalent)
// Place this in /api/chat.js for Vercel

import { supabaseConfigured, sbSelectAll } from './_supabase.js';

// In-memory cache, shared across warm invocations of this function instance
// (cold starts just refetch). 5-minute TTL keeps Supabase load low without
// ever serving catalog data more than a few minutes stale.
let cachedCatalogText = null;
let cachedAt = 0;
const CATALOG_TTL_MS = 5 * 60 * 1000;

// Permanent fallback — used whenever Supabase is unreachable/misconfigured, so the
// LLM's knowledge of what H@rts sells never goes missing. Mirrors app.js's
// FALLBACK_PACKAGES / FALLBACK_ENTERPRISE (kept here as prose, not objects, since
// this only ever needs to be interpolated into the system prompt as text).
const FALLBACK_CATALOG_TEXT = `SME packages (billed yearly, setup fee once):
- Starter: $80 setup + $50/year — landing page, Google Business listing, WhatsApp Business setup
- Essential: $125 setup + $165/year — 3-page website, Google Business + WhatsApp setup, 1 social platform (light), basic SEO
- Growth: $200 setup + $600/year — 5-page website, social media management (2 platforms), basic SEO, monthly report (most popular)
- Pro: $400 setup + $1,400/year — e-commerce store, Google/Facebook Ads management, WhatsApp chatbot, analytics dashboard, priority support
- Build & Launch: $300 one-time — 5-page website, Google Business + WhatsApp setup, no recurring fee
Add-ons: Logo $40, Full branding $130.

Enterprise services (custom-scoped projects, quoted individually — not fixed packages):
- Custom Software & Web Systems: ERPs, inventory engines, admin dashboards, internal tools
- Cloud & Database Architecture: performance optimization, zero-downtime migrations, scalable infrastructure
- Managed IT & SLA Retainers: monthly retainers — Standard $125/mo, Priority $400/mo, Enterprise (custom)
- AI Chatbots & Automation: chatbots for WhatsApp, websites, or other channels, integrated into new or already-existing systems (CRM, ERP, POS) — not just a WhatsApp-only feature`;

// Fetches the current catalog from Supabase and formats it as prose for the system
// prompt. Falls back to FALLBACK_CATALOG_TEXT on any failure or if the TTL cache is
// still fresh isn't available yet — this must never throw.
async function getCatalogText() {
  const now = Date.now();
  if (cachedCatalogText && (now - cachedAt) < CATALOG_TTL_MS) {
    return cachedCatalogText;
  }

  if (!supabaseConfigured()) {
    return FALLBACK_CATALOG_TEXT;
  }

  try {
    const [items, addons] = await Promise.all([
      sbSelectAll('services', 'active=eq.true&order=kind.asc,sort_order.asc'),
      sbSelectAll('service_addons', 'active=eq.true&order=sort_order.asc')
    ]);

    const packageLines = items
      .filter(r => r.kind === 'sme_package')
      .map(r => {
        const price = r.price_unit === 'year' ? `$${r.price_usd}/year`
          : r.price_unit === 'one_time' ? 'one-time, no recurring fee'
          : 'custom';
        const feats = (r.features?.en || []).join(', ');
        return `- ${r.name_en}: $${r.setup_fee_usd} setup + ${price} — ${feats}${r.popular ? ' (most popular)' : ''}`;
      }).join('\n');

    const addonLine = addons.map(a => `${a.name_en} $${a.price_usd}`).join(', ');

    const enterpriseLines = items
      .filter(r => r.kind === 'enterprise_category')
      .map(r => `- ${r.name_en}: ${r.desc_en || r.tagline_en || ''}`)
      .join('\n');

    const slaLines = items
      .filter(r => r.kind === 'sla_tier')
      .map(r => `${r.name_en} ${r.price_usd != null ? `$${r.price_usd}/mo` : '(custom)'}`)
      .join(', ');

    const text = `SME packages (billed yearly, setup fee once):\n${packageLines}\nAdd-ons: ${addonLine}.\n\n` +
      `Enterprise services (custom-scoped projects, quoted individually — not fixed packages):\n${enterpriseLines}\n` +
      `Managed IT / SLA retainers: ${slaLines}`;

    cachedCatalogText = text;
    cachedAt = now;
    return text;
  } catch (err) {
    console.error('Catalog fetch failed, using fallback:', err);
    return FALLBACK_CATALOG_TEXT;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, lang = 'en' } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  const xaiApiKey = process.env.XAI_API_KEY; // Set this in Vercel env vars
  if (!xaiApiKey) {
    return res.status(500).json({ error: 'LLM not configured' });
  }

  const catalogText = await getCatalogText();

  // Strong system prompt grounded on Harts services (no AI training)
  const systemPrompt = `You are H@rts, the warm, professional AI assistant for Harts Digital Hub, a digital agency based in Cameroon. When you introduce yourself, use the name "H@rts".

Your services (current catalog — use this for names, prices and features, don't invent your own):
${catalogText}

We also do: professional branding (logos, flyers, business cards, full visual identity) and digital marketing (social media management, Google Business optimization, WhatsApp Business setup, ads).

You guide customers conversationally through:
1. Discovery (what they do, goals, current situation)
2. Recommendation (match to the right package/service with reasons — SME packages above for small businesses, enterprise services for custom/larger projects)
3. Details collection (name, business, phone, city, preferences)
4. Flexible pricing explanation (SME packages are billed yearly; the yearly fee can be paid in full or split into 2-3 interest-free MoMo installments; enterprise projects are quoted individually)
5. Handoff to WhatsApp for payment — a human on our team confirms the amount and completes payment with the customer directly. We never auto-confirm a payment in chat; if someone says they've paid, thank them and point them to WhatsApp (+237 622 341 343) so the team can verify and confirm.
6. Review collection (1-5 rating + comment) — only after the team has confirmed a project is underway, not right after "I paid".

Key rules:
- Respond in the same language as the user (English or French).
- Be natural, empathetic, and like a real human consultant. Use short paragraphs, acknowledge what they said, ask one good follow-up question at a time when appropriate.
- ALWAYS speak as the company using "we/our/us", never "I/my/me". Harts is a company, not an individual. (e.g. "We can build that for you", not "I can build that for you".)
- Reference previous context from the conversation history when it makes sense (e.g., "For your shop in Douala...").
- Never mention AI training courses or certificates (that's a separate, unrelated program) — but you CAN and SHOULD confidently confirm we build AI chatbots as a service, since that's one of our core offerings.
- When the user is ready, guide them to share details so you can prepare a rich WhatsApp message for the team.
- Keep responses concise and actionable. Use the conversation history for context.

Current conversation history is provided. Use it to be consistent and personal.`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${xaiApiKey}`
      },
      body: JSON.stringify({
        model: 'grok-3', // or the latest Grok model available
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('xAI API error:', error);
      return res.status(500).json({ error: 'LLM service error' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Désolé, je n'ai pas bien compris. Pouvez-vous reformuler ?";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Error calling LLM:', error);
    return res.status(500).json({ error: 'Failed to get response' });
  }
}
